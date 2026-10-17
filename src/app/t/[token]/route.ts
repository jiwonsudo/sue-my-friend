import { NextResponse, type NextRequest } from "next/server";
import { resolveToken, setPartyCookie } from "@/server/auth";

/** 공방 호출 링크: 상대가 "내 차례" 알림으로 받은 주소. 토큰을 쿠키로 옮기고 공방 화면으로 바로 보낸다. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await resolveToken(token);
  if (!found) return NextResponse.redirect(new URL("/?expired=1", req.url));
  // 배심원 제도는 없어졌다 (예전 배심원 링크)
  if (found.role === "jury") return NextResponse.redirect(new URL("/?expired=1", req.url));
  const res = NextResponse.redirect(new URL(`/case/${found.caseId}/trial?as=${found.role}`, req.url));
  setPartyCookie(res, found.caseId, found.role, token);
  return res;
}
