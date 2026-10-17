import { SERVICE_NAME } from "@/lib/constants";
import { Disclaimer } from "./Disclaimer";
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
  executed?: boolean;
  compact?: boolean;
  className?: string;
};

export function JudgmentDocument(p: JudgmentDocumentProps) {
  return (
    <article
      className={`paper relative overflow-hidden rounded-[3px] font-serif text-ink ${
        p.compact ? "px-5 py-6 text-[13px] leading-[1.75]" : "px-6 py-8 text-[15px] leading-[1.9] sm:px-10"
      } ${p.className ?? ""}`}
    >
      <p className="text-center text-[11px] tracking-[0.3em] text-muted">{SERVICE_NAME} 배심 법정</p>
      <h1 className={`mt-1 mb-5 text-center font-black tracking-[0.8em] pl-[0.8em] ${p.compact ? "text-xl" : "text-2xl"}`}>판결</h1>
      <dl className="mb-5 grid grid-cols-[4.5em_1fr] gap-y-0.5">
        <dt className="text-muted">사 건</dt>
        <dd>
          {p.caseNo} {p.title}
        </dd>
        <dt className="text-muted">원 고</dt>
        <dd>{p.plaintiff}</dd>
        <dt className="text-muted">피 고</dt>
        <dd>{p.defendant}</dd>
      </dl>
      <h2 className="mb-2 text-center font-bold tracking-[0.5em] pl-[0.5em]">주문</h2>
      <p className="mb-5 font-bold">{p.order}</p>
      {!p.compact && (
        <>
          <h2 className="mb-2 text-center font-bold tracking-[0.5em] pl-[0.5em]">이유</h2>
          <p className="mb-6">{p.reason}</p>
        </>
      )}
      <p className="text-center tracking-wider">{p.date}</p>
      <div className="mt-4 flex justify-end">
        <RubberStamp text={p.verdictLabel} className="-rotate-6" />
      </div>
      {p.executed && (
        <div className="pointer-events-none absolute bottom-24 left-6 -rotate-12">
          <RubberStamp text="집행 완료" className="bg-paper/40 px-4 text-3xl" />
        </div>
      )}
      {!p.compact && (
        <>
          <hr className="mt-8 mb-3 border-paper-line" />
          <Disclaimer />
        </>
      )}
    </article>
  );
}
