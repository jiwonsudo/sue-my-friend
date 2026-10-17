import { NextResponse } from "next/server";
import { assertSameOrigin, fail, handle } from "@/server/http";
import { requireDefendantCase } from "@/server/defendant";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ token: string }> };

/** 사건 기각: 문서를 숨기고 원고의 진행을 막는다 */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { token } = await params;
  const c = await requireDefendantCase(token);
  if (c.status === "judged" || c.status === "executed") fail(409, "이미 판결이 난 사건입니다.");
  await db().from("cases").update({ status: "dismissed" }).eq("id", c.id);
  return NextResponse.json({ ok: true });
});
