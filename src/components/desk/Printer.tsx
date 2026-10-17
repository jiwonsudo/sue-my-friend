"use client";

import { playPaperFeed, playPrintLine } from "@/lib/client/sfx";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const BODY = [
  "1. 귀하는 ……………………………………",
  "   ………………………………………………",
  "2. 이에 본인은 ……………………………",
  "   ………………………………………………",
  "3. 귀하가 ……………………………………",
];

/**
 * 초안을 기다리는 동안: 프린터 출지구에서 통고서가 한 줄씩 찍혀 나온다.
 * head 는 이미 아는 머리말(수신·발신 등). 본문은 응답이 올 때까지 반복해서 찍는다.
 */
export function Printer({ head, label = "작성 중" }: { head: string[]; label?: string }) {
  const reduce = useReducedMotion();
  const lines = [...head, ...BODY];
  const total = lines.reduce((n, l) => n + [...l].length, 0);
  const [n, setN] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      if (n >= total) {
        setRound((r) => r + 1);
        setN(head.reduce((k, l) => k + [...l].length, 0));
      } else setN((x) => x + 1);
    }, n >= total ? 700 : 32);
    return () => clearTimeout(t);
  }, [n, total, head, reduce]);

  // 줄이 바뀔 때마다 도트 프린터 소리
  const lineNo = (() => {
    let k = reduce ? total : n;
    for (let i = 0; i < lines.length; i++) {
      k -= [...lines[i]].length;
      if (k < 0) return i;
    }
    return lines.length;
  })();
  useEffect(() => {
    if (!reduce) playPrintLine();
  }, [lineNo, round, reduce]);
  useEffect(() => {
    if (!reduce) playPaperFeed();
  }, [reduce]);

  let left = reduce ? total : n;
  const shown = lines.map((l) => {
    const chars = [...l];
    const s = chars.slice(0, Math.max(0, left)).join("");
    left -= chars.length;
    return s;
  });
  const lastIdx = shown.findLastIndex((s) => s.length > 0);

  return (
    <div className="relative" role="status" aria-label={label}>
      {/* 출지구 */}
      <div className="relative z-20 mx-[-10px] h-11 rounded-[6px] bg-[linear-gradient(180deg,#3a3c42,#1b1c20)] shadow-[0_8px_14px_rgb(0_0_0/0.55)]">
        <div className="absolute inset-x-5 bottom-2 h-[3px] rounded-full bg-black shadow-[0_1px_0_rgb(255_255_255/0.12)]" />
        <div className="absolute top-2.5 left-4 flex items-center gap-2 font-type text-[11px] tracking-[0.2em] text-white/60">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-[#7dff9a]"
            animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
          />
          {label}
        </div>
      </div>
      <motion.div layout={!reduce} className="paper relative z-10 -mt-1 overflow-hidden px-5 pt-5 pb-6 font-type text-[13.5px] leading-[1.9] text-ink">
        {shown.map((s, i) =>
          i <= Math.max(lastIdx, 0) ? (
            <p key={`${round}-${i}`} className={`whitespace-pre-wrap ${i === 0 ? "mb-2 text-[17px] font-bold tracking-[0.5em]" : ""}`}>
              {s}
              {i === lastIdx && !reduce && <span className="ml-px inline-block h-[1em] w-[0.55em] translate-y-[2px] animate-pulse bg-ink/70" />}
            </p>
          ) : null,
        )}
      </motion.div>
    </div>
  );
}
