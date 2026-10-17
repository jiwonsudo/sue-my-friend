import { NextResponse } from "next/server";
import { setPartyCookie } from "@/server/auth";
import { assertSameOrigin, handle } from "@/server/http";
import { requireDefendantCase } from "@/server/defendant";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ token: string }> };

/** 열람 기록. 크롤러(링크 미리보기)는 JS 를 실행하지 않으므로 기록되지 않는다. */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { token } = await params;
  const c = await requireDefendantCase(token);
  let openedAt = c.opened_at;
  if (!openedAt) {
    openedAt = new Date().toISOString();
    await db().from("cases").update({ opened_at: openedAt }).eq("id", c.id).is("opened_at", null);
    await db().from("cases").update({ status: "opened" }).eq("id", c.id).eq("status", "sent");
  }
  const res = NextResponse.json({ openedAt });
  setPartyCookie(res, c.id, "defendant", token);
  return res;
});
