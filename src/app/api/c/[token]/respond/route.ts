import { NextResponse } from "next/server";
import { z } from "zod";
import { setPartyCookie } from "@/server/auth";
import { createJudgment } from "@/server/cases";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { requireDefendantCase } from "@/server/defendant";
import { db } from "@/server/supabase";
import { parse } from "@/server/validate";

type Ctx = { params: Promise<{ token: string }> };

const bodySchema = z.object({ action: z.enum(["accept", "object", "countersue"]) });

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { token } = await params;
  const c = await requireDefendantCase(token);
  const { action } = parse(bodySchema, await readJson(req));
  if (!(c.status === "sent" || c.status === "opened") || c.defendant_response) {
    fail(409, "이미 대응이 끝난 사건입니다.");
  }
  const now = new Date().toISOString();
  const { data } = await db()
    .from("cases")
    .update(
      action === "accept"
        ? { defendant_response: action, opened_at: c.opened_at ?? now }
        : { defendant_response: action, status: "trial", trial_started_at: now, opened_at: c.opened_at ?? now },
    )
    .eq("id", c.id)
    .is("defendant_response", null)
    .select("id");
  if (!data?.length) fail(409, "이미 대응이 끝난 사건입니다.");
  if (action === "accept") await createJudgment(c, "settled");

  const res = NextResponse.json({ next: action === "accept" ? `/v/${c.id}` : `/case/${c.id}/trial?as=defendant` });
  setPartyCookie(res, c.id, "defendant", token);
  return res;
});
