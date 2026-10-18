import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, type CaseType } from "@/lib/constants";
import type { CaseRow, Tone } from "@/lib/types";
import { requireRole, setPartyCookie } from "@/server/auth";
import { requireCase } from "@/server/cases";
import { assertSameOrigin, clientIp, fail, handle, readJson, siteUrl } from "@/server/http";
import { generateDraft } from "@/server/llm";
import { db } from "@/server/supabase";
import { deriveToken, hashToken, sha256 } from "@/server/tokens";
import { caseInputSchema, parse, toneSchema } from "@/server/validate";

const bodySchema = z.union([
  z.object({ input: caseInputSchema, tone: toneSchema.default("기본") }),
  z.object({ caseId: z.string().uuid(), tone: toneSchema }),
]);

async function rateLimit(ip: string) {
  const ipHash = sha256(`draft:${ip}`);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db()
    .from("draft_requests")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= LIMITS.draftsPerIpPerHour) fail(429, "초안은 1시간에 10번까지 쓸 수 있어요.");
  await db().from("draft_requests").insert({ ip_hash: ipHash });
}

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const body = parse(bodySchema, await readJson(req));
  const tone = body.tone as Tone;

  // 재생성: 같은 입력 + 톤만 바꿔서
  if ("caseId" in body) {
    const c = await requireCase(body.caseId);
    await requireRole(c.id, ["plaintiff"]);
    if (c.status !== "draft") fail(409, "이미 발송된 사건입니다.");
    if (c.regen_count >= LIMITS.maxRegen) fail(429, "재생성은 사건당 3번까지예요.");
    await rateLimit(clientIp(req));
    const { draft } = await generateDraft(c, tone, c.draft, { spentUsd: Number(c.ai_cost_usd), caseId: c.id });
    const { data } = await db()
      .from("cases")
      .update({ draft, regen_count: c.regen_count + 1 })
      .eq("id", c.id)
      .eq("regen_count", c.regen_count)
      .select("regen_count");
    if (!data?.length) fail(409, "다른 요청이 처리 중이에요.");
    return NextResponse.json({ caseId: c.id, draft, regenLeft: LIMITS.maxRegen - c.regen_count - 1 });
  }

  // 최초 생성: 초안이 성공한 뒤에 사건을 만든다
  const input = { ...body.input, type: body.input.type as CaseType };
  await rateLimit(clientIp(req));
  const { draft, costUsd } = await generateDraft(input, tone, null);

  const { data: caseNo, error: noErr } = await db().rpc("next_case_no");
  if (noErr || !caseNo) throw new Error("case_no");
  const { data: created, error } = await db()
    .from("cases")
    .insert({ ...input, case_no: caseNo, draft, status: "draft", ai_cost_usd: Number(costUsd.toFixed(6)) })
    .select("*")
    .single();
  if (error || !created) throw new Error("case insert");
  const c = created as CaseRow;

  const token = deriveToken(c.id, "plaintiff", c.token_salt);
  await db().from("party_tokens").insert({ case_id: c.id, role: "plaintiff", token_hash: hashToken(token) });

  const res = NextResponse.json({
    caseId: c.id,
    caseNo: c.case_no,
    draft,
    regenLeft: LIMITS.maxRegen,
    myLink: `${siteUrl(req)}/enter/${token}`,
  });
  setPartyCookie(res, c.id, "plaintiff", token);
  return res;
});
