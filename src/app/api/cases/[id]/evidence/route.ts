import { NextResponse } from "next/server";
import { trialRole } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle } from "@/server/http";
import { db, signedUrl } from "@/server/supabase";
import { uploadImage } from "@/server/upload";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  if (c.status !== "trial") fail(409, "공방 중에만 증거를 낼 수 있어요.");
  const role = trialRole(req.nextUrl.searchParams.get("as"));
  const form = await req.formData().catch(() => fail(400, "요청 형식이 올바르지 않습니다."));
  const path = await uploadImage(form.get("file"), c.id);
  const { count } = await db().from("evidence").select("id", { count: "exact", head: true }).eq("case_id", c.id);
  const label = `증 제${(count ?? 0) + 1}호증`;
  const { data, error } = await db()
    .from("evidence")
    .insert({ case_id: c.id, owner_role: role, label, image_path: path })
    .select("id, label, owner_role")
    .single();
  if (error || !data) throw new Error("evidence insert");
  return NextResponse.json({ ...data, url: await signedUrl(path) });
});
