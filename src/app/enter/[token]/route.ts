import { NextResponse, type NextRequest } from "next/server";
import { resolveToken, setPartyCookie } from "@/server/auth";

/** "내 사건 링크": 토큰을 쿠키로 옮기고 깨끗한 주소로 보낸다. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await resolveToken(token);
  if (!found) return NextResponse.redirect(new URL("/?expired=1", req.url));
  // 배심원 제도는 없어졌다 (예전 배심원 링크)
  if (found.role === "jury") return NextResponse.redirect(new URL("/?expired=1", req.url));
  if (found.role === "defendant") return NextResponse.redirect(new URL(`/c/${token}`, req.url));
  const res = NextResponse.redirect(new URL(`/case/${found.caseId}`, req.url));
  setPartyCookie(res, found.caseId, found.role, token);
  return res;
}
