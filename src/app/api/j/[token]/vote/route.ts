import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveToken, rolesForCase } from "@/server/auth";
import { requireCase, tallyVotes } from "@/server/cases";
import { assertSameOrigin, clientIp, fail, handle, readJson } from "@/server/http";
import { db } from "@/server/supabase";
import { sha256 } from "@/server/tokens";
import { parse } from "@/server/validate";

type Ctx = { params: Promise<{ token: string }> };

const bodySchema = z.object({ verdict: z.enum(["plaintiff", "defendant", "both"]) });
const VOTER_COOKIE = "smf_voter";

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { token } = await params;
  const found = await resolveToken(token);
  if (!found || found.role !== "jury") fail(404, "사건을 찾을 수 없습니다.");
  const c = await requireCase(found.caseId);
  if (c.status !== "trial" && c.status !== "voting") fail(409, "투표가 마감되었습니다.");
  if ((await rolesForCase(c.id)).length > 0) fail(403, "당사자는 투표할 수 없어요.");

  const { verdict } = parse(bodySchema, await readJson(req));
  const voterId = req.cookies.get(VOTER_COOKIE)?.value ?? randomUUID();
  const voterHash = sha256(`${voterId}:${clientIp(req)}`);
  const { error } = await db().from("votes").insert({ case_id: c.id, voter_hash: voterHash, verdict });
  if (error) fail(409, "이미 투표했어요.");

  const res = NextResponse.json({ votes: await tallyVotes(c.id) });
  res.cookies.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
});
