import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth";
import { partyLinks, requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle } from "@/server/http";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ id: string }> };

/** 배심원 초대: 공방 중에 당사자 한쪽이 부르면 그때부터 배심원 링크가 열린다. 이미 초대됐으면 링크만 돌려준다. */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  await requireRole(c.id, ["plaintiff", "defendant"]);
  if (!c.jury_invited_at) {
    if (c.status !== "trial") fail(409, "공방 중에만 배심원을 초대할 수 있어요.");
    await db().from("cases").update({ jury_invited_at: new Date().toISOString() }).eq("id", c.id).eq("status", "trial").is("jury_invited_at", null);
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
  return NextResponse.json({ jury: partyLinks(c, origin)!.jury });
});
