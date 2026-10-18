"use client";

import { CheckSquare } from "@/components/desk/Stamps";
import { PickUp } from "@/components/desk/motion";
import { ApprovalBox, FORM_NO, Sheet } from "@/components/desk/Sheet";
import { CASE_GROUPS, CASE_TYPES } from "@/lib/constants";

/** 책상 위 빈 사건 접수서. 집으면 작성 화면으로 넘어간다. */
export function LandingIntake() {
  return (
    <PickUp href="/new" rotate={-1.4} className="relative z-10">
      {(pick) => (
        <Sheet formNo={FORM_NO.intake} side="(앞쪽)" page={1} className="font-serif">
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="pt-1">
                <h1 className="text-[23px] leading-none font-black tracking-[0.18em] whitespace-nowrap">사건접수서</h1>
                <div className="mt-2 h-[5px] w-full border-y border-ink" />
              </div>
              <ApprovalBox cells={[{ label: "담당" }, { label: "검토" }, { label: "결재" }]} />
            </div>

            <ol className="mt-4 space-y-0.5 text-[12.5px] leading-relaxed text-black/70">
              <li>1. 친구 간 사소한 원한(내기·노쇼·지각, 빌린 돈·더치페이, 읽씹·단톡방 잠수, 게임 트롤·스포일러 등)에 한하여 접수함.</li>
              <li>2. 접수된 사건은 통고서로 작성하여 상대방에게 송달함.</li>
              <li>3. 상대방이 다투는 경우 한마디씩 주고받은 뒤 AI 재판장이 바로 판결함.</li>
            </ol>

            <table className="mt-4 w-full border-collapse border-[1.5px] border-ink text-[13px]">
              <tbody>
                <Row h="원 고" />
                <Row h="피 고" />
                <tr className="border-t border-ink/70">
                  <th scope="row" className="w-[4.6em] border-r border-ink/70 bg-black/[0.035] px-2 py-1.5 text-left align-top font-normal tracking-[0.2em]">
                    유 형
                  </th>
                  <td className="px-1 py-1">
                    <ul className="grid grid-cols-2">
                      {CASE_GROUPS.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              pick(`/new?type=${CASE_TYPES.find((t) => t.group === g.id)!.id}`);
                            }}
                            className="flex min-h-11 w-full items-center gap-2 px-1 text-left text-[13px]"
                          >
                            <CheckSquare checked={false} />
                            {g.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr className="border-t border-ink/70">
                  <th scope="row" className="border-r border-ink/70 bg-black/[0.035] px-2 py-1.5 text-left align-top font-normal tracking-[0.2em]">
                    경 위
                  </th>
                  <td className="ruled h-[6rem] px-2 [--lh:2rem]" />
                </tr>
                <Row h="청 구" />
              </tbody>
            </table>

            <p className="mt-5 text-right text-[13px] tracking-[0.08em]">
              위와 같이 접수합니다.
              <br />
              <span className="font-type text-black/50">20&nbsp;&nbsp;&nbsp;.&nbsp;&nbsp;&nbsp;.&nbsp;&nbsp;&nbsp;.</span>
            </p>
            <p className="mt-2 text-right text-[13px]">
              원고 <span className="inline-block w-24 border-b border-ink/60" /> <span className="text-black/40">(인)</span>
            </p>
          </div>
        </Sheet>
      )}
    </PickUp>
  );
}

function Row({ h }: { h: string }) {
  return (
    <tr className="border-t border-ink/70 first:border-t-0">
      <th scope="row" className="w-[4.6em] border-r border-ink/70 bg-black/[0.035] px-2 py-2 text-left font-normal tracking-[0.2em]">
        {h}
      </th>
      <td className="px-2" />
    </tr>
  );
}
