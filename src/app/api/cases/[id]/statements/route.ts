import { NextResponse } from "next/server";
import { z } from "zod";
import { CARD_IDS, LIMITS } from "@/lib/constants";
import { currentSlot, rebuttalTarget, TRIAL_SLOTS } from "@/lib/trial";
import { requireRole } from "@/server/auth";
import { fetchStatements, finishTrial, requireCase } from "@/server/cases";
import { assertSameOrigin, fail, handle, readJson } from "@/server/http";
import { sanitize } from "@/server/llm";
import { db } from "@/server/supabase";
import { parse } from "@/server/validate";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  sentences: z.array(z.string()).min(1).max(4),
  targetSentenceIdx: z.number().int().min(0).max(3).nullish(),
  cardId: z.enum(CARD_IDS as [string, ...string[]]).nullish(),
  evidenceId: z.string().uuid().nullish(),
});

export const POST = handle<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const { id } = await params;
  const c = await requireCase(id);
  if (c.status !== "trial") fail(409, "지금은 진술할 수 없습니다.");
  const statements = await fetchStatements(c.id);
  const slot = currentSlot(statements);
  if (!slot) fail(409, "공방이 끝났습니다.");
  // 내 차례인 역할로만 진술할 수 있다
  const role = await requireRole(c.id, [slot.role]);

  const body = parse(bodySchema, await readJson(req));
  const sentences = body.sentences.map((s) => sanitize(s, LIMITS.sentence)).filter(Boolean);
  const max = slot.kind === "testimony" ? 4 : 1;
  if (sentences.length === 0 || sentences.length > max) {
    fail(400, slot.kind === "testimony" ? "증언은 1~4문장이에요." : "한 문장만 쓸 수 있어요.");
  }

  const row: Record<string, unknown> = {
    case_id: c.id,
    round: slot.round,
    role,
    kind: slot.kind,
    sentences,
  };

  if (slot.kind === "rebuttal") {
    const target = rebuttalTarget(statements, slot.round);
    if (target && !target.forfeited) {
      const idx = body.targetSentenceIdx;
      if (idx == null || idx >= target.sentences.length) fail(400, "반박할 문장을 골라주세요.");
      row.target_statement_id = target.id;
      row.target_sentence_idx = idx;
    }
    row.card_id = body.cardId ?? null;
    if (body.evidenceId) {
      const { data: ev } = await db()
        .from("evidence")
        .select("id")
        .eq("id", body.evidenceId)
        .eq("case_id", c.id)
        .eq("owner_role", role)
        .maybeSingle();
      if (!ev) fail(400, "증거를 찾을 수 없습니다.");
      row.evidence_id = ev.id;
    }
  } else if (body.cardId || body.evidenceId) {
    fail(400, "항변 카드와 증거는 반박에만 붙일 수 있어요.");
  }

  const { error } = await db().from("statements").insert(row);
  if (error) fail(409, "이미 진술이 제출되었습니다.");

  if (statements.length + 1 >= TRIAL_SLOTS.length) {
    await finishTrial(c, new Date());
  }
  return NextResponse.json({ ok: true });
});
