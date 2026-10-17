import { NextResponse } from "next/server";
import { loserOf } from "@/lib/document";
import { requireRole } from "@/server/auth";
import { fetchJudgment, requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle } from "@/server/http";
import { db } from "@/server/supabase";
import { uploadImage } from "@/server/upload";

type Ctx = { params: Promise<{ id: string }> };

/** 집행 완료 인증 사진 업로드 (이행할 쪽) */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  const j = await fetchJudgment(c.id);
  if (!j || c.status !== "judged") fail(409, "집행할 판결이 없습니다.");
  await requireRole(c.id, [loserOf(j.verdict)]);
  const form = await req.formData().catch(() => fail(400, "요청 형식이 올바르지 않습니다."));
  const path = await uploadImage(form.get("file"), `${c.id}/execution`);
  await db().from("judgments").update({ execution_proof_path: path }).eq("case_id", c.id);
  return NextResponse.json({ ok: true });
});
