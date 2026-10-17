import { CoffeeRing } from "./props";

/** 서식 번호. 실존 기관 서식과 헷갈리지 않게 서비스 이름을 붙인다. */
export const FORM_NO = {
  intake: "친고 서식 제1호",
  notice: "친고 서식 제2호",
  reply: "친고 서식 제2-1호",
  docket: "친고 서식 제5호",
  judgment: "친고 서식 제9호",
  returned: "친고 서식 제0호",
  terms: "친고 서식 제90호",
  privacy: "친고 서식 제91호",
} as const;

export type SheetProps = {
  formNo?: string;
  /** 오른쪽 위 작은 글씨. 예: (앞쪽) */
  side?: string;
  /** 쪽번호 "- 1 -" */
  page?: number;
  coffee?: boolean;
  tone?: "white" | "cream";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** 책상 위 종이 한 장 */
export function Sheet({ formNo, side, page, coffee, tone = "white", className = "", style, children }: SheetProps) {
  return (
    <article className={`${tone === "white" ? "paper" : "paper-2"} relative text-ink ${className}`} style={style}>
      {(formNo || side) && (
        <div className="flex items-baseline justify-between px-5 pt-3 font-type text-[10.5px] tracking-tight text-black/45">
          <span>{formNo && `[${formNo}]`}</span>
          <span>{side}</span>
        </div>
      )}
      {coffee && <CoffeeRing className="pointer-events-none absolute -top-6 -right-8 w-36 rotate-45" />}
      {children}
      {page != null && <p className="pb-3 text-center font-type text-[11px] text-black/45">- {page} -</p>}
    </article>
  );
}

/** 서식 표: 왼쪽 머리칸 + 오른쪽 내용 */
export function FormTable({ rows, className = "" }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <table className={`w-full border-collapse border-[1.5px] border-ink text-[14px] ${className}`}>
      <tbody>
        {rows.map(([h, v], i) => (
          <tr key={i} className="border-t border-ink/70 first:border-t-0">
            <th scope="row" className="w-[5.2em] border-r border-ink/70 bg-black/[0.035] px-2 py-1.5 text-left align-top font-normal tracking-[0.2em] whitespace-nowrap">
              {h}
            </th>
            <td className="px-2.5 py-1.5 align-top">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 결재란 */
export function ApprovalBox({
  cells,
  className = "",
}: {
  cells: { label: string; mark?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <table className={`border-collapse border border-ink/80 text-center text-[10.5px] ${className}`}>
      <tbody>
        <tr>
          <th rowSpan={2} className="w-5 border-r border-ink/80 px-0.5 py-1 font-normal leading-tight [writing-mode:vertical-rl]">
            결재
          </th>
          {cells.map((c) => (
            <th key={c.label} className="w-12 border-r border-b border-ink/80 py-0.5 font-normal tracking-[0.2em] last:border-r-0">
              {c.label}
            </th>
          ))}
        </tr>
        <tr>
          {cells.map((c) => (
            <td key={c.label} className="relative h-11 border-r border-ink/80 last:border-r-0">
              {c.mark}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
