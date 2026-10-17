import { NextResponse } from "next/server";
import { loserOf } from "@/lib/document";
import { otherRole } from "@/lib/trial";
import { requireRole } from "@/server/auth";
import { fetchJudgment, requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle } from "@/server/http";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ id: string }> };

/** 받는 쪽이 집행을 확인 → executed */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  const j = await fetchJudgment(c.id);
  if (!j || c.status !== "judged") fail(409, "집행할 판결이 없습니다.");
  if (!j.execution_proof_path) fail(409, "아직 인증 사진이 올라오지 않았어요.");
  await requireRole(c.id, [otherRole(loserOf(j.verdict))]);
  await db().from("judgments").update({ executed_at: new Date().toISOString() }).eq("case_id", c.id);
  await db().from("cases").update({ status: "executed" }).eq("id", c.id);
  return NextResponse.json({ ok: true });
});
