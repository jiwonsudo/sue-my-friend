import { NextResponse } from "next/server";
import type { Role } from "@/lib/types";
import { requireRole } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { handle } from "@/server/http";
import { buildTrialView } from "@/server/trial";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const c = await requireCase(id);
  const prefer = req.nextUrl.searchParams.get("as") as Role | null;
  const me = await requireRole(c.id, ["plaintiff", "defendant"], prefer);
  return NextResponse.json(await buildTrialView(c, me), { headers: { "Cache-Control": "no-store" } });
});
