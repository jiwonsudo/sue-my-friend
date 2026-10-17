import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { sanitize } from "@/server/llm";
import { db } from "@/server/supabase";
import { draftSchema, parse } from "@/server/validate";

type Ctx = { params: Promise<{ id: string }> };

/** 직접 수정 저장 */
export const PATCH = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  await requireRole(c.id, ["plaintiff"]);
  if (c.status !== "draft") fail(409, "이미 발송된 사건입니다.");
  const body = await readJson<{ draft: unknown }>(req);
  const d = parse(draftSchema, body.draft);
  const draft = {
    title: sanitize(d.title, 60),
    items: d.items.map((i) => sanitize(i, 300)).filter(Boolean),
    preview_line: sanitize(d.preview_line, 30),
  };
  if (!draft.title || draft.items.length === 0) fail(400, "제목과 항목을 채워주세요.");
  await db().from("cases").update({ draft }).eq("id", c.id);
  return NextResponse.json({ draft });
});
