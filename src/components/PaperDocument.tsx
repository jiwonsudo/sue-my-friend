import { Disclaimer } from "./Disclaimer";
import { Seal } from "./Seal";

export type PaperDocumentProps = {
  caseNo: string;
  toNick: string;
  fromNick: string;
  title: string;
  items: string[];
  date: string;
  seal?: React.ReactNode;
  className?: string;
};

/** 통고서 양식 */
export function PaperDocument({ caseNo, toNick, fromNick, title, items, date, seal, className = "" }: PaperDocumentProps) {
  return (
    <article className={`paper relative rounded-[3px] px-6 py-8 font-serif text-[15px] leading-[1.9] text-ink sm:px-10 ${className}`}>
      <h1 className="mb-6 text-center text-2xl font-black tracking-[0.6em] pl-[0.6em]">통고서</h1>
      <dl className="mb-6 grid grid-cols-[4.5em_1fr] gap-y-0.5 text-[14px]">
        <dt className="text-muted">사건번호</dt>
        <dd>{caseNo}</dd>
        <dt className="text-muted">수 신</dt>
        <dd>{toNick} 귀하</dd>
        <dt className="text-muted">발 신</dt>
        <dd>{fromNick}</dd>
        <dt className="text-muted">제 목</dt>
        <dd className="font-bold">{title}</dd>
      </dl>
      <hr className="mb-5 border-paper-line" />
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[1.6em_1fr]">
            <span>{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-center tracking-wider">{date}</p>
      <div className="mt-6 flex items-center justify-end gap-2">
        <span>발신인 {fromNick}</span>
        <span className="relative inline-flex h-10 w-10 items-center justify-center text-muted">
          (인)
          <span className="absolute -top-3 -left-2">{seal ?? <Seal name={fromNick} size={60} />}</span>
        </span>
      </div>
      <hr className="mt-8 mb-3 border-paper-line" />
      <Disclaimer />
    </article>
  );
}
