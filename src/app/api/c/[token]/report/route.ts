import { NextResponse } from "next/server";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { requireDefendantCase } from "@/server/defendant";
import { sanitize } from "@/server/llm";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ token: string }> };

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { token } = await params;
  const c = await requireDefendantCase(token);
  const { reason } = await readJson<{ reason?: unknown }>(req);
  const clean = typeof reason === "string" ? sanitize(reason, 500) : "";
  if (!clean) fail(400, "신고 사유를 적어주세요.");
  await db().from("reports").insert({ case_id: c.id, role: "defendant", reason: clean });
  return NextResponse.json({ ok: true });
});
