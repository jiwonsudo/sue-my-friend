/** 사무실 접수인 (직사각형 3단). 자체 디자인, 기관명 없음. */
export function DateStamp({
  label,
  date,
  foot,
  color = "#2b46a0",
  className = "",
  style,
}: {
  label: string;
  date: string;
  foot?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex flex-col items-stretch border-[2.5px] text-center font-type leading-none opacity-85 ${className}`}
      style={{ borderColor: color, color, mixBlendMode: "multiply", ...style }}
    >
      <span className="border-b-[1.5px] px-2 py-1 text-[11px] font-bold tracking-[0.4em] pl-[calc(0.5rem+0.4em)]" style={{ borderColor: color }}>
        {label}
      </span>
      <span className="px-2 py-1 text-[12px] font-bold tabular-nums">{date}</span>
      {foot && (
        <span className="border-t-[1.5px] px-2 py-1 text-[10px]" style={{ borderColor: color }}>
          {foot}
        </span>
      )}
    </span>
  );
}

/** 결재란 칸에 휘갈긴 서명 */
export function Scribble({ text, className = "" }: { text: string; className?: string }) {
  return <span className={`absolute inset-0 grid place-items-center font-hand text-[22px] leading-none text-ink-blue ${className}`}>{text}</span>;
}

/** 손으로 그은 체크 표시 */
export function HandCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 13 C6 15 8 18 9 21 C12 13 16 7 23 2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 서식 체크칸 (☐) */
export function CheckSquare({ checked, className = "" }: { checked: boolean; className?: string }) {
  return (
    <span aria-hidden className={`relative inline-block h-[18px] w-[18px] shrink-0 border-[1.5px] border-ink bg-paper ${className}`}>
      {checked && <HandCheck className="absolute -top-2 -right-2 h-7 w-7 text-ink-blue" />}
    </span>
  );
}
