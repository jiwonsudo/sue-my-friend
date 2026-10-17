"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Google Publisher Tag 는 타입 패키지 없이 전역으로 붙는다 */

import { useEffect, useRef, useState } from "react";

const UNIT = process.env.NEXT_PUBLIC_GAM_REWARDED_UNIT;
const MOCK = process.env.NEXT_PUBLIC_AD_MOCK === "1" || process.env.NODE_ENV !== "production";

/** 광고를 띄울 수 있는지: 광고 단위가 있거나, 개발·테스트용 가짜 광고를 켰을 때 */
export const adsAvailable = Boolean(UNIT) || MOCK;

type Props = {
  /** 광고를 끝까지 봤을 때 (보여 줄 광고가 없을 때도 호출: noFill=true) */
  onReward: (noFill?: boolean) => void;
  /** 중간에 닫았을 때 */
  onCancel: () => void;
};

/** 보상형 광고. Google Ad Manager 광고 단위가 있으면 실제 광고, 없으면 테스트용 가짜 광고 */
export function RewardedAd(p: Props) {
  return UNIT ? <GamRewarded unit={UNIT} {...p} /> : <MockRewarded {...p} />;
}

let gptLoading: Promise<void> | null = null;
function loadGpt(): Promise<void> {
  if (gptLoading) return gptLoading;
  gptLoading = new Promise((resolve, reject) => {
    const w = window as any;
    w.googletag = w.googletag || { cmd: [] };
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    s.onload = () => resolve();
    s.onerror = () => {
      gptLoading = null;
      reject(new Error("gpt"));
    };
    document.head.appendChild(s);
  });
  return gptLoading;
}

function GamRewarded({ unit, onReward, onCancel }: Props & { unit: string }) {
  const [status, setStatus] = useState<"loading" | "showing" | "nofill">("loading");
  const done = useRef(false);

  useEffect(() => {
    let slot: any = null;
    let rewarded = false;
    const handlers: [string, (e: any) => void][] = [];
    const finish = (fn: () => void) => {
      if (done.current) return;
      done.current = true;
      fn();
    };
    const noFill = () => {
      setStatus("nofill");
      // 보여 줄 광고가 없으면 이번엔 그냥 선임해 준다 (사용자 잘못이 아니므로)
      setTimeout(() => finish(() => onReward(true)), 1500);
    };

    loadGpt()
      .then(() => {
        const googletag = (window as any).googletag;
        googletag.cmd.push(() => {
          slot = googletag.defineOutOfPageSlot(unit, googletag.enums.OutOfPageFormat.REWARDED);
          // 보상형 광고를 지원하지 않는 화면(데스크톱 등)이면 null
          if (!slot) return noFill();
          slot.addService(googletag.pubads());
          const on = (type: string, fn: (e: any) => void) => {
            const h = (e: any) => e.slot === slot && fn(e);
            handlers.push([type, h]);
            googletag.pubads().addEventListener(type, h);
          };
          on("rewardedSlotReady", (e) => {
            setStatus("showing");
            e.makeRewardedVisible();
          });
          on("rewardedSlotGranted", () => {
            rewarded = true;
          });
          on("rewardedSlotClosed", () => {
            googletag.destroySlots([slot]);
            finish(() => (rewarded ? onReward() : onCancel()));
          });
          on("slotRenderEnded", (e) => {
            if (e.isEmpty) noFill();
          });
          googletag.enableServices();
          googletag.display(slot);
        });
      })
      .catch(noFill);

    return () => {
      const googletag = (window as any).googletag;
      if (!googletag?.pubads) return;
      for (const [type, h] of handlers) googletag.pubads().removeEventListener?.(type, h);
      if (slot) googletag.destroySlots([slot]);
    };
    // 마운트 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "showing") return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-6 text-center text-white">
      <p className="font-type text-[13px] text-white/80">
        {status === "loading" ? "광고 불러오는 중" : "지금 보여 줄 광고가 없음. 이번엔 무료로 선임함."}
      </p>
    </div>
  );
}

const MOCK_SECONDS = 5;

/** 개발용 가짜 광고: 5초 카운트다운 뒤 보상 */
function MockRewarded({ onReward, onCancel }: Props) {
  const [left, setLeft] = useState(MOCK_SECONDS);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 px-6 text-center text-white" role="dialog" aria-label="광고">
      <div className="grid h-64 w-full max-w-xs place-items-center border border-dashed border-white/40 font-type text-[13px] text-white/60">
        광고 자리 (테스트)
        <br />
        실제 서비스에서는 Google Ad Manager 보상형 광고
      </div>
      {left > 0 ? (
        <p className="font-type text-[13px] text-white/70">{left}초 뒤 보상 지급</p>
      ) : (
        <button type="button" onClick={() => onReward()} className="min-h-12 w-full max-w-xs bg-paper font-serif text-[16px] font-bold text-ink">
          보상 받고 변호인 선임
        </button>
      )}
      <button type="button" onClick={onCancel} className="min-h-11 font-type text-[12px] text-white/50 underline">
        광고 닫기 (선임 안 함)
      </button>
    </div>
  );
}
