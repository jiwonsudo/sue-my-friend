import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { CASE_TYPES, LIMITS, type CaseType } from "@/lib/constants";
import { rolesForCase } from "@/server/auth";
import { loadCase } from "@/server/cases";
import { NewCaseFlow, type ResumeState } from "./NewCaseFlow";

export const metadata: Metadata = { title: "통고서 작성" };

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; me?: string; them?: string; case?: string }>;
}) {
  const sp = await searchParams;
  const type = (CASE_TYPES.some((t) => t.id === sp.type) ? sp.type : "bet") as CaseType;

  let resume: ResumeState | null = null;
  if (sp.case) {
    const c = await loadCase(sp.case);
    if (c && c.status === "draft" && (await rolesForCase(c.id)).includes("plaintiff")) {
      resume = {
        caseId: c.id,
        caseNo: c.case_no,
        draft: c.draft,
        regenLeft: LIMITS.maxRegen - c.regen_count,
        input: {
          type: c.type,
          plaintiff_nick: c.plaintiff_nick,
          defendant_nick: c.defendant_nick,
          incident_date: c.incident_date,
          situation: c.situation,
          demand: c.demand,
        },
      };
    }
  }

  return (
    <>
      <Header />
      <NewCaseFlow
        resume={resume}
        initial={{
          type,
          plaintiff_nick: (sp.me ?? "").slice(0, LIMITS.nick),
          defendant_nick: (sp.them ?? "").slice(0, LIMITS.nick),
        }}
      />
    </>
  );
}
