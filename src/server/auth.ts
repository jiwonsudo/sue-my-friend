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
