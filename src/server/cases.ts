import "server-only";
import { CLOSED_RETENTION_MS, RESPONSE_WINDOW_MS, TURN_WINDOW_MS } from "@/lib/constants";
import { orderText } from "@/lib/document";
import { mostRebutted, TRIAL_SLOTS } from "@/lib/trial";
import type { CaseRow, JudgmentRow, Role, StatementRow, Verdict } from "@/lib/types";
import { db } from "./supabase";
import { fail } from "./http";
import { aiRuling } from "./judge";
import { deriveToken, hashToken } from "./tokens";

export async function fetchCase(id: string): Promise<CaseRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db().from("cases").select("*").eq("id", id).maybeSingle();
  const c = (data as CaseRow) ?? null;
  // 보관 시간이 지난 사건은 DB 정리 작업(10분 간격)이 돌기 전이라도 없는 것으로 본다
  if (c && isPurged(c)) return null;
  return c;
}

export function isPurged(c: CaseRow, now = Date.now()): boolean {
  return !!c.closed_at && now > purgeAt(c.closed_at).getTime();
}

export function purgeAt(closedAt: string): Date {
  return new Date(new Date(closedAt).getTime() + CLOSED_RETENTION_MS);
}

/** 사건을 불러오면서 지난 기한을 반영한다 (lazy 기한 처리). */
export async function loadCase(id: string): Promise<CaseRow | null> {
  const c = await fetchCase(id);
  if (!c) return null;
  const changed = await advance(c);
  return changed ? await fetchCase(id) : c;
}

export async function requireCase(id: string): Promise<CaseRow> {
  const c = await loadCase(id);
  if (!c) fail(404, "사건을 찾을 수 없습니다.");
  return c;
}

export async function fetchStatements(caseId: string): Promise<StatementRow[]> {
  const { data } = await db()
    .from("statements")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  return (data as StatementRow[]) ?? [];
}

export async function fetchJudgment(caseId: string): Promise<JudgmentRow | null> {
  const { data } = await db().from("judgments").select("*").eq("case_id", caseId).maybeSingle();
  return (data as JudgmentRow) ?? null;
}

/** 상태가 바뀌었으면 true */
async function advance(c: CaseRow, now = Date.now()): Promise<boolean> {
  // 답변 기한 무응답 → 궐석 판결
  if (
    (c.status === "sent" || c.status === "opened") &&
    !c.defendant_response &&
    c.response_deadline_at &&
    now > new Date(c.response_deadline_at).getTime()
  ) {
    const { data } = await db()
      .from("cases")
      .update({ defendant_response: "ignore" })
      .eq("id", c.id)
      .in("status", ["sent", "opened"])
      .is("defendant_response", null)
      .select("id");
    if (data?.length) await createJudgment(c, "default");
    return true;
  }

  if (c.status === "trial") {
    const statements = await fetchStatements(c.id);
    let changed = false;
    let last = statements.at(-1)?.created_at ?? c.trial_started_at ?? c.created_at;
    // 지난 턴은 "진술 포기"로 기록하고 넘어간다
    for (let i = statements.length; i < TRIAL_SLOTS.length; i++) {
      const deadline = new Date(last).getTime() + TURN_WINDOW_MS;
      if (now <= deadline) break;
      const slot = TRIAL_SLOTS[i];
      const at = new Date(deadline).toISOString();
      await db().from("statements").insert({
        case_id: c.id,
        round: slot.round,
        role: slot.role,
        kind: slot.kind,
        sentences: [],
        forfeited: true,
        created_at: at,
      }); // unique 제약 위반(동시 요청)은 무시
      last = at;
      changed = true;
    }
    const count = changed ? (await fetchStatements(c.id)).length : statements.length;
    if (count >= TRIAL_SLOTS.length) {
      await finishTrial(c);
      changed = true;
    }
    if (changed) {
      const again = await fetchCase(c.id);
      if (again) await advance(again, now);
    }
    return changed;
  }

  // 예전 방식(배심원 투표)으로 남은 사건이 있으면 바로 AI 재판장 판결
  if (c.status === "voting") {
    await judgeByAi(c);
    return true;
  }
  return false;
}

/** 공방 6턴이 모두 끝났을 때: AI 재판장이 바로 판결 */
export async function finishTrial(c: CaseRow) {
  const fresh = (await fetchCase(c.id)) ?? c;
  if (fresh.status !== "trial") return;
  await judgeByAi(fresh);
}

async function judgeByAi(c: CaseRow) {
  // 이미 판결이 있으면 다시 부르지 않는다 (동시 요청)
  if (await fetchJudgment(c.id)) return;
  const ruling = await aiRuling(c, await fetchStatements(c.id));
  await createJudgment(c, ruling.verdict, { reason: ruling.reason, judgedBy: "judge" });
}

export async function createJudgment(
  c: CaseRow,
  verdict: Verdict,
  opts: { reason?: string; judgedBy?: JudgmentRow["judged_by"] } = {},
) {
  const judgedBy = opts.judgedBy ?? "system";
  let reason: string;
  if (opts.reason) {
    reason = opts.reason;
  } else if (verdict === "settled") {
    reason = "피고는 통고서를 열람한 후 다툼 없이 원고의 청구를 받아들였다. 본 법정은 피고의 빠른 판단을 높이 평가한다.";
  } else if (verdict === "default") {
    reason = "피고는 답변 기한 내에 아무런 대응을 하지 아니하였다. 본 법정은 피고의 침묵을 청구의 자백으로 본다.";
  } else {
    // AI 재판장이 이유를 주지 못한 경우의 기본 문구
    const quote = mostRebutted(await fetchStatements(c.id));
    reason = "본 법정은 양측이 제출한 진술을 검토하였다.";
    if (quote) reason += ` 공방 중 가장 많이 반박당한 진술은 「${quote}」였다.`;
  }
  await db()
    .from("judgments")
    .upsert(
      { case_id: c.id, verdict, order_text: orderText(verdict, c.demand), reason_text: reason, judged_by: judgedBy },
      { onConflict: "case_id", ignoreDuplicates: true },
    );
  await db().from("cases").update({ status: "judged" }).eq("id", c.id).not("status", "in", "(judged,executed,dismissed)");
}

/** 발송: 피고 토큰 등록, 기한 설정 */
export async function sendCase(c: CaseRow) {
  const now = new Date();
  const defToken = deriveToken(c.id, "defendant", c.token_salt);
  await db()
    .from("party_tokens")
    .upsert(
      [
        { case_id: c.id, role: "defendant", token_hash: hashToken(defToken) },
      ],
      { onConflict: "case_id,role" },
    );
  const { data } = await db()
    .from("cases")
    .update({
      status: "sent",
      sent_at: now.toISOString(),
      response_deadline_at: new Date(now.getTime() + RESPONSE_WINDOW_MS).toISOString(),
    })
    .eq("id", c.id)
    .eq("status", "draft")
    .select("id");
  if (!data?.length) fail(409, "이미 발송된 사건입니다.");
}

/**
 * 공방 차례 알림 링크: 받는 사람의 토큰을 담아 어느 기기·브라우저(카톡 인앱 포함)에서 열어도 바로 입장한다.
 * 원고 토큰이 랜덤이던 예전 사건은 원고 링크를 만들 수 없어 공방 주소만 준다.
 */
export async function notifyLinks(c: CaseRow, origin: string): Promise<Record<Role, string>> {
  const plaintiff = deriveToken(c.id, "plaintiff", c.token_salt);
  const { data } = await db()
    .from("party_tokens")
    .select("token_hash")
    .eq("case_id", c.id)
    .eq("role", "plaintiff")
    .maybeSingle();
  return {
    defendant: `${origin}/t/${deriveToken(c.id, "defendant", c.token_salt)}`,
    plaintiff: data?.token_hash === hashToken(plaintiff) ? `${origin}/t/${plaintiff}` : `${origin}/case/${c.id}/trial?as=plaintiff`,
  };
}

export function partyLinks(c: CaseRow, origin: string) {
  if (c.status === "draft") return null;
  return {
    defendant: `${origin}/c/${deriveToken(c.id, "defendant", c.token_salt)}`,
  };
}
