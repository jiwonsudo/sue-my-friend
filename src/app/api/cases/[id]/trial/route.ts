import { NextResponse } from "next/server";
import { trialRole } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { handle } from "@/server/http";
import { buildTrialView } from "@/server/trial";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const c = await requireCase(id);
  const me = trialRole(req.nextUrl.searchParams.get("as"));
  return NextResponse.json(await buildTrialView(c, me), { headers: { "Cache-Control": "no-store" } });
});
