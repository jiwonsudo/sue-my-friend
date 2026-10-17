import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { fillPlaceholders, formatDate } from "@/lib/document";
import { caseForDefendantToken } from "@/server/defendant";
import { DefendantView } from "./DefendantView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const c = await caseForDefendantToken(token);
  if (!c || c.status === "dismissed") return { title: "내용증명", robots: { index: false } };
  const title = `${c.plaintiff_nick}님이 ${c.defendant_nick}님 앞으로 내용증명을 발송했습니다`;
  const image = `/api/og/case/${token}`;
  return {
    title: "내용증명이 도착했습니다",
    description: c.draft.preview_line || c.draft.title,
    robots: { index: false },
    openGraph: { title, description: c.draft.preview_line || c.draft.title, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function DefendantPage({ params }: Props) {
  const { token } = await params;
  const c = await caseForDefendantToken(token);
  if (!c) return <Gate title="문서를 찾을 수 없습니다" body="주소 오류 또는 만료." />;
  if (c.status === "dismissed") {
    return <Gate title="기각된 사건입니다" body="피고가 기각한 통고서. 열람 불가." />;
  }
  return (
    <DefendantView
      token={token}
      caseId={c.id}
      firstOpen={!c.opened_at}
      status={c.status}
      responded={c.defendant_response}
      deadline={c.response_deadline_at}
      openedAt={c.opened_at}
      doc={{
        caseNo: c.case_no,
        toNick: c.defendant_nick,
        fromNick: c.plaintiff_nick,
        title: c.draft.title,
        items: c.draft.items.map((i) => fillPlaceholders(i, c)),
        date: formatDate(c.sent_at ?? c.created_at),
      }}
    />
  );
}
