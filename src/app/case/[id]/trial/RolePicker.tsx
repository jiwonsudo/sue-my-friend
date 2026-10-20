import Link from "next/link";
import { Header } from "@/components/Header";
import { ROLE_LABEL } from "@/lib/trial";
import type { Role } from "@/lib/types";

/** 공방 입장: 링크만 있으면 누구나 들어와 원고·피고 중 자기 자리를 고른다. 지금 차례인 쪽을 위에 크게. */
export function RolePicker({
  caseId,
  caseNo,
  title,
  nicks,
  turn,
}: {
  caseId: string;
  caseNo: string;
  title: string;
  nicks: Record<Role, string>;
  turn: Role | null;
}) {
  const order: Role[] = turn === "plaintiff" ? ["plaintiff", "defendant"] : ["defendant", "plaintiff"];
  return (
    <div className="court-bg min-h-dvh text-white">
      <Header />
      <main className="mx-auto max-w-md px-4 pt-8 pb-10">
        <p className="font-type text-[11px] text-white/50">
          {caseNo} ¦ {title}
        </p>
        <div className="court-dialog mt-4 px-5 py-4">
          <p className="mb-1 font-type text-[12px] text-brass">재판장</p>
          <p className="font-serif text-[18px] leading-relaxed">출석을 확인하겠습니다. 본인 자리에 앉으십시오.</p>
        </div>
        <div className="mt-6 space-y-3">
          {order.map((r) => (
            <Link
              key={r}
              href={`/case/${caseId}/trial?as=${r}`}
              className={`flex min-h-16 w-full items-center justify-between border px-5 py-3 ${
                r === turn ? "border-brass bg-brass/15" : "border-white/20 bg-white/5"
              }`}
            >
              <span className="font-serif text-[19px] font-black tracking-[0.08em]">
                {ROLE_LABEL[r]} {nicks[r]}
              </span>
              <span className="font-type text-[12px] text-white/60">{r === turn ? "지금 차례 →" : "입장 →"}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
