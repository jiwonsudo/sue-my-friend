"use client";

import { playPen, playTick } from "@/lib/client/sfx";
import { CheckSquare, DateStamp, Scribble } from "@/components/desk/Stamps";
import { ApprovalBox, FORM_NO, Sheet } from "@/components/desk/Sheet";
import { CASE_TYPES, LIMITS, type CaseType } from "@/lib/constants";
import { formatDate } from "@/lib/document";

export type Input = {
  type: CaseType;
  plaintiff_nick: string;
  defendant_nick: string;
  incident_date: string;
  situation: string;
  demand: string;
};

export const PLACEHOLDER: Record<CaseType, { situation: string; demand: string }> = {
  bet: { situation: "롤 내기에서 지면 치킨 사기로 했는데 3주째 '이번 주말에'라고만 함", demand: "뿌링클 1마리" },
  ghosting: { situation: "생일 축하 메시지 읽고 4일째 답장 없음. 인스타 스토리는 올림", demand: "진심 어린 답장 3줄 이상" },
  noshow: { situation: "강남역 7시 약속, 6시 50분에 '나 오늘 좀 힘들 듯'", demand: "다음 밥값 전액" },
  borrowed: { situation: "편의점에서 3,500원 빌려가고 '내일 줄게' 한 지 두 달", demand: "3,500원 + 바나나우유 1개" },
  custom: { situation: "있었던 일을 날짜·장소·발언 순으로 구체적으로", demand: "청구할 것" },
};

const th = "w-[4.6em] border-r border-ink/70 bg-black/[0.035] px-2 py-2 text-left align-top font-normal tracking-[0.2em] whitespace-nowrap";
const hand = "w-full bg-transparent font-hand text-[23px] leading-[1.2] text-ink-blue outline-none placeholder:text-black/25";

/** 사건 접수서: 서식 줄에 펜으로 써 넣는다 */
export function IntakeForm({ input, set: rawSet, today }: { input: Input; set: <K extends keyof Input>(k: K, v: Input[K]) => void; today: string }) {
  const ph = PLACEHOLDER[input.type];
  // 칸에 쓸 때는 펜 소리, 체크칸은 체크 소리
  const set = <K extends keyof Input>(k: K, v: Input[K]) => {
    if (k === "type") playTick();
    else playPen();
    rawSet(k, v);
  };
  return (
    <Sheet formNo={FORM_NO.intake} side="(앞쪽)" page={1} className="font-serif">
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-1">
            <h1 className="text-[23px] leading-none font-black tracking-[0.18em] whitespace-nowrap">사건접수서</h1>
            <div className="mt-2 h-[5px] w-full border-y border-ink" />
          </div>
          <ApprovalBox cells={[{ label: "담당" }, { label: "검토" }, { label: "결재" }]} />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-black/60">※ 굵은 줄 안쪽만 기재. 기재 내용은 통고서 작성에 그대로 쓰임.</p>

        <table className="mt-3 w-full border-collapse border-[1.5px] border-ink text-[13px]">
          <tbody>
            <tr>
              <th scope="row" className={th}>
                원 고
              </th>
              <td className="px-2.5 py-1">
                <input
                  aria-label="원고 (내 닉네임)"
                  className={`${hand} min-h-10`}
                  maxLength={LIMITS.nick}
                  value={input.plaintiff_nick}
                  onChange={(e) => set("plaintiff_nick", e.target.value)}
                  placeholder="내 닉네임"
                />
              </td>
            </tr>
            <tr className="border-t border-ink/70">
              <th scope="row" className={th}>
                피 고
              </th>
              <td className="px-2.5 py-1">
                <input
                  aria-label="피고 (상대 닉네임)"
                  className={`${hand} min-h-10`}
                  maxLength={LIMITS.nick}
                  value={input.defendant_nick}
                  onChange={(e) => set("defendant_nick", e.target.value)}
                  placeholder="상대 닉네임"
                />
              </td>
            </tr>
            <tr className="border-t border-ink/70">
              <th scope="row" className={th}>
                유 형
              </th>
              <td className="px-1 py-1">
                <div role="radiogroup" aria-label="사건 유형" className="grid grid-cols-2">
                  {CASE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={input.type === t.id}
                      onClick={() => set("type", t.id)}
                      className="flex min-h-11 items-center gap-2 px-1 text-left text-[13px]"
                    >
                      <CheckSquare checked={input.type === t.id} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
            <tr className="border-t border-ink/70">
              <th scope="row" className={th}>
                발생일
              </th>
              <td className="px-2.5 py-1">
                <input
                  type="date"
                  aria-label="사건 발생일"
                  className={`${hand} min-h-10 text-[21px]`}
                  max={today}
                  value={input.incident_date}
                  onChange={(e) => set("incident_date", e.target.value)}
                />
              </td>
            </tr>
            <tr className="border-t border-ink/70">
              <th scope="row" className={th}>
                경 위
                <span className="mt-1 block font-type text-[10px] tracking-normal text-black/45 tabular-nums">
                  {input.situation.length}/{LIMITS.situation}
                </span>
              </th>
              <td className="px-2.5 pt-1">
                <textarea
                  aria-label="사건 경위 (무슨 일이 있었는지)"
                  className={`${hand} ruled min-h-[10.5rem] resize-none [--lh:2.1rem] leading-[2.1rem]`}
                  maxLength={LIMITS.situation}
                  value={input.situation}
                  onChange={(e) => set("situation", e.target.value)}
                  placeholder={ph.situation}
                />
              </td>
            </tr>
            <tr className="border-t border-ink/70">
              <th scope="row" className={th}>
                청 구
                <span className="mt-1 block font-type text-[10px] tracking-normal text-black/45 tabular-nums">
                  {input.demand.length}/{LIMITS.demand}
                </span>
              </th>
              <td className="px-2.5 py-1">
                <input
                  aria-label="청구 (원하는 것)"
                  className={`${hand} min-h-10`}
                  maxLength={LIMITS.demand}
                  value={input.demand}
                  onChange={(e) => set("demand", e.target.value)}
                  placeholder={ph.demand}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-5 text-right text-[13px] tracking-[0.08em]">위와 같이 접수합니다.</p>
        <p className="mt-1 text-right font-type text-[13px]">{formatDate(new Date(`${today}T12:00:00+09:00`))}</p>
        <p className="mt-2 flex items-end justify-end gap-1.5 text-[13px]">
          원고
          <span className="inline-block min-w-24 border-b border-ink/60 text-center font-hand text-[22px] leading-none text-ink-blue">
            {input.plaintiff_nick || " "}
          </span>
          <span className="text-black/40">(인)</span>
        </p>
      </div>
    </Sheet>
  );
}

/** 접수가 끝난 접수서: 통고서 아래 깔려 윗부분만 보인다 */
export function IntakeStub({ input, caseNo }: { input: Input; caseNo: string }) {
  const no = caseNo.split("-")[1];
  return (
    <Sheet formNo={FORM_NO.intake} side="(앞쪽)" className="rotate-[2.2deg] font-serif">
      <div className="relative flex h-[118px] items-start justify-between px-5 pt-3">
        <div>
          <p className="text-[19px] leading-none font-black tracking-[0.18em]">사건접수서</p>
          <p className="mt-3 text-[12.5px]">
            원고 <span className="font-hand text-[20px] text-ink-blue">{input.plaintiff_nick}</span>
            <span className="mx-2 text-black/30">|</span>
            피고 <span className="font-hand text-[20px] text-ink-blue">{input.defendant_nick}</span>
          </p>
        </div>
        <div className="flex items-start gap-2">
          <DateStamp label="접수" date={formatDate(new Date()).replaceAll(" ", "")} foot={no ? `제 ${no} 호` : undefined} className="stamp-ink rotate-[-4deg]" />
          <ApprovalBox className="hidden sm:table" cells={[{ label: "담당", mark: <Scribble text={input.plaintiff_nick.slice(0, 2)} /> }, { label: "결재" }]} />
        </div>
      </div>
    </Sheet>
  );
}
