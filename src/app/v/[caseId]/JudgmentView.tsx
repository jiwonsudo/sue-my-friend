"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Desk } from "@/components/desk/Desk";
import { DropIn, StampIn } from "@/components/desk/motion";
import { btn } from "@/components/desk/ui";
import { JudgmentDocument, type JudgmentDocumentProps } from "@/components/JudgmentDocument";
import { RubberStamp } from "@/components/Seal";
import { playGavel, playStamp } from "@/lib/client/sfx";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  me: Role | null;
  loser: Role;
  counterHref: string;
  doc: Omit<JudgmentDocumentProps, "compact" | "className">;
};

export function JudgmentView({ caseId, me, loser, counterHref, doc }: Props) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"gavel" | "doc">(reduce ? "doc" : "gavel");
  const [stamped, setStamped] = useState(!!reduce);
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (phase !== "gavel") return;
    const a = setTimeout(playGavel, 450);
    const b = setTimeout(() => setPhase("doc"), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [phase]);

  // 판결문이 책상에 놓인 뒤 도장
  useEffect(() => {
    if (phase !== "doc" || stamped) return;
    const t = setTimeout(() => {
      setStamped(true);
      playStamp({ ink: true });
      navigator.vibrate?.(50);
    }, 650);
    return () => clearTimeout(t);
  }, [phase, stamped]);

  const storyUrl = `/api/og/judgment/${caseId}?format=story`;
  const saveImage = async () => {
    setBusy(true);
    try {
      const blob = await (await fetch(storyUrl)).blob();
      const file = new File([blob], `판결문-${doc.caseNo}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "판결문" }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
    } finally {
      setBusy(false);
    }
  };

  if (phase === "gavel") {
    return (
      <AnimatePresence>
        <motion.div
          key="gavel"
          exit={{ opacity: 0 }}
          className="court-bg grid min-h-dvh place-items-center"
          onClick={() => setPhase("doc")}
        >
          <div className="text-center">
            <Gavel />
            <p className="mt-6 font-type text-[12px] tracking-[0.3em] text-white/50">선 고</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const tray = (
    <div className="space-y-2">
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <button type="button" disabled={busy} onClick={saveImage} className={btn.paper}>
          판결문 이미지 저장
        </button>
        <button type="button" onClick={() => setGuide((g) => !g)} aria-expanded={guide} className={`${btn.line} px-2 text-[14.5px]`}>
          스토리 게시
        </button>
      </div>
      {guide && (
        <ol className="space-y-0.5 px-1 font-type text-[11.5px] leading-relaxed text-paper/70">
          <li>1. [판결문 이미지 저장]으로 9:16 이미지 저장.</li>
          <li>2. 인스타그램 스토리 작성 → 저장한 이미지 선택.</li>
          <li>3. 링크 스티커에 이 페이지 주소 첨부.</li>
        </ol>
      )}
      {me === loser && (
        <Link href={counterHref} className={`${btn.line} w-full border-seal/70 text-[#ff9a9a]`}>
          반소 제기
        </Link>
      )}
    </div>
  );

  return (
    <Desk scene="judgment" tray={tray}>
      <DropIn enter={reduce ? "fade" : "drop"}>
        <JudgmentDocument
          {...doc}
          className="rotate-[-0.5deg]"
          verdictStamp={
            <StampIn show={stamped} rotate={-6}>
              <RubberStamp text={doc.verdictLabel} />
            </StampIn>
          }
        />
      </DropIn>

    </Desk>
  );
}

function Gavel() {
  return (
    <div className="relative mx-auto h-48 w-56">
      <motion.svg
        viewBox="0 0 120 120"
        className="absolute top-0 left-6 h-36 w-36 text-[#d9c3a0]"
        style={{ originX: "85%", originY: "85%" }}
        initial={{ rotate: -50 }}
        animate={{ rotate: [-50, 8, -18, 6] }}
        transition={{ duration: 0.9, times: [0, 0.45, 0.7, 1], ease: "easeIn" }}
      >
        <g transform="rotate(-35 60 60)" fill="currentColor">
          <rect x="28" y="22" width="56" height="26" rx="5" />
          <rect x="22" y="26" width="8" height="18" rx="2" fill="#8a5a2b" />
          <rect x="82" y="26" width="8" height="18" rx="2" fill="#8a5a2b" />
          <rect x="53" y="46" width="7" height="62" rx="3" />
        </g>
      </motion.svg>
      <div className="absolute right-4 bottom-4 left-4 h-6 rounded-[3px] bg-[#5b3a29]" />
      <motion.div
        className="absolute bottom-10 left-1/2 h-1 w-24 -translate-x-1/2 bg-white/60"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.4, 0], opacity: [0, 1, 0] }}
        transition={{ delay: 0.42, duration: 0.4 }}
      />
    </div>
  );
}
