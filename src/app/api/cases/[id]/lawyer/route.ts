import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSlot, rebuttalTarget } from "@/lib/trial";
import { trialRole } from "@/server/auth";
import { fetchStatements, requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { fetchLawyerUse, MIN_AD_MS, suggestObjections } from "@/server/lawyer";
import { db } from "@/server/supabase";
import { hashToken, randomToken } from "@/server/tokens";
import { parse } from "@/server/validate";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.union([
  z.object({ action: z.literal("ticket") }),
  z.object({ action: z.literal("grant"), ticket: z.string().min(20).max(128) }),
]);

/**
 * 광고 보상형 AI 변호인 (내 반박 차례에 1번)
 * - ticket: 광고를 띄우기 직전에 발급. 이미 선임했으면 409
 * - grant: 광고를 끝까지 본 뒤. 티켓 발급 후 MIN_AD_MS 가 지나야 하고, 한 번만 쓸 수 있다
 */
export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  if (c.status !== "trial") fail(409, "공방 중에만 변호인을 선임할 수 있습니다.");
  const statements = await fetchStatements(c.id);
  const slot = currentSlot(statements);
  if (!slot) fail(409, "공방이 끝났습니다.");
  const role = trialRole(req.nextUrl.searchParams.get("as"));
  if (role !== slot.role) fail(403, "지금은 상대 차례입니다.");
  const body = parse(bodySchema, await readJson(req));
  const used = await fetchLawyerUse(c.id, role, slot.round);

  if (body.action === "ticket") {
    if (used?.granted_at) fail(409, "이번 차례에는 이미 변호인을 선임했습니다.");
    const ticket = randomToken();
    const row = { case_id: c.id, role, round: slot.round, ticket_hash: hashToken(ticket), ticket_issued_at: new Date().toISOString() };
    const { error } = used
      ? await db().from("lawyer_uses").update(row).eq("id", used.id).is("granted_at", null)
      : await db().from("lawyer_uses").insert(row);
    if (error) fail(409, "다른 요청이 처리 중입니다.");
    return NextResponse.json({ ticket, minAdMs: MIN_AD_MS });
  }

  if (!used || used.ticket_hash !== hashToken(body.ticket)) fail(403, "광고 확인 정보가 올바르지 않습니다.");
  if (used.granted_at) fail(409, "이번 차례에는 이미 변호인을 선임했습니다.");
  if (Date.now() - new Date(used.ticket_issued_at).getTime() < MIN_AD_MS) fail(409, "광고를 끝까지 본 뒤에 선임할 수 있습니다.");
  // 먼저 선임 처리(동시 요청이면 한쪽만 통과), 그다음 추천 생성
  const { data: claimed } = await db()
    .from("lawyer_uses")
    .update({ granted_at: new Date().toISOString() })
    .eq("id", used.id)
    .is("granted_at", null)
    .select("id");
  if (!claimed?.length) fail(409, "이번 차례에는 이미 변호인을 선임했습니다.");

  const { suggestions, costUsd } = await suggestObjections(c, rebuttalTarget(statements, slot.round), role);
  await db().from("lawyer_uses").update({ suggestions, cost_usd: Number(costUsd.toFixed(6)) }).eq("id", used.id);
  return NextResponse.json({ suggestions });
});
