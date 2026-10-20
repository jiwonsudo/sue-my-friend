import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Role, TokenRole } from "@/lib/types";
import { db } from "./supabase";
import { fail } from "./http";
import { hashToken } from "./tokens";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60일

export function partyCookieName(caseId: string, role: Role): string {
  return `smf_${role === "plaintiff" ? "p" : "d"}_${caseId}`;
}

export function setPartyCookie(res: NextResponse, caseId: string, role: Role, token: string) {
  res.cookies.set(partyCookieName(caseId, role), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** 토큰 → (사건, 역할). 없으면 null */
export async function resolveToken(
  token: string | null | undefined,
): Promise<{ caseId: string; role: TokenRole } | null> {
  if (!token || token.length < 32 || token.length > 128) return null;
  const { data } = await db()
    .from("party_tokens")
    .select("case_id, role")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data) return null;
  return { caseId: data.case_id as string, role: data.role as TokenRole };
}

/** 쿠키로 확인된 이 사건에서의 내 역할들 (같은 브라우저에서 양쪽 다 테스트할 수 있으므로 배열) */
export async function rolesForCase(caseId: string): Promise<Role[]> {
  const jar = await cookies();
  const roles: Role[] = [];
  for (const role of ["plaintiff", "defendant"] as Role[]) {
    const token = jar.get(partyCookieName(caseId, role))?.value;
    const found = await resolveToken(token);
    if (found && found.caseId === caseId && found.role === role) roles.push(role);
  }
  return roles;
}

/**
 * 공방(진술·변호인·증거·공방 조회)은 쿠키로 주인을 가리지 않는다. 링크를 받은 사람이 원고·피고 중 골라 들어오고,
 * 요청마다 ?as= 로 어느 쪽으로 말하는지 밝힌다. (친구끼리 하는 장난이라 상대 행세는 막지 않기로 함)
 */
export function trialRole(as: string | null | undefined): Role {
  if (as !== "plaintiff" && as !== "defendant") fail(400, "원고·피고 중 어느 쪽으로 입장했는지 알 수 없습니다.");
  return as;
}

/** 허용된 역할 중 하나로 인증. prefer 가 있으면 우선. */
export async function requireRole(caseId: string, allowed: Role[], prefer?: Role | null): Promise<Role> {
  const mine = (await rolesForCase(caseId)).filter((r) => allowed.includes(r));
  if (mine.length === 0) fail(403, "이 사건에 대한 권한이 없습니다.");
  if (prefer && mine.includes(prefer)) return prefer;
  return mine[0];
}

export async function plaintiffTokenFromCookie(caseId: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(partyCookieName(caseId, "plaintiff"))?.value ?? null;
}
