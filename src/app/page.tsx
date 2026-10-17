import Link from "next/link";
import { Desk } from "@/components/desk/Desk";
import { PostIt } from "@/components/desk/PostIt";
import { PaperClip } from "@/components/desk/props";
import { btn, trayNote } from "@/components/desk/ui";
import { JudgmentDocument } from "@/components/JudgmentDocument";
import { LandingIntake } from "./LandingIntake";

export default async function Landing({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <Desk
      scene="intake"
      tray={
        <div className="space-y-2">
          <Link href="/new" className={`${btn.seal} w-full`}>
            접수서 작성
          </Link>
          <p className={`${trayNote} text-center`}>작성 약 2분 · 수수료 없음 · 로그인 없음</p>
        </div>
      }
    >
      {expired && (
        <PostIt rotate={-2} className="relative z-20 mx-auto mb-3 w-fit">
          링크 만료 또는 오류. 다시 들어올 것.
        </PostIt>
      )}

      <div className="relative">
        <PostIt rotate={4} className="absolute -top-11 right-14 z-20 w-[7.2rem] text-[18px]">
          원한 크기 무관
          <br />
          상시 접수
        </PostIt>
        <LandingIntake />
      </div>

      <section aria-label="지난 판결문" className="relative mt-10">
        <p className="mb-2 -rotate-1 font-hand text-[22px] text-paper/80">지난 판결문 (처리 완료)</p>
        <div className="relative">
          <PaperClip className="absolute -top-4 left-8 z-20 h-16 w-6 rotate-[8deg]" />
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
            className="rotate-[1.6deg]"
          />
        </div>
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
          className="relative -mt-2 ml-5 rotate-[-2.4deg]"
        />
      </section>
    </Desk>
  );
}
