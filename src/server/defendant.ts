import "server-only";
import type { CaseRow } from "@/lib/types";
import { resolveToken } from "./auth";
import { loadCase } from "./cases";
import { fail } from "./http";

/** 피고 링크 토큰으로 사건을 불러온다. 발송 전이면 없는 것으로 취급. */
export async function caseForDefendantToken(token: string): Promise<CaseRow | null> {
  const found = await resolveToken(token);
  if (!found || found.role !== "defendant") return null;
  const c = await loadCase(found.caseId);
  if (!c || c.status === "draft") return null;
  return c;
}

export async function requireDefendantCase(token: string): Promise<CaseRow> {
  const c = await caseForDefendantToken(token);
  if (!c) fail(404, "사건을 찾을 수 없습니다.");
  return c;
}
