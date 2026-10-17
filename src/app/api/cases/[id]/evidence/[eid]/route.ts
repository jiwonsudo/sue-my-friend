import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { requireRole } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { sanitize } from "@/server/llm";
import { db } from "@/server/supabase";

type Ctx = { params: Promise<{ id: string; eid: string }> };

/** 증거 이름 수정 (제출한 사람만) */
export const PATCH = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id, eid } = await params;
  const c = await requireCase(id);
  const role = await requireRole(c.id, ["plaintiff", "defendant"], req.nextUrl.searchParams.get("as") as Role | null);
  const { label } = await readJson<{ label?: unknown }>(req);
  const clean = typeof label === "string" ? sanitize(label, LIMITS.label) : "";
  if (!clean) fail(400, "이름을 입력해주세요.");
  const { data } = await db()
    .from("evidence")
    .update({ label: clean })
    .eq("id", eid)
    .eq("case_id", c.id)
    .eq("owner_role", role)
    .select("id");
  if (!data?.length) fail(403, "본인이 낸 증거만 수정할 수 있어요.");
  return NextResponse.json({ label: clean });
});
