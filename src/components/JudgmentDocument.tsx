import { SERVICE_NAME } from "@/lib/constants";
import { Disclaimer } from "./Disclaimer";
import { FORM_NO, FormTable, Sheet } from "./desk/Sheet";
import { RubberStamp } from "./Seal";

export type JudgmentDocumentProps = {
  caseNo: string;
  title: string;
  plaintiff: string;
  defendant: string;
  order: string;
  reason: string;
  date: string;
  verdictLabel: string;
  /** 서명란: 재판장 (AI) / 본 법정 */
  signer?: string;
  executed?: boolean;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** 판결 도장 자리를 연출용으로 바꿔 끼울 때 */
  verdictStamp?: React.ReactNode;
  executedStamp?: React.ReactNode;
};

export function JudgmentDocument(p: JudgmentDocumentProps) {
  const verdict = p.verdictStamp ?? <RubberStamp text={p.verdictLabel} className="-rotate-6" />;
  const executed = p.executedStamp ?? (p.executed ? <RubberStamp text="집행 완료" className="bg-paper/30 px-4 !text-3xl" /> : null);
  return (
    <Sheet
      formNo={p.compact ? undefined : FORM_NO.judgment}
      side={p.compact ? undefined : "(1쪽)"}
      page={p.compact ? undefined : 1}
      className={`overflow-hidden font-serif ${p.compact ? "text-[13px] leading-[1.7]" : "text-[15px] leading-[1.85]"} ${p.className ?? ""}`}
      style={p.style}
    >
      <div className={p.compact ? "px-5 pt-5 pb-5" : "px-6 pt-5 pb-5 sm:px-9"}>
        <p className="font-type text-[11px] tracking-[0.25em] text-black/50">{SERVICE_NAME} 간이 법정</p>
        <h1 className={`mt-2 leading-none font-black tracking-[0.9em] ${p.compact ? "text-[22px]" : "text-[28px]"}`}>판결</h1>
        <div className="mt-2.5 mb-5 h-[5px] w-[7.5rem] border-y border-ink" />
        <FormTable
          className={p.compact ? "text-[12.5px]" : ""}
          rows={[
            ["사 건", <span key="c"><span className="font-type text-[0.92em]">{p.caseNo}</span> {p.title}</span>],
            ["원 고", p.plaintiff],
            ["피 고", p.defendant],
          ]}
        />
        <h2 className="mt-6 mb-1.5 font-bold tracking-[0.6em]">주문</h2>
        <p className="border-l-[3px] border-ink pl-3 font-bold">{p.order}</p>
        {!p.compact && (
          <>
            <h2 className="mt-6 mb-1.5 font-bold tracking-[0.6em]">이유</h2>
            <p>{p.reason}</p>
          </>
        )}
        <div className={`flex items-end justify-between ${p.compact ? "mt-5" : "mt-10"}`}>
          <div>
            <p className="tracking-[0.12em]">{p.date}</p>
            <p className="mt-1 text-[0.9em] text-black/60">{p.signer ?? "재판장 (AI)"}</p>
          </div>
          {verdict}
        </div>
        {executed && <div className="pointer-events-none absolute bottom-[38%] left-5 -rotate-12">{executed}</div>}
        <hr className={`mb-3 border-paper-line ${p.compact ? "mt-5" : "mt-8"}`} />
        <Disclaimer className={p.compact ? "text-[10px]" : ""} />
      </div>
    </Sheet>
  );
}
