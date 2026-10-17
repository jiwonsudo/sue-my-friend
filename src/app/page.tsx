import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { Header } from "@/components/Header";
import { JudgmentDocument } from "@/components/JudgmentDocument";
import { CASE_TYPES } from "@/lib/constants";

export default async function Landing({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-5 pb-16">
        {expired && (
          <p className="mt-4 rounded-lg bg-black/5 px-3 py-2 text-sm text-muted">링크가 만료되었거나 올바르지 않아요.</p>
        )}
        <section className="pt-12 pb-8">
          <p className="mb-3 text-sm font-semibold text-seal">사소한 원한, 엄중한 형식</p>
          <h1 className="text-[32px] leading-[1.25] font-extrabold tracking-tight">
            치킨 한 마리,
            <br />
            이제 법의 언어로
            <br />
            받아내세요.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            내기 안 지킨 친구에게 아주 진지한 통고서를 보내세요. 버티면 공방, 배심원 투표, 판결까지 갑니다.
          </p>
        </section>

        <div className="mb-3 flex flex-wrap gap-2">
          {CASE_TYPES.map((t) => (
            <Link
              key={t.id}
              href={`/new?type=${t.id}`}
              className="min-h-11 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium hover:border-black/40"
            >
              {t.label}
            </Link>
          ))}
        </div>

        <section className="mt-10 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-muted">실제 판결 예시</p>
          <JudgmentDocument
            compact
            caseNo="2026킹-0042"
            title="치킨 1마리 지급 이행 청구"
            plaintiff="지원"
            defendant="민수"
            order="피고는 원고에게 뿌링클 1마리를 7일 이내에 이행하라."
            reason=""
            date="2026. 10. 3."
            verdictLabel="원고 승소"
            className="rotate-[-1.2deg]"
          />
          <JudgmentDocument
            compact
            caseNo="2026킹-0057"
            title="읽고 답하지 아니한 행위에 관한 건"
            plaintiff="서연"
            defendant="도윤"
            order="피고는 원고에게 사과 메시지 3줄의 절반을 이행하라. 나머지 절반은 서로 잊는다."
            reason=""
            date="2026. 10. 9."
            verdictLabel="쌍방 과실"
            className="rotate-[0.8deg]"
          />
        </section>

        <Disclaimer className="mt-8" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-white/0 px-5 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Link
          href="/new"
          className="mx-auto flex min-h-14 max-w-md items-center justify-center rounded-2xl bg-seal text-[17px] font-bold text-white shadow-lg shadow-seal/20 active:scale-[0.99]"
        >
          통고서 보내기
        </Link>
      </div>
    </>
  );
}
