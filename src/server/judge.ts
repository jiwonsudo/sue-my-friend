import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { DEFENSE_CARDS } from "@/lib/constants";
import { KIND_LABEL, ROLE_LABEL } from "@/lib/trial";
import type { CaseRow, StatementRow, Verdict } from "@/lib/types";
import { addCaseCost, caseBudgetUsd, costOf, estimateInputTokens, JUDGE_MAX_OUTPUT, maxOutputTokens, model } from "./aiBudget";
import { sanitize } from "./llm";
import { JUDGE_SYSTEM_PROMPT } from "./prompts/judge";

type Ruling = { verdict: Extract<Verdict, "plaintiff" | "defendant" | "both">; reason: string };

const REASON_MAX = 300;
/** 판결 JSON 한 줄을 쓰려면 이 정도는 필요하다. 남은 예산이 이보다 적으면 규칙 기반으로 판결 */
const JUDGE_MIN_OUTPUT = 600;

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

function transcript(c: CaseRow, statements: StatementRow[]): string {
  const lines = statements.map((s) => {
    const head = `[${s.round}라운드 ${ROLE_LABEL[s.role]} ${KIND_LABEL[s.kind]}]`;
    if (s.forfeited) return `${head} (기한 내 진술하지 않아 진술 포기)`;
    const target = s.target_statement_id ? statements.find((x) => x.id === s.target_statement_id) : null;
    const quoted = target && s.target_sentence_idx != null ? ` 반박 대상: 「${sanitize(target.sentences[s.target_sentence_idx] ?? "", 200)}」` : "";
    const card = DEFENSE_CARDS.find((d) => d.id === s.card_id);
    return `${head}${quoted} ${s.sentences.map((t) => sanitize(t, 200)).join(" ")}${card ? ` (항변 카드: ${card.name})` : ""}${s.evidence_id ? " (증거 사진 제출)" : ""}`;
  });
  return `<user_input>
원고: ${sanitize(c.plaintiff_nick, 20)}
피고: ${sanitize(c.defendant_nick, 20)}
경위(원고 주장): ${sanitize(c.situation, 500)}
청구: ${sanitize(c.demand, 100)}
공방 기록:
${lines.join("\n")}
</user_input>`;
}

function parse(raw: string): Ruling | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const o = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    if (o.verdict !== "plaintiff" && o.verdict !== "defendant" && o.verdict !== "both") return null;
    if (typeof o.reason !== "string" || !o.reason.trim()) return null;
    return { verdict: o.verdict, reason: o.reason.trim().slice(0, REASON_MAX) };
  } catch {
    return null;
  }
}

function leaked(text: string): boolean {
  const canary = process.env.PROMPT_CANARY;
  if (canary && text.includes(canary)) return true;
  return text.includes("user_input") || text.includes("시스템 프롬프트") || text.includes(JUDGE_SYSTEM_PROMPT.slice(0, 30));
}

/** 키가 없거나 호출이 실패했을 때: 진술을 포기한 턴이 적은 쪽이 이긴다. 같으면 쌍방 과실. */
export function ruleBasedRuling(statements: StatementRow[]): Ruling {
  const spoke = (r: "plaintiff" | "defendant") => statements.filter((s) => s.role === r && !s.forfeited).length;
  const p = spoke("plaintiff");
  const d = spoke("defendant");
  if (p === d) {
    return {
      verdict: "both",
      reason: "본 법정은 양측이 제출한 진술을 검토하였으나 어느 한쪽의 주장이 우월하다고 볼 근거를 찾지 못하였다. 따라서 양측의 과실을 동등하게 본다.",
    };
  }
  const winner = p > d ? "plaintiff" : "defendant";
  return {
    verdict: winner,
    reason: `본 법정은 양측이 제출한 진술을 검토하였다. ${winner === "plaintiff" ? "피고" : "원고"}는 주어진 진술 기회 일부를 행사하지 아니하였고, 본 법정은 그 침묵을 불리하게 본다.`,
  };
}

/**
 * 배심원 없이 AI 재판장이 각자 제출한 진술을 바탕으로 판결한다. 어떤 경우에도 판결은 낸다.
 * 사건당 AI 예산에서 남은 만큼만 쓰고, 모자라면 부르지 않고 규칙 기반으로 판결한다.
 */
export async function aiRuling(c: CaseRow, statements: StatementRow[]): Promise<Ruling> {
  if (!process.env.ANTHROPIC_API_KEY) return ruleBasedRuling(statements);
  const system = process.env.PROMPT_CANARY ? `${JUDGE_SYSTEM_PROMPT}\n${process.env.PROMPT_CANARY}` : JUDGE_SYSTEM_PROMPT;
  const content = transcript(c, statements);
  const remaining = caseBudgetUsd() - Number(c.ai_cost_usd ?? 0);
  const maxTokens = maxOutputTokens(remaining, estimateInputTokens(system, content), JUDGE_MAX_OUTPUT);
  if (maxTokens < JUDGE_MIN_OUTPUT) return ruleBasedRuling(statements);
  try {
    const res = await anthropic().messages.create({
      model: model(),
      max_tokens: maxTokens,
      // 판결 한 줄 + 이유 2~3문장. 생각 토큰도 출력 요금이라 낮게 둔다.
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content }],
    });
    await addCaseCost(c.id, costOf(res.usage));
    if (res.stop_reason === "refusal") return ruleBasedRuling(statements);
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const ruling = parse(raw);
    if (!ruling || leaked(ruling.reason)) return ruleBasedRuling(statements);
    return ruling;
  } catch (e) {
    console.error("[judge] anthropic error", e instanceof Anthropic.APIError ? e.status : e);
    return ruleBasedRuling(statements);
  }
}
