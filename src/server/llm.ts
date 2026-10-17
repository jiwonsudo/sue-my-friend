import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CASE_TYPE_LABEL, LIMITS, type CaseType } from "@/lib/constants";
import type { Draft, Tone } from "@/lib/types";
import { fail } from "./http";
import { DRAFT_ALLOWED_PHRASES, DRAFT_SYSTEM_PROMPT } from "./prompts/draft";

export type DraftInput = {
  type: CaseType;
  plaintiff_nick: string;
  defendant_nick: string;
  situation: string;
  demand: string;
};

const CANNOT = "초안을 만들 수 없는 내용이에요";
const LEAK_WINDOW = 20;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** <user_input> 태그 문자열 제거 + 길이 제한 */
export function sanitize(text: string, max: number): string {
  return text
    .replace(/<\s*\/?\s*user_input\s*>/gi, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}

function systemPrompt(): string {
  const canary = process.env.PROMPT_CANARY;
  return canary ? `${DRAFT_SYSTEM_PROMPT}\n${canary}` : DRAFT_SYSTEM_PROMPT;
}

function userMessage(input: DraftInput, tone: Tone, previous: Draft | null): string {
  return `<user_input>
사건_유형: ${CASE_TYPE_LABEL[input.type]}
원고: ${input.plaintiff_nick}
피고: ${input.defendant_nick}
무슨_일: ${input.situation}
원하는_것: ${input.demand}
</user_input>
톤: ${tone}
이전_초안: ${previous ? JSON.stringify(previous) : "없음"}`;
}

const squash = (s: string) => s.replace(/\s+/g, " ");

let promptWindows: Set<string> | null = null;
function windows(): Set<string> {
  if (promptWindows) return promptWindows;
  const p = squash(DRAFT_SYSTEM_PROMPT);
  promptWindows = new Set();
  for (let i = 0; i + LEAK_WINDOW <= p.length; i++) promptWindows.add(p.slice(i, i + LEAK_WINDOW));
  return promptWindows;
}

/** 카나리 포함, 또는 시스템 프롬프트와 연속 20자 이상 겹치면 유출로 본다. */
export function looksLeaked(raw: string): boolean {
  const canary = process.env.PROMPT_CANARY;
  if (canary && raw.includes(canary)) return true;
  let text = raw;
  for (const ok of DRAFT_ALLOWED_PHRASES) text = text.replaceAll(ok, " ");
  // JSON 이스케이프된 형태도 검사
  const candidates = [text];
  try {
    candidates.push(JSON.stringify(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1))));
  } catch {}
  const w = windows();
  for (const cand of candidates) {
    const s = squash(cand);
    for (let i = 0; i + LEAK_WINDOW <= s.length; i++) {
      if (w.has(s.slice(i, i + LEAK_WINDOW))) return true;
    }
  }
  return false;
}

export function parseDraft(raw: string): Draft | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const { title, items, preview_line } = obj as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim()) return null;
  if (!Array.isArray(items) || items.length < 3 || items.length > 6) return null;
  if (!items.every((i) => typeof i === "string" && i.trim())) return null;
  return {
    title: title.trim().slice(0, LIMITS.title),
    items: (items as string[]).map((i) => i.trim().replace(/^\d+\.\s*/, "").slice(0, LIMITS.item)),
    preview_line: (typeof preview_line === "string" ? preview_line.trim() : title.trim()).slice(0, 30),
  };
}

async function callModel(input: DraftInput, tone: Tone, previous: Draft | null): Promise<string | null> {
  const res = await anthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 8000,
    system: systemPrompt(),
    messages: [{ role: "user", content: userMessage(input, tone, previous) }],
  });
  if (res.stop_reason === "refusal") return null;
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** 키가 없는 로컬 개발 환경용 가짜 초안 */
function mockDraft(input: DraftInput, tone: Tone): string {
  const extra =
    tone === "더_킹받게"
      ? " 본인은 이 사안을 재차, 엄중히, 그리고 명백히 기억하고 있음을 밝힙니다."
      : tone === "순하게"
        ? " 바쁘신 와중에 확인해주시면 감사하겠습니다."
        : " 물론 귀하께서 바쁘셨으리라 짐작합니다.";
  return JSON.stringify({
    title: `${input.demand} 이행 촉구의 건`,
    items: [
      `귀하는 {{사건일}} 원고 ${input.plaintiff_nick}과(와)의 관계에서 다음과 같은 일이 있었음을 기억하실 것입니다: ${input.situation.slice(0, 80)}`,
      `이후 {{경과기간}}이 지나도록 귀하는 어떠한 조치도 취하지 않았습니다.${extra}`,
      "본 서면 도달 시점부터 귀하의 지체책임이 발생함을 알려드립니다(민법 제387조 제2항).",
      `이에 원고는 귀하에게 ${input.demand}을(를) {{답변기한}} 이행할 것을 청구합니다.`,
      "위 기한까지 이행하지 않을 경우 원고는 단톡방 공개를 포함한 모든 조치를 검토할 예정입니다.",
    ],
    preview_line: `${input.defendant_nick}님 앞으로 서면이 도착했습니다`,
  });
}

export async function generateDraft(input: DraftInput, tone: Tone, previous: Draft | null): Promise<Draft> {
  const useMock = !process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== "production";
  let parseFailures = 0;
  let leaks = 0;
  while (true) {
    let raw: string | null;
    try {
      raw = useMock ? mockDraft(input, tone) : await callModel(input, tone, previous);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) fail(429, "요청이 많아요. 잠시 후 다시 시도해주세요.");
      if (e instanceof Anthropic.APIError) {
        console.error("[draft] anthropic error", e.status);
        fail(502, "초안 작성에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
      throw e;
    }
    if (raw === null) fail(422, CANNOT);
    if (looksLeaked(raw)) {
      // 폐기 후 재생성. 2회 연속이면 포기.
      if (++leaks >= 2) fail(422, CANNOT);
      continue;
    }
    leaks = 0;
    const draft = parseDraft(raw);
    if (draft && !looksLeaked(JSON.stringify(draft))) return draft;
    if (++parseFailures > 1) fail(422, CANNOT);
  }
}
