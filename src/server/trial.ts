import "server-only";
import { TURN_WINDOW_MS } from "@/lib/constants";
import { currentSlot } from "@/lib/trial";
import type { CaseRow, EvidenceRow, PublicEvidence, Role, TrialView } from "@/lib/types";
import { fetchStatements } from "./cases";
import { db, signedUrl } from "./supabase";

export async function fetchEvidence(caseId: string): Promise<EvidenceRow[]> {
  const { data } = await db()
    .from("evidence")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  return (data as EvidenceRow[]) ?? [];
}

export async function buildTrialView(c: CaseRow, me: Role | null): Promise<TrialView> {
  const [statements, evidenceRows] = await Promise.all([fetchStatements(c.id), fetchEvidence(c.id)]);
  const evidence: PublicEvidence[] = await Promise.all(
    evidenceRows.map(async (e) => ({
      id: e.id,
      label: e.label,
      owner_role: e.owner_role,
      url: await signedUrl(e.image_path),
    })),
  );
  const slot = c.status === "trial" ? currentSlot(statements) : null;
  const last = statements.at(-1)?.created_at ?? c.trial_started_at ?? c.created_at;
  return {
    caseId: c.id,
    caseNo: c.case_no,
    title: c.draft.title,
    status: c.status,
    plaintiffNick: c.plaintiff_nick,
    defendantNick: c.defendant_nick,
    me,
    statements,
    evidence,
    current: slot ? { ...slot, deadline: new Date(new Date(last).getTime() + TURN_WINDOW_MS).toISOString() } : null,
  };
}
