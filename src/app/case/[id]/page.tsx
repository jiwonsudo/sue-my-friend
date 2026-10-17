import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CopyField } from "@/components/CopyField";
import { Countdown } from "@/components/Countdown";
import { Gate } from "@/components/Gate";
import { Header } from "@/components/Header";
import { ShareButtons } from "@/components/ShareButtons";
import { formatDateTime, formatTime } from "@/lib/document";
import type { CaseStatus } from "@/lib/types";
import { plaintiffTokenFromCookie, rolesForCase } from "@/server/auth";
import { loadCase, partyLinks } from "@/server/cases";

export const metadata: Metadata = { title: "내 사건", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<CaseStatus, string> = {
  draft: "작성 중",
  sent: "발송됨 · 열람 대기",
  opened: "열람됨 · 답변 대기",
  trial: "공방 진행 중",
  voting: "배심원 투표 중",
  judged: "판결 선고",
  executed: "집행 완료",
  dismissed: "기각됨",
};

async function origin() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export default async function CaseDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await loadCase(id);
  if (!c) notFound();
  const roles = await rolesForCase(c.id);
  if (!roles.includes("plaintiff")) {
    if (roles.includes("defendant")) {
      if (c.status === "trial" || c.status === "voting") redirect(`/case/${c.id}/trial`);
      if (c.status === "judged" || c.status === "executed") redirect(`/v/${c.id}`);
    }
    return <Gate title="열람 권한이 없습니다" body="이 사건의 원고만 볼 수 있는 화면이에요. 받은 '내 사건 링크'로 다시 들어와 주세요." />;
  }
  if (c.status === "draft") redirect(`/new?case=${c.id}`);

  const base = await origin();
  const links = partyLinks(c, base)!;
  const myToken = await plaintiffTokenFromCookie(c.id);
  const responded = c.defendant_response && c.defendant_response !== "ignore";

  return (
    <>
      <Header />
      <AutoRefresh />
      <main className="mx-auto max-w-md px-5 pt-8 pb-16">
        <p className="mb-1 text-xs font-semibold text-muted">사건번호 {c.case_no}</p>
        <h1 className="mb-1 text-2xl font-extrabold">
          {c.status === "sent" || c.status === "opened" ? "통고서가 준비되었습니다" : c.draft.title}
        </h1>
        <p className="mb-6 text-sm text-muted">
          {c.plaintiff_nick} → {c.defendant_nick}
        </p>

        {c.status === "dismissed" ? (
          <section className="mb-6 rounded-2xl bg-black/[0.04] p-5">
            <p className="font-serif text-lg font-bold">피고가 사건을 기각했습니다</p>
            <p className="mt-1 text-sm text-muted">이 사건은 더 진행할 수 없어요. 우정은 소중하니까요.</p>
          </section>
        ) : (
          <section className="mb-6 rounded-2xl border border-black/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted">상태</span>
              <span className="rounded-full bg-seal/10 px-2.5 py-1 text-xs font-bold text-seal">{STATUS[c.status]}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted">열람</span>
              <span className="text-sm font-semibold">
                {c.opened_at ? `${c.defendant_nick}님이 ${formatTime(c.opened_at)}에 열람함` : "아직 열어보지 않음"}
              </span>
            </div>
            {(c.status === "sent" || c.status === "opened") && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">답변 기한</span>
                <span className="text-sm font-semibold">
                  <Countdown deadline={c.response_deadline_at} /> 남음
                </span>
              </div>
            )}
            {responded && (
              <p className="mt-4 text-sm">
                피고의 대응:{" "}
                <b>{{ accept: "인정하고 이행", object: "이의신청", countersue: "맞고소" }[c.defendant_response as "accept"]}</b>
              </p>
            )}
            {c.status === "voting" && c.voting_deadline_at && (
              <p className="mt-2 text-sm text-muted">투표 마감 {formatDateTime(c.voting_deadline_at)}</p>
            )}
          </section>
        )}

        {(c.status === "trial" || c.status === "voting") && (
          <Link
            href={`/case/${c.id}/trial?as=plaintiff`}
            className="mb-6 flex min-h-14 items-center justify-center rounded-2xl bg-court text-[17px] font-bold text-white"
          >
            공방 입장
          </Link>
        )}
        {(c.status === "judged" || c.status === "executed") && (
          <Link href={`/v/${c.id}`} className="mb-6 flex min-h-14 items-center justify-center rounded-2xl bg-seal text-[17px] font-bold text-white">
            판결문 보기
          </Link>
        )}

        {(c.status === "sent" || c.status === "opened") && (
          <section className="mb-8 space-y-3">
            <CopyField label="발송 링크" value={links.defendant} />
            <ShareButtons
              url={links.defendant}
              title={`${c.plaintiff_nick}님이 내용증명을 보냈습니다`}
              text={c.draft.preview_line || c.draft.title}
              imageUrl={`${base}/api/og/case/${links.defendant.split("/c/")[1]}`}
              buttonLabel="내용증명 열람"
            />
          </section>
        )}

        {myToken && (
          <section className="rounded-2xl bg-black/[0.03] p-4">
            <CopyField label="내 사건 링크 (다른 기기에서 이 화면으로 돌아올 때)" value={`${base}/enter/${myToken}`} />
            <p className="mt-2 text-[11px] text-muted">이 링크를 가진 사람은 원고로 행동할 수 있어요. 공유하지 마세요.</p>
          </section>
        )}
      </main>
    </>
  );
}
