"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState } from "react";
import { RubberStamp } from "./Seal";

type Stage = "closed" | "envelope" | "tearing" | "unfold";

/**
 * 우편함 → 봉투 → 뜯기 → 3단 접힘 펼치기. 끝나면 onDone.
 */
export function MailboxSequence({ fromNick, onDone }: { fromNick: string; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>("closed");

  const openBox = () => stage === "closed" && setStage("envelope");
  const tear = () => {
    if (stage !== "envelope") return;
    setStage("tearing");
    setTimeout(() => setStage("unfold"), 900);
    setTimeout(onDone, 900 + 1300);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40 || info.velocity.y < -300) tear();
  };

  return (
    <div className="relative flex h-[calc(100dvh-48px)] items-center justify-center overflow-hidden [perspective:1200px]">
      {/* 우편함 */}
      <AnimatePresence>
        {(stage === "closed" || stage === "envelope") && (
          <motion.button
            type="button"
            aria-label="우편함 열기"
            onClick={openBox}
            className="absolute"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: stage === "envelope" ? 80 : 0, scale: stage === "envelope" ? 0.85 : 1 }}
            exit={{ opacity: 0, y: 140 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          >
            <MailboxArt open={stage !== "closed"} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 봉투 */}
      <AnimatePresence>
        {(stage === "envelope" || stage === "tearing") && (
          <motion.div
            className="absolute z-10 touch-none"
            initial={{ y: 60, scale: 0.4, opacity: 0 }}
            animate={{ y: stage === "tearing" ? 40 : -40, scale: 1, opacity: 1 }}
            exit={{ y: 260, opacity: 0, transition: { duration: 0.4 } }}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: stage === "envelope" ? 0.25 : 0 }}
            drag={stage === "envelope" ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={onDragEnd}
            onClick={tear}
          >
            <Envelope torn={stage === "tearing"} fromNick={fromNick} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 접힌 종이 → 펼침 */}
      <AnimatePresence>
        {(stage === "tearing" || stage === "unfold") && (
          <motion.div
            className={`absolute ${stage === "tearing" ? "z-[5]" : "z-20"}`}
            initial={{ y: 60, opacity: 0 }}
            animate={stage === "tearing" ? { y: -70, opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ delay: stage === "tearing" ? 0.35 : 0, duration: 0.55, ease: "easeOut" }}
          >
            <FoldedPaper unfolding={stage === "unfold"} />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="pointer-events-none absolute bottom-6 font-type text-[13px] text-black/50">
        {stage === "closed" && "우편함을 눌러 열 것"}
        {stage === "envelope" && "봉투를 위로 밀어 개봉"}
      </p>
    </div>
  );
}

function MailboxArt({ open }: { open: boolean }) {
  return (
    <svg width="220" height="240" viewBox="0 0 220 240" aria-hidden>
      {/* 기둥 */}
      <rect x="98" y="150" width="24" height="90" fill="#3b3b3b" />
      {/* 몸통 */}
      <path d="M20 150 V80 a70 60 0 0 1 140 0 V150 Z" fill="#2b2f36" />
      <path d="M20 150 V80 a70 60 0 0 1 140 0 V150 Z" fill="url(#shine)" opacity="0.25" />
      <defs>
        <linearGradient id="shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 안쪽 (문 열렸을 때 보임) */}
      <path d="M150 150 V82 a10 10 0 0 1 10 -2 V150 Z" fill="#111" />
      <rect x="148" y="78" width="14" height="72" fill="#0d0d0d" />
      {/* 문 */}
      <motion.g
        style={{ originX: "160px", originY: "150px", transformBox: "view-box" }}
        animate={{ scaleX: open ? -0.25 : 1, x: open ? 0 : 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 14 }}
      >
        <path d="M148 150 V78 a14 14 0 0 1 26 0 V150 Z" fill="#c8102e" />
        <rect x="156" y="108" width="10" height="4" rx="2" fill="#fff" opacity="0.8" />
      </motion.g>
      {/* 깃발 (올라가 있음) */}
      <motion.g
        initial={{ rotate: 90 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
        style={{ originX: "30px", originY: "120px", transformBox: "view-box" }}
      >
        <rect x="26" y="40" width="8" height="82" fill="#d9d9d9" />
        <path d="M30 40 h-26 v22 h26 Z" fill="#c8102e" />
      </motion.g>
    </svg>
  );
}

function Envelope({ torn, fromNick }: { torn: boolean; fromNick: string }) {
  return (
    <div className="relative h-[180px] w-[290px]">
      {/* 뒷면 */}
      <div className="absolute inset-0 rounded-md bg-[#efe6d2] shadow-xl" />
      {/* 뜯기는 윗부분 */}
      <motion.div
        className="absolute inset-x-0 top-0 h-7 rounded-t-md bg-[#e9dfc8] [clip-path:polygon(0_0,100%_0,100%_70%,95%_100%,90%_70%,85%_100%,80%_70%,75%_100%,70%_70%,65%_100%,60%_70%,55%_100%,50%_70%,45%_100%,40%_70%,35%_100%,30%_70%,25%_100%,20%_70%,15%_100%,10%_70%,5%_100%,0_70%)]"
        animate={torn ? { y: -60, x: 40, rotate: 18, opacity: 0 } : { y: 0 }}
        transition={{ duration: 0.45, ease: "easeIn" }}
      />
      {/* 앞면 */}
      <div className="absolute inset-0 top-7 rounded-b-md border-t border-dashed border-black/10 bg-[#f5eedd] px-5 pt-5 font-serif">
        <p className="text-xs text-black/50">발신</p>
        <p className="text-sm font-bold">{fromNick}</p>
        <div className="absolute top-4 right-4 rotate-[-8deg]">
          <RubberStamp text="통고서 재중" className="text-[13px]" />
        </div>
        <div className="mt-7 h-px w-40 bg-black/15" />
        <div className="mt-3 h-px w-28 bg-black/15" />
      </div>
    </div>
  );
}

function FoldedPaper({ unfolding }: { unfolding: boolean }) {
  const panel = "paper absolute inset-x-0 h-1/3 backface-hidden";
  return (
    <div className="relative h-[390px] w-[280px] [transform-style:preserve-3d]">
      {/* 가운데 */}
      <div className={`${panel} top-1/3 border-y-0 px-5`}>
        <Lines n={5} />
      </div>
      {/* 위 */}
      <motion.div
        className={`${panel} top-0 border-b-0 px-5 pt-5`}
        style={{ transformOrigin: "bottom", transformStyle: "preserve-3d" }}
        initial={{ rotateX: -178 }}
        animate={{ rotateX: unfolding ? 0 : -178 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.3, 0.7, 0.2, 1] }}
      >
        <p className="text-center font-serif text-lg font-black tracking-[0.5em]">통고서</p>
        <Lines n={3} />
      </motion.div>
      {/* 아래 */}
      <motion.div
        className={`${panel} bottom-0 border-t-0 px-5`}
        style={{ transformOrigin: "top", transformStyle: "preserve-3d" }}
        initial={{ rotateX: 178 }}
        animate={{ rotateX: unfolding ? 0 : 178 }}
        transition={{ duration: 0.6, ease: [0.3, 0.7, 0.2, 1] }}
      >
        <Lines n={4} />
      </motion.div>
    </div>
  );
}

function Lines({ n }: { n: number }) {
  return (
    <div className="space-y-3 pt-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-1.5 rounded bg-black/10" style={{ width: `${90 - ((i * 17) % 35)}%` }} />
      ))}
    </div>
  );
}
