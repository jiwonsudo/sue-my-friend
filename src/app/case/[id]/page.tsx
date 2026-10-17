import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CopyField } from "@/components/CopyField";
import { Countdown } from "@/components/Countdown";
import { Gate } from "@/components/Gate";
import { Desk } from "@/components/desk/Desk";
import { Folder } from "@/components/desk/Folder";
import { DropIn } from "@/components/desk/motion";
import { PostIt } from "@/components/desk/PostIt";
import { FORM_NO, FormTable, Sheet } from "@/components/desk/Sheet";
import { DateStamp } from "@/components/desk/Stamps";
import { btn, trayNote } from "@/components/desk/ui";
import { RubberStamp } from "@/components/Seal";
import { ShareButtons } from "@/components/ShareButtons";
import { formatDate, formatDateTime, formatTime } from "@/lib/document";
import type { CaseStatus } from "@/lib/types";
import { plaintiffTokenFromCookie, rolesForCase } from "@/server/auth";
import { loadCase, partyLinks } from "@/server/cases";

export const metadata: Metadata = { title: "내 사건", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<CaseStatus, string> = {
  draft: "작성 중",
  sent: "송달됨 · 열람 대기",
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
    return <Gate title="열람 권한이 없습니다" body="원고 전용 기록. 발급받은 '내 사건 링크'로 다시 접속할 것." />;
  }
  if (c.status === "draft") redirect(`/new?case=${c.id}`);

  const base = await origin();
  const links = partyLinks(c, base)!;
  const myToken = await plaintiffTokenFromCookie(c.id);
  const responded = c.defendant_response && c.defendant_response !== "ignore";
  const waiting = c.status === "sent" || c.status === "opened";
  const no = c.case_no.split("-")[1];

  const tray =
    c.status === "trial" || c.status === "voting" ? (
      <Link href={`/case/${c.id}/trial?as=plaintiff`} className={`${btn.ink} w-full`}>
        공방 입장
      </Link>
    ) : c.status === "judged" || c.status === "executed" ? (
      <Link href={`/v/${c.id}`} className={`${btn.seal} w-full`}>
        판결문 보기
      </Link>
    ) : waiting ? (
      <div className="space-y-2">
        <p className={`${trayNote} flex justify-between`}>
          <span>피고에게 송달할 것</span>
          <span>
            답변 기한 <Countdown deadline={c.response_deadline_at} className="text-paper" />
          </span>
        </p>
        <ShareButtons
          url={links.defendant}
          title={`${c.plaintiff_nick}님이 내용증명을 보냈습니다`}
          text={c.draft.preview_line || c.draft.title}
          imageUrl={`${base}/api/og/case/${links.defendant.split("/c/")[1]}`}
          buttonLabel="내용증명 열람"
        />
      </div>
    ) : null;

  return (
    <Desk scene="folder" tray={tray}>
      <AutoRefresh />
      <DropIn>
        <Folder tab={`사건 ${c.case_no}`}>
          <Sheet formNo={FORM_NO.docket} side="사건기록부" className="font-serif" coffee={c.status === "trial"}>
            <div className="relative px-5 pt-4 pb-5">
              <h1 className="text-[22px] leading-none font-black tracking-[0.3em]">사건기록부</h1>
              <div className="mt-2 mb-4 h-[5px] w-[8.5rem] border-y border-ink" />
              <div className="absolute top-3 right-4 flex flex-col items-end gap-1.5">
                {c.sent_at && <DateStamp label="발송" date={formatDate(c.sent_at).replaceAll(" ", "")} foot={no ? `제 ${no} 호` : undefined} color="#c8102e" className="stamp-ink rotate-[5deg]" />}
              </div>
              <FormTable
                rows={[
                  ["사건번호", <span key="n" className="font-type text-[13px]">{c.case_no}</span>],
                  ["사 건 명", c.draft.title],
                  ["원 고", c.plaintiff_nick],
                  ["피 고", c.defendant_nick],
                  ["진행 상태", <b key="s">{STATUS[c.status]}</b>],
                  [
                    "열 람",
                    c.opened_at ? (
                      <span key="o">{`${c.defendant_nick}님이 ${formatTime(c.opened_at)}에 열람함`}</span>
                    ) : (
                      <span key="o" className="text-black/50">미열람</span>
                    ),
                  ],
                  ...(responded
                    ? ([["피고 대응", { accept: "인정하고 이행", object: "이의신청", countersue: "맞고소" }[c.defendant_response as "accept"]]] as [string, string][])
                    : []),
                  ...(c.status === "voting" && c.voting_deadline_at ? ([["투표 마감", formatDateTime(c.voting_deadline_at)]] as [string, string][]) : []),
                ]}
              />
              {c.opened_at && (
                <DateStamp
                  label="열람"
                  date={formatTime(c.opened_at)}
                  foot={formatDate(c.opened_at).replaceAll(" ", "")}
                  className="stamp-ink absolute right-6 bottom-3 rotate-[-7deg]"
                />
              )}
              {c.status === "dismissed" && (
                <div className="mt-5 flex items-start gap-3">
                  <RubberStamp text="기 각" className="shrink-0 rotate-[-8deg] text-2xl" />
                  <div>
                    <p className="font-bold">피고가 사건을 기각했습니다</p>
                    <p className="mt-1 text-[13.5px] text-black/60">이후 진행 불가. 본 기록은 보존만 함.</p>
                  </div>
                </div>
              )}
            </div>
          </Sheet>

          {waiting && (
            <PostIt rotate={-3} className="relative z-10 -mt-4 ml-auto mr-2 w-fit min-w-40">
              답변 기한
              <br />
              <Countdown deadline={c.response_deadline_at} className="text-[26px]" /> 남음
            </PostIt>
          )}

          {waiting && (
            <Sheet tone="cream" className="mt-4 rotate-[0.6deg] font-serif">
              <div className="space-y-1 px-5 pt-4 pb-5">
                <p className="mb-2 font-type text-[11px] tracking-[0.2em] text-black/50">송달 안내</p>
                <CopyField label="발송 링크 (피고 송달용)" value={links.defendant} />
                <p className="pt-1 text-[12.5px] text-black/55">피고가 이 주소를 여는 시각이 열람 시각으로 기록됨.</p>
              </div>
            </Sheet>
          )}

          {myToken && (
            <Sheet tone="cream" className="mt-4 -rotate-[0.8deg] font-serif">
              <div className="px-5 pt-4 pb-5">
                <p className="mb-2 font-type text-[11px] tracking-[0.2em] text-seal">원고 보관용 · 타인 교부 금지</p>
                <CopyField label="내 사건 링크 (다른 기기에서 이 화면으로 돌아올 때)" value={`${base}/enter/${myToken}`} />
                <p className="mt-2 text-[12px] text-black/55">이 주소를 가진 사람은 원고로 행동할 수 있음.</p>
              </div>
            </Sheet>
          )}
        </Folder>
      </DropIn>
    </Desk>
  );
}
