import Link from "next/link";
import { Desk } from "./desk/Desk";
import { Sheet } from "./desk/Sheet";
import { btn } from "./desk/ui";

export type Article = { title: string; body: React.ReactNode };

/** 약관·방침 같은 긴 문서: 책상 위 서식 한 장에 제N조로 */
export function LegalDoc({ title, formNo, effective, intro, articles }: { title: string; formNo: string; effective: string; intro: React.ReactNode; articles: Article[] }) {
  return (
    <Desk scene="plain">
      <Sheet formNo={formNo} side={`시행 ${effective}`} page={1} className="font-serif text-[14px] leading-[1.8]">
        <div className="px-6 pt-5 pb-6">
          <h1 className="text-[24px] leading-tight font-black tracking-[0.12em]">{title}</h1>
          <div className="mt-2.5 mb-5 h-[5px] w-[9rem] border-y border-ink" />
          <div className="mb-6 text-black/75">{intro}</div>
          <ol className="space-y-5">
            {articles.map((a, i) => (
              <li key={a.title}>
                <h2 className="mb-1 font-bold">
                  제{i + 1}조 ({a.title})
                </h2>
                <div className="space-y-1.5 text-black/80 [&_li]:ml-4 [&_li]:list-[circle] [&_table]:w-full [&_td]:border [&_td]:border-ink/40 [&_td]:p-1.5 [&_td]:align-top [&_td]:text-[12.5px] [&_th]:border [&_th]:border-ink/40 [&_th]:bg-black/[0.035] [&_th]:p-1.5 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-normal">
                  {a.body}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[13px] text-black/60">부칙: 이 문서는 {effective}부터 시행합니다.</p>
          <Link href="/" className={`${btn.onPaper} mt-6 w-full`}>
            처음으로
          </Link>
        </div>
      </Sheet>
    </Desk>
  );
}
