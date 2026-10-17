import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth";
import { requireCase, sendCase } from "@/server/cases";
import { assertSameOrigin, handle } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  await requireRole(c.id, ["plaintiff"]);
  await sendCase(c);
  return NextResponse.json({ next: `/case/${c.id}` });
});
