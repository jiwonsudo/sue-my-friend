"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { RubberStamp, Seal } from "../Seal";
import { InkPad } from "./props";
import { TriFold } from "./TriFold";

type Stage = "fold" | "envelope" | "close" | "stamp" | "push";

const T = { envelope: 1250, close: 1900, stamp: 2350, push: 3350, done: 3950 };

/**
 * 발송 연출: 3단 접기 → 봉투에 넣기 → 봉하기 → 인주 찍고 도장 → 책상 밖으로 밀어냄.
 * 끝나면 onDone. reduced-motion 이면 짧은 페이드 후 바로 onDone.
 */
export function SendSequence({ toNick, fromNick, onDone }: { toNick: string; fromNick: string; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("fold");
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const ts = [
      setTimeout(() => setFolded(true), 150),
      setTimeout(() => setStage("envelope"), T.envelope),
      setTimeout(() => setStage("close"), T.close),
      setTimeout(() => setStage("stamp"), T.stamp),
      setTimeout(() => navigator.vibrate?.(60), T.stamp + 520),
      setTimeout(() => setStage("push"), T.push),
      setTimeout(onDone, T.done),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce, onDone]);

  if (reduce) {
    return (
      <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="paper px-6 py-4 font-serif text-lg font-bold">발송 처리됨</p>
      </motion.div>
    );
  }

  const inEnvelope = stage !== "fold";
  const sealed = stage === "stamp" || stage === "push";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 [perspective:1400px]" aria-live="polite">
      <p className="sr-only">통고서를 접어 봉투에 넣고 발송하는 중</p>

      {/* 인주 */}
      <motion.div
        className="absolute right-4 bottom-[18%] w-24"
        initial={{ opacity: 0, x: 60 }}
        animate={stage === "close" || stage === "stamp" ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
        transition={{ duration: 0.3 }}
      >
        <InkPad />
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-1/2 h-[390px] w-[300px] -translate-x-1/2 -translate-y-1/2"
        animate={stage === "push" ? { x: "110vw", rotate: 10 } : { x: 0, rotate: 0 }}
        transition={stage === "push" ? { duration: 0.55, ease: [0.5, 0, 0.75, 0] } : { duration: 0 }}
      >
        {/* 봉투 뒷면 */}
        <motion.div
          className="absolute inset-x-0 top-[120px] h-[170px] rounded-[3px] bg-[#e6dbc3] shadow-[0_18px_30px_-12px_rgb(0_0_0/0.6)]"
          initial={{ y: 500 }}
          animate={{ y: inEnvelope ? 0 : 500 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
        {/* 접힌 통고서 */}
        <motion.div
          className="absolute top-0 left-[10px]"
          animate={inEnvelope ? { y: 12, scale: 0.97 } : { y: 0 }}
          transition={{ delay: inEnvelope ? 0.25 : 0, duration: 0.5, ease: "easeInOut" }}
        >
          <TriFold folded={folded} />
        </motion.div>
        {/* 봉투 앞 주머니 */}
        <motion.div
          className="absolute inset-x-0 top-[120px] h-[170px] overflow-hidden rounded-[3px] bg-[#f1e8d4]"
          style={{ clipPath: "polygon(0 18%, 50% 52%, 100% 18%, 100% 100%, 0 100%)" }}
          initial={{ y: 500 }}
          animate={{ y: inEnvelope ? 0 : 500 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        >
          <div className="absolute bottom-4 left-5 font-serif text-[13px] leading-relaxed text-ink">
            <p>
              <span className="font-type text-[11px] text-black/45">수 신</span> {toNick} 귀하
            </p>
            <p>
              <span className="font-type text-[11px] text-black/45">발 신</span> {fromNick}
            </p>
          </div>
          <RubberStamp text="통고서 재중" className="absolute right-4 bottom-5 rotate-[-6deg] text-[13px]" />
        </motion.div>
        {/* 덮개 */}
        <motion.div
          className="absolute inset-x-0 top-[120px] h-[90px] origin-top bg-[#e9dfc8] [backface-visibility:hidden]"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          initial={{ rotateX: 180, opacity: 0 }}
          animate={stage === "fold" || stage === "envelope" ? { rotateX: 180, opacity: inEnvelope ? 1 : 0 } : { rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        />
        {/* 봉인 도장 */}
        {sealed && (
          <motion.div
            className="absolute top-[178px] left-1/2 -ml-[28px]"
            initial={{ scale: 2.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 600, damping: 18 }}
          >
            <Seal name={fromNick} size={56} />
          </motion.div>
        )}
      </motion.div>

      {/* 도장 손잡이 (위에서 본 원기둥): 인주 → 봉투 */}
      {stage === "stamp" && (
        <motion.div
          className="absolute h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f0d7a3,#c99a55_55%,#7d5222)] shadow-[0_14px_18px_rgb(0_0_0/0.45)]"
          style={{ left: "calc(50% - 32px)", top: "calc(50% - 21px)" }}
          initial={{ x: "38vw", y: "26vh", scale: 1.15, opacity: 1 }}
          animate={{
            x: ["38vw", "38vw", "38vw", "0vw", "0vw", "0vw", "-20vw"],
            y: ["26vh", "26vh", "26vh", "0vh", "0vh", "0vh", "-40vh"],
            scale: [1.15, 0.92, 1.15, 1.15, 0.88, 1.15, 1.2],
            opacity: [1, 1, 1, 1, 1, 1, 0],
          }}
          transition={{ duration: 1, times: [0, 0.12, 0.24, 0.45, 0.52, 0.62, 1], ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
