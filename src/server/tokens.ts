import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type { TokenRole } from "@/lib/types";

/** 32바이트 랜덤, URL-safe */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function secret(): string {
  const s = process.env.TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error("TOKEN_SECRET(32자 이상)이 설정되지 않았습니다.");
  return s;
}

/**
 * 피고 토큰은 원고가 현황판에서 다시 볼 수 있어야 하므로
 * (사건 id, 역할, 사건별 salt)에서 HMAC 으로 파생한다. DB 에는 해시만 저장.
 */
export function deriveToken(caseId: string, role: Exclude<TokenRole, "plaintiff">, salt: string): string {
  return createHmac("sha256", secret()).update(`${caseId}:${role}:${salt}`).digest("base64url");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
