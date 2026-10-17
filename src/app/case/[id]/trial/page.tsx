import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Gate } from "@/components/Gate";
import type { Role } from "@/lib/types";
import { rolesForCase } from "@/server/auth";
import { loadCase, partyLinks } from "@/server/cases";
import { buildTrialView } from "@/server/trial";
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
  const roles = await rolesForCase(c.id);
  if (roles.length === 0) {
    return <Gate title="공방 당사자만 입장할 수 있습니다" body="원고는 사건을 만든 브라우저나 '내 사건 링크'로, 피고는 받은 통고서 링크로 접속할 것." />;
  }
  if (c.status === "judged" || c.status === "executed") redirect(`/v/${c.id}`);
  if (!["trial", "voting"].includes(c.status)) redirect(roles.includes("plaintiff") ? `/case/${c.id}` : "/");

  const me: Role = as && roles.includes(as as Role) ? (as as Role) : roles[0];
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const links = partyLinks(c, origin)!;

  return (
    <TrialClient
      initial={await buildTrialView(c, me)}
      canSwitch={roles.length > 1}
      notifyLinks={{
        // 피고에게는 쿠키를 심어 주는 호출 링크, 원고는 사건을 만든 브라우저에 쿠키가 있으므로 공방 주소
        defendant: `${origin}/t/${links.defendant.split("/c/")[1]}`,
        plaintiff: `${origin}/case/${c.id}/trial?as=plaintiff`,
      }}
    />
  );
}
