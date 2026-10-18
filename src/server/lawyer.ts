import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { LIMITS } from "@/lib/constants";
import { LAW_BY_ID, lawLabel, lawsFor, type Law, type LawyerSuggestion } from "@/lib/laws";
import type { CaseRow, Role, StatementRow } from "@/lib/types";
import { costOf, estimateInputTokens, lawyerBudgetUsd, maxOutputTokens, model } from "./aiBudget";
import { sanitize } from "./llm";
import { LAWYER_SYSTEM_PROMPT } from "./prompts/lawyer";
import { db } from "./supabase";

/** 광고 티켓 발급 뒤 이만큼은 지나야 선임된다 (광고를 건너뛰고 바로 요청하는 것 방지) */
export const MIN_AD_MS = 5000;
const LAWYER_MAX_OUTPUT = 1500;
const LAWYER_MIN_OUTPUT = 400;

export type LawyerUseRow = {
  id: string;
  case_id: string;
  role: Role;
  round: number;
  ticket_hash: string;
  ticket_issued_at: string;
  granted_at: string | null;
  suggestions: LawyerSuggestion[] | null;
};

export async function fetchLawyerUse(caseId: string, role: Role, round: number): Promise<LawyerUseRow | null> {
  const { data } = await db().from("lawyer_uses").select("*").eq("case_id", caseId).eq("role", role).eq("round", round).maybeSingle();
  return (data as LawyerUseRow) ?? null;
}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

/** 키가 없거나 호출이 실패했을 때: 사건 유형에 맞는 조항 3개로 정해진 문장을 만든다 */
export function templateSuggestions(laws: Law[], target: StatementRow | null): LawyerSuggestion[] {
  const sentences = target?.sentences ?? [];
  return laws.slice(0, 3).map((law, i) => {
    const idx = sentences.length ? i % sentences.length : null;
    const quoted = idx != null ? `「${sentences[idx].slice(0, 40)}」라는 주장은` : "상대방의 주장은";
    return {
      lawId: law.id,
      targetIdx: idx,
      sentence: `${law.code} ${law.article}의 취지(${law.title})에 비추어 볼 때, ${quoted} 받아들일 수 없습니다.`.slice(0, LIMITS.sentence),
    };
  });
}

function parse(raw: string, allowed: Set<string>, targetLen: number): LawyerSuggestion[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    const o = JSON.parse(raw.slice(start, end + 1)) as { objections?: unknown };
    if (!Array.isArray(o.objections)) return [];
    const out: LawyerSuggestion[] = [];
    for (const it of o.objections as Record<string, unknown>[]) {
      const lawId = typeof it.law_id === "string" ? it.law_id : "";
      const sentence = typeof it.sentence === "string" ? sanitize(it.sentence.replace(/\s+/g, " "), LIMITS.sentence) : "";
      const t = typeof it.target_idx === "number" && Number.isInteger(it.target_idx) ? it.target_idx : null;
      if (!allowed.has(lawId) || !sentence || out.some((s) => s.lawId === lawId)) continue;
      out.push({ lawId, sentence, targetIdx: targetLen ? (t != null && t >= 0 && t < targetLen ? t : 0) : null });
      if (out.length === 3) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * 반박할 상대 증언을 보고 조항 인용 이의 2~3개를 추천한다. 어떤 경우에도 추천은 돌려준다.
 * 비용은 1회 상한(lawyerBudgetUsd) 안에서만 쓴다.
 */
export async function suggestObjections(c: CaseRow, target: StatementRow | null, role: Role): Promise<{ suggestions: LawyerSuggestion[]; costUsd: number }> {
  const laws = lawsFor(c.type);
  const fallback = { suggestions: templateSuggestions(laws, target), costUsd: 0 };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  const me = role === "plaintiff" ? "원고" : "피고";
  const content = `<user_input>
의뢰인: ${me} ${sanitize(role === "plaintiff" ? c.plaintiff_nick : c.defendant_nick, 20)}
상대방: ${role === "plaintiff" ? "피고" : "원고"} ${sanitize(role === "plaintiff" ? c.defendant_nick : c.plaintiff_nick, 20)}
경위(원고 주장): ${sanitize(c.situation, 500)}
청구: ${sanitize(c.demand, 100)}
상대 증언:
${target?.sentences.length ? target.sentences.map((s, i) => `${i}. ${sanitize(s, 200)}`).join("\n") : "(없음: 의뢰인이 먼저 말하는 차례. 원고의 경위와 청구를 겨냥한다)"}
</user_input>
조항 목록 (id: 조항 — 요지):
${laws.map((l) => `${l.id}: ${lawLabel(l)} — ${l.gist}`).join("\n")}`;
  const system = process.env.PROMPT_CANARY ? `${LAWYER_SYSTEM_PROMPT}\n${process.env.PROMPT_CANARY}` : LAWYER_SYSTEM_PROMPT;
  const maxTokens = maxOutputTokens(lawyerBudgetUsd(), estimateInputTokens(system, content), LAWYER_MAX_OUTPUT);
  if (maxTokens < LAWYER_MIN_OUTPUT) return fallback;

  try {
    const res = await anthropic().messages.create({
      model: model(),
      max_tokens: maxTokens,
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content }],
    });
    const costUsd = costOf(res.usage);
    if (res.stop_reason === "refusal") return { ...fallback, costUsd };
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const canary = process.env.PROMPT_CANARY;
    if (canary && raw.includes(canary)) return { ...fallback, costUsd };
    const suggestions = parse(raw, new Set(laws.map((l) => l.id)), target?.sentences.length ?? 0);
    return { suggestions: suggestions.length >= 2 ? suggestions : fallback.suggestions, costUsd };
  } catch (e) {
    console.error("[lawyer] anthropic error", e instanceof Anthropic.APIError ? e.status : e);
    return fallback;
  }
}

export function lawOf(id: string | null | undefined): Law | null {
  return id ? (LAW_BY_ID.get(id) ?? null) : null;
}
