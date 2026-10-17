import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "./supabase";

/** 100만 토큰당 USD (입력, 출력). 모르는 모델은 가장 비싼 축으로 잡는다. */
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-opus-5-5": { in: 4, out: 20 },
};
const FALLBACK_PRICE = { in: 10, out: 50 };

export const DEFAULT_MODEL = "claude-sonnet-5-5";

export function model(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

function price() {
  const p = PRICES[model()] ?? FALLBACK_PRICE;
  return { in: p.in / 1_000_000, out: p.out / 1_000_000 };
}

/** 사건 1건에 쓸 수 있는 AI 비용 상한 (USD). 기본 200원 / 1,400원 */
export function caseBudgetUsd(): number {
  const krw = Number(process.env.AI_BUDGET_KRW_PER_CASE ?? 200);
  const rate = Number(process.env.KRW_PER_USD ?? 1400);
  return krw / rate;
}

/** 입력 토큰 상한 추정: 한글은 글자당 1토큰 안팎이라 1.5배로 넉넉히 잡는다 (모자라게 잡으면 예산을 넘을 수 있음) */
export function estimateInputTokens(...texts: string[]): number {
  return Math.ceil(texts.reduce((n, t) => n + [...t].length, 0) * 1.5) + 300;
}

/** 실제로 청구된 금액 (캐시 쓰기 1.25배, 캐시 읽기 0.1배) */
export function costOf(usage: Anthropic.Usage): number {
  const p = price();
  const write = usage.cache_creation_input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  return usage.input_tokens * p.in + write * p.in * 1.25 + read * p.in * 0.1 + usage.output_tokens * p.out;
}

/**
 * 남은 예산 안에서 쓸 수 있는 최대 출력 토큰. 입력 비용을 먼저 빼고 나머지를 출력에 배정한다.
 * 출력은 max_tokens 를 넘지 않으므로, 이 값을 max_tokens 로 쓰면 호출 1번이 예산을 넘을 수 없다.
 */
export function maxOutputTokens(remainingUsd: number, inputTokens: number, cap: number): number {
  const p = price();
  const forOutput = remainingUsd - inputTokens * p.in;
  return Math.max(0, Math.min(cap, Math.floor(forOutput / p.out)));
}

/** AI 재판장 몫으로 남겨 둘 금액: 입력 추정 상한(공판조서 최대 길이 기준 8천 토큰) + 출력 상한 */
export const JUDGE_MAX_OUTPUT = 3000;
export function judgeReserveUsd(): number {
  const p = price();
  return 8000 * p.in + JUDGE_MAX_OUTPUT * p.out;
}

export async function addCaseCost(caseId: string, usd: number) {
  if (usd <= 0) return;
  await db().rpc("add_ai_cost", { p_case_id: caseId, p_usd: Number(usd.toFixed(6)) });
}

/** AI 변호인 1회 비용 상한 (USD). 광고로 생긴 몫이라 사건 예산과 따로 센다. 기본 40원 */
export function lawyerBudgetUsd(): number {
  const krw = Number(process.env.AI_LAWYER_BUDGET_KRW ?? 40);
  const rate = Number(process.env.KRW_PER_USD ?? 1400);
  return krw / rate;
}
