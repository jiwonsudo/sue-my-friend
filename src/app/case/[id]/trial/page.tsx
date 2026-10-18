import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Gate } from "@/components/Gate";
import type { Role } from "@/lib/types";
import { rolesForCase } from "@/server/auth";
import { loadCase, notifyLinks } from "@/server/cases";
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
    return <Gate title="공방 당사자만 입장할 수 있습니다" body="상대가 보낸 차례 알림 링크, 원고는 '내 사건 링크', 피고는 받은 통고서 링크로 접속할 것." />;
  }
  if (c.status === "judged" || c.status === "executed") redirect(`/v/${c.id}`);
  if (!["trial", "voting"].includes(c.status)) redirect(roles.includes("plaintiff") ? `/case/${c.id}` : "/");

  const me: Role = as && roles.includes(as as Role) ? (as as Role) : roles[0];
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <TrialClient
      initial={await buildTrialView(c, me)}
      canSwitch={roles.length > 1}
      notifyLinks={await notifyLinks(c, origin)}
    />
  );
}
