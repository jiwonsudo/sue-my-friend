import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { formatDateTime, formatDate, loserOf, VERDICT_LABEL } from "@/lib/document";
import { otherRole } from "@/lib/trial";
import type { Role } from "@/lib/types";
import { rolesForCase } from "@/server/auth";
import { fetchJudgment, loadCase, purgeAt } from "@/server/cases";
import { JudgmentView } from "./JudgmentView";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ caseId: string }>; searchParams: Promise<{ as?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseId } = await params;
  const c = await loadCase(caseId);
  const j = c ? await fetchJudgment(c.id) : null;
  if (!c || !j) return { title: "판결" };
  const title = `[${VERDICT_LABEL[j.verdict]}] ${c.draft.title}`;
  const image = `/api/og/judgment/${c.id}`;
  return {
    title,
    description: j.order_text,
    openGraph: { title, description: j.order_text, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function VerdictPage({ params, searchParams }: Props) {
  const [{ caseId }, { as }] = await Promise.all([params, searchParams]);
  const c = await loadCase(caseId);
  if (!c) return <Gate title="사건을 찾을 수 없습니다" body="주소를 다시 확인할 것. 판결·기각된 사건은 1시간 뒤 기록이 폐기됨." />;
  const j = await fetchJudgment(c.id);
  if (!j) return <Gate title="아직 판결 전입니다" body="피고와 원고가 한마디씩 주고받으면 AI 재판장이 바로 선고함." />;

  // 공방에서 고른 자리(?as=)도 내 쪽으로 본다
  const roles = [...(await rolesForCase(c.id)), ...(as === "plaintiff" || as === "defendant" ? [as] : [])] as Role[];
  const loser = loserOf(j.verdict);
  const me = roles.includes(loser) ? loser : roles.includes(otherRole(loser)) ? otherRole(loser) : null;

  return (
    <JudgmentView
      caseId={c.id}
      me={me}
      loser={loser}
      purgeAt={c.closed_at ? formatDateTime(purgeAt(c.closed_at)) : null}
      counterHref={`/new?type=custom&me=${encodeURIComponent(loser === "plaintiff" ? c.plaintiff_nick : c.defendant_nick)}&them=${encodeURIComponent(loser === "plaintiff" ? c.defendant_nick : c.plaintiff_nick)}`}
      doc={{
        caseNo: c.case_no,
        title: c.draft.title,
        plaintiff: c.plaintiff_nick,
        defendant: c.defendant_nick,
        order: j.order_text,
        reason: j.reason_text,
        date: formatDate(j.created_at),
        verdictLabel: VERDICT_LABEL[j.verdict],
        signer: { jury: "배심원 일동", judge: "재판장 (AI)", system: "본 법정" }[j.judged_by ?? "system"],
      }}
    />
  );
}
