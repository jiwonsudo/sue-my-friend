import "server-only";
import { RESPONSE_WINDOW_MS, TURN_WINDOW_MS, VOTING_WINDOW_MS } from "@/lib/constants";
import { orderText } from "@/lib/document";
import { mostRebutted, TRIAL_SLOTS } from "@/lib/trial";
import type { CaseRow, JudgmentRow, StatementRow, Verdict } from "@/lib/types";
import { db } from "./supabase";
import { fail } from "./http";
import { deriveToken, hashToken } from "./tokens";

export async function fetchCase(id: string): Promise<CaseRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db().from("cases").select("*").eq("id", id).maybeSingle();
  return (data as CaseRow) ?? null;
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

export async function tallyVotes(caseId: string) {
  const { data } = await db().from("votes").select("verdict").eq("case_id", caseId);
  const t = { plaintiff: 0, defendant: 0, both: 0 };
  for (const v of data ?? []) t[v.verdict as keyof typeof t]++;
  return t;
}

/** 상태가 바뀌었으면 true */
async function advance(c: CaseRow, now = Date.now()): Promise<boolean> {
  // 24시간 무응답 → 궐석 판결
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
      await startVoting(c.id, new Date(new Date(last).getTime() + VOTING_WINDOW_MS));
      changed = true;
    }
    if (changed) {
      const again = await fetchCase(c.id);
      if (again) await advance(again, now);
    }
    return changed;
  }

  if (c.status === "voting" && c.voting_deadline_at && now > new Date(c.voting_deadline_at).getTime()) {
    const t = await tallyVotes(c.id);
    const max = Math.max(t.plaintiff, t.defendant, t.both);
    const winners = (Object.keys(t) as (keyof typeof t)[]).filter((k) => t[k] === max);
    const verdict: Verdict = max === 0 || winners.length > 1 ? "both" : winners[0];
    await createJudgment(c, verdict, t);
    return true;
  }
  return false;
}

export async function startVoting(caseId: string, deadline: Date) {
  await db()
    .from("cases")
    .update({ status: "voting", voting_deadline_at: deadline.toISOString() })
    .eq("id", caseId)
    .eq("status", "trial");
}

export async function createJudgment(
  c: CaseRow,
  verdict: Verdict,
  votes?: { plaintiff: number; defendant: number; both: number },
) {
  let reason: string;
  if (verdict === "settled") {
    reason = "피고는 통고서를 열람한 후 다툼 없이 원고의 청구를 받아들였다. 본 법정은 피고의 빠른 판단을 높이 평가한다.";
  } else if (verdict === "default") {
    reason = "피고는 답변 기한 내에 아무런 대응을 하지 아니하였다. 본 법정은 피고의 침묵을 청구의 자백으로 본다.";
  } else {
    const t = votes ?? { plaintiff: 0, defendant: 0, both: 0 };
    const total = t.plaintiff + t.defendant + t.both;
    const quote = mostRebutted(await fetchStatements(c.id));
    reason =
      total === 0
        ? "배심원이 한 명도 참여하지 아니하였으므로 양측의 과실을 동등하게 본다."
        : `배심원 ${total}명이 평결에 참여하여 원고 승 ${t.plaintiff}표, 피고 승 ${t.defendant}표, 쌍방 과실 ${t.both}표로 판단하였다.`;
    if (quote) reason += ` 공방 중 가장 많이 반박당한 진술은 「${quote}」였다.`;
  }
  await db()
    .from("judgments")
    .upsert(
      { case_id: c.id, verdict, order_text: orderText(verdict, c.demand), reason_text: reason },
      { onConflict: "case_id", ignoreDuplicates: true },
    );
  await db().from("cases").update({ status: "judged" }).eq("id", c.id).not("status", "in", "(judged,executed,dismissed)");
}

/** 발송: 피고·배심원 토큰 등록, 기한 설정 */
export async function sendCase(c: CaseRow) {
  const now = new Date();
  const defToken = deriveToken(c.id, "defendant", c.token_salt);
  const juryToken = deriveToken(c.id, "jury", c.token_salt);
  await db()
    .from("party_tokens")
    .upsert(
      [
        { case_id: c.id, role: "defendant", token_hash: hashToken(defToken) },
        { case_id: c.id, role: "jury", token_hash: hashToken(juryToken) },
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

export function partyLinks(c: CaseRow, origin: string) {
  if (c.status === "draft") return null;
  return {
    defendant: `${origin}/c/${deriveToken(c.id, "defendant", c.token_salt)}`,
    jury: `${origin}/j/${deriveToken(c.id, "jury", c.token_salt)}`,
  };
}
