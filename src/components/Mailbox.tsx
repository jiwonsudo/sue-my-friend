"use client";

import { playFold, playMailbox, playTear } from "@/lib/client/sfx";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState } from "react";
import { TriFold } from "./desk/TriFold";
import { RubberStamp } from "./Seal";

type Stage = "closed" | "envelope" | "tearing" | "unfold";

/**
 * 우편함 → 봉투 → 뜯기 → 3단 접힘 펼치기. 끝나면 onDone.
 */
export function MailboxSequence({ fromNick, onDone }: { fromNick: string; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>("closed");

  const openBox = () => {
    if (stage !== "closed") return;
    playMailbox();
    setStage("envelope");
  };
  const tear = () => {
    if (stage !== "envelope") return;
    setStage("tearing");
    playTear();
    setTimeout(() => {
      setStage("unfold");
      playFold();
      setTimeout(playFold, 550);
    }, 900);
    setTimeout(onDone, 900 + 1300);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40 || info.velocity.y < -300) tear();
  };

  return (
    <div className="mailbox-scene relative flex h-[calc(100dvh-48px)] items-center justify-center overflow-hidden [perspective:1200px]">
      {/* 우편함 */}
      <AnimatePresence>
        {(stage === "closed" || stage === "envelope") && (
          <motion.button
            type="button"
            aria-label="우편함 열기"
            onClick={openBox}
            className="absolute bottom-[12%]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: stage === "envelope" ? 60 : 0, scale: stage === "envelope" ? 0.9 : 1 }}
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
            <TriFold folded={stage !== "unfold"} initialFolded />
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

/** 비스듬히 본 원통형 우편함. 평면 SVG 지만 그라데이션·그림자로 입체감을 낸다. */
function MailboxArt({ open }: { open: boolean }) {
  // 앞면 아치: 중심 (85, 110), 반지름 45, 아래 175 / 뒷면은 (+75, -27) 만큼 뒤로
  const front = "M40 175 V110 A45 45 0 0 1 130 110 V175 Z";
  return (
    <svg width="290" height="348" viewBox="0 0 250 300" aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id="mb-body" x1="0.25" y1="0" x2="0.65" y2="1">
          <stop offset="0" stopColor="#8d99a8" />
          <stop offset="0.18" stopColor="#5b6674" />
          <stop offset="0.55" stopColor="#343b45" />
          <stop offset="1" stopColor="#171a1f" />
        </linearGradient>
        <linearGradient id="mb-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a535f" />
          <stop offset="1" stopColor="#252a31" />
        </linearGradient>
        <linearGradient id="mb-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020203" />
          <stop offset="1" stopColor="#24282e" />
        </linearGradient>
        <linearGradient id="mb-post" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a6b42" />
          <stop offset="0.6" stopColor="#7a5030" />
          <stop offset="1" stopColor="#56371f" />
        </linearGradient>
        <linearGradient id="mb-flag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3384a" />
          <stop offset="1" stopColor="#97101d" />
        </linearGradient>
        <radialGradient id="mb-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="150" cy="290" rx="95" ry="12" fill="url(#mb-shadow)" />

      {/* 기둥: 앞면 + 옆면 */}
      <path d="M150 168 l10 -4 v124 l-10 4 z" fill="#4a2f1a" />
      <rect x="118" y="168" width="32" height="124" fill="url(#mb-post)" />
      <path d="M124 180 v100 M134 175 v110 M143 185 v95" stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
      {/* 받침대 */}
      <path d="M96 160 h80 l12 -6 v8 l-12 6 h-80 z" fill="#6b4529" />
      <path d="M96 160 h80 l12 -6 h-80 z" fill="#a77a4f" />

      {/* 몸통 옆면 (원통) */}
      <path d="M85 65 L160 38 A45 45 0 0 1 205 83 V148 L130 175 V110 A45 45 0 0 0 85 65 Z" fill="url(#mb-body)" />
      {/* 위쪽 하이라이트, 리벳 줄 */}
      <path d="M72 72 L148 45" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <path d="M118 62 L192 36" stroke="#fff" strokeOpacity="0.12" strokeWidth="10" strokeLinecap="round" />
      <path d="M140 110 Q170 98 198 90 M140 160 L198 139" stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />

      {/* 열렸을 때 안쪽 */}
      <path d={front} fill="url(#mb-inside)" />
      {open && (
        <g>
          <path d="M58 168 L66 128 L118 136 L112 172 Z" fill="#efe6d2" />
          <path d="M66 128 L92 150 L118 136" stroke="#c9bfa8" fill="none" />
        </g>
      )}

      {/* 문: 아래 경첩으로 앞으로 접혀 내려온다 */}
      <motion.g
        style={{ originX: "85px", originY: "175px", transformBox: "view-box" }}
        initial={false}
        animate={{ scaleY: open ? -0.32 : 1, skewX: open ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 15 }}
      >
        <path d={front} fill="url(#mb-front)" stroke="#68717d" strokeWidth="3" />
        <path d="M48 112 A37 37 0 0 1 85 75" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="76" y="92" width="18" height="7" rx="3.5" fill="#c9cdd3" stroke="#2a2f36" />
      </motion.g>

      {/* 깃발 (올라감 = 우편물 있음) */}
      <circle cx="176" cy="122" r="4" fill="#20242a" />
      <motion.g
        initial={{ rotate: 90 }}
        animate={{ rotate: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 10 }}
        style={{ originX: "176px", originY: "122px", transformBox: "view-box" }}
      >
        <rect x="173" y="56" width="6" height="68" rx="2" fill="#c8ccd2" />
        <rect x="176" y="56" width="3" height="68" fill="#8b9097" />
        <path d="M179 56 h30 l-4 10 l4 10 h-30 z" fill="url(#mb-flag)" />
        <path d="M179 76 h30" stroke="#5a0810" strokeWidth="2" />
      </motion.g>
    </svg>
  );
}

function Envelope({ torn, fromNick }: { torn: boolean; fromNick: string }) {
  return (
    <div className="relative h-[180px] w-[290px] [transform:rotateX(14deg)_rotateZ(-3deg)]">
      {/* 두께 + 그림자 */}
      <div className="absolute inset-0 translate-y-[5px] rounded-[3px] bg-[#cdbf9f]" />
      <div className="absolute inset-0 rounded-[3px] bg-[#efe6d2] shadow-[0_30px_40px_-12px_rgb(0_0_0/0.55),0_8px_12px_rgb(0_0_0/0.25)]" />
      {/* 뜯기는 윗부분 */}
      <motion.div
        className="absolute inset-x-0 top-0 h-7 rounded-t-[3px] bg-[#e9dfc8] [clip-path:polygon(0_0,100%_0,100%_70%,95%_100%,90%_70%,85%_100%,80%_70%,75%_100%,70%_70%,65%_100%,60%_70%,55%_100%,50%_70%,45%_100%,40%_70%,35%_100%,30%_70%,25%_100%,20%_70%,15%_100%,10%_70%,5%_100%,0_70%)]"
        animate={torn ? { y: -60, x: 40, rotate: 18, opacity: 0 } : { y: 0 }}
        transition={{ duration: 0.45, ease: "easeIn" }}
      />
      {/* 앞면 */}
      <div className="absolute inset-0 top-7 rounded-b-[3px] border-t border-dashed border-black/10 bg-[linear-gradient(170deg,#f8f2e3,#ece2cb)] px-5 pt-5 font-serif">
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
