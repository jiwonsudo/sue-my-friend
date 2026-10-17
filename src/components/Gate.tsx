import Link from "next/link";
import { Desk } from "./desk/Desk";
import { FORM_NO, Sheet } from "./desk/Sheet";
import { btn } from "./desk/ui";
import { RubberStamp } from "./Seal";

/** 들어갈 수 없는 화면: 책상 위에 되돌아온 반려 쪽지 */
export function Gate({ title, body }: { title: string; body: string }) {
  return (
    <Desk scene="plain">
      <Sheet formNo={FORM_NO.returned} side="반려 통지" className="mt-10 rotate-[-0.6deg] font-serif">
        <div className="relative px-6 pt-6 pb-8">
          <RubberStamp text="반 려" className="absolute top-2 right-5 rotate-[8deg] text-2xl" />
          <p className="mb-1 font-type text-[11px] tracking-[0.2em] text-black/45">처리 결과</p>
          <h1 className="mb-4 max-w-[13em] text-[21px] leading-snug font-black">{title}</h1>
          <p className="mb-8 text-[14.5px] leading-relaxed text-black/70">{body}</p>
          <Link href="/" className={`${btn.onPaper} w-full`}>
            처음으로
          </Link>
        </div>
      </Sheet>
    </Desk>
  );
}
