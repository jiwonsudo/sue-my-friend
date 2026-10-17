import type { Role, StatementRow, TrialSlot } from "./types";

/** 공방 순서: 6개 슬롯을 순서대로 하나씩 채운다. */
export const TRIAL_SLOTS: TrialSlot[] = [
  { round: 1, role: "plaintiff", kind: "testimony" },
  { round: 1, role: "defendant", kind: "rebuttal" },
  { round: 2, role: "defendant", kind: "testimony" },
  { round: 2, role: "plaintiff", kind: "rebuttal" },
  { round: 3, role: "plaintiff", kind: "final" },
  { round: 3, role: "defendant", kind: "final" },
];

export function currentSlot(statements: Pick<StatementRow, "id">[]): TrialSlot | null {
  return TRIAL_SLOTS[statements.length] ?? null;
}

/** 반박 대상: 같은 라운드의 상대 증언 */
export function rebuttalTarget(statements: StatementRow[], round: number): StatementRow | null {
  return statements.find((s) => s.round === round && s.kind === "testimony") ?? null;
}

export const otherRole = (r: Role): Role => (r === "plaintiff" ? "defendant" : "plaintiff");

export const ROLE_LABEL: Record<Role, string> = { plaintiff: "원고", defendant: "피고" };

export const KIND_LABEL = { testimony: "증언", rebuttal: "반박", final: "최후진술" } as const;

/** 가장 많이 반박당한 문장 */
export function mostRebutted(statements: StatementRow[]): string | null {
  const counts = new Map<string, number>();
  for (const s of statements) {
    if (s.kind !== "rebuttal" || s.forfeited || !s.target_statement_id || s.target_sentence_idx == null) continue;
    const key = `${s.target_statement_id}:${s.target_sentence_idx}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  if (!best) return null;
  const [id, idx] = best.split(":");
  return statements.find((s) => s.id === id)?.sentences[Number(idx)] ?? null;
}
