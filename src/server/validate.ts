import "server-only";
import { z } from "zod";
import { CASE_TYPES, LIMITS } from "@/lib/constants";
import { fail } from "./http";
import { sanitize } from "./llm";

const clean = (max: number) =>
  z
    .string()
    .transform((s) => sanitize(s, max))
    .pipe(z.string().min(1));

export const caseInputSchema = z.object({
  type: z.enum(CASE_TYPES.map((t) => t.id) as [string, ...string[]]),
  plaintiff_nick: clean(LIMITS.nick),
  defendant_nick: clean(LIMITS.nick),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  situation: clean(LIMITS.situation),
  demand: clean(LIMITS.demand),
});

export const toneSchema = z.enum(["기본", "더_킹받게", "순하게"]);

export const draftSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.title),
  items: z.array(z.string().trim().min(1).max(LIMITS.item)).min(1).max(8),
  preview_line: z.string().trim().max(30),
});

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const r = schema.safeParse(value);
  if (!r.success) fail(400, "입력값을 확인해주세요.");
  return r.data;
}
