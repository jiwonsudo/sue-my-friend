import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { currentSlot } from "@/lib/trial";
import { rolesForCase } from "@/server/auth";
import { fetchStatements, loadCase, trialLink } from "@/server/cases";
import { buildTrialView } from "@/server/trial";
import { RolePicker } from "./RolePicker";
import { TrialClient } from "./TrialClient";

export const metadata: Metadata = { title: "공방", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TrialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const [{ id }, { as }] = await Promise.all([params, searchParams]);
  const c = await loadCase(id);
  if (!c) notFound();
  if (c.status === "judged" || c.status === "executed") redirect(`/v/${c.id}${as ? `?as=${as}` : ""}`);
  if (!["trial", "voting"].includes(c.status)) redirect((await rolesForCase(c.id)).includes("plaintiff") ? `/case/${c.id}` : "/");

  // 링크만 있으면 들어온다. 어느 쪽인지는 본인이 고른다 (쿠키로 주인을 가리지 않음)
  if (as !== "plaintiff" && as !== "defendant") {
    return (
      <RolePicker
        caseId={c.id}
        caseNo={c.case_no}
        title={c.draft.title}
        nicks={{ plaintiff: c.plaintiff_nick, defendant: c.defendant_nick }}
        turn={currentSlot(await fetchStatements(c.id))?.role ?? null}
      />
    );
  }

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <TrialClient initial={await buildTrialView(c, as)} trialUrl={trialLink(c, origin)} />;
}
