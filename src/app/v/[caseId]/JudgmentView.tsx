"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { JudgmentDocument, type JudgmentDocumentProps } from "@/components/JudgmentDocument";
import { api } from "@/lib/client/api";
import { playGavel } from "@/lib/client/sfx";
import { LIMITS } from "@/lib/constants";
import type { Role } from "@/lib/types";

type Props = {
  caseId: string;
  me: Role | null;
  loser: Role;
  executed: boolean;
  hasProof: boolean;
  proofUrl: string | null;
  counterHref: string;
  doc: Omit<JudgmentDocumentProps, "executed" | "compact" | "className">;
};

export function JudgmentView({ caseId, me, loser, executed, hasProof, proofUrl, counterHref, doc }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"gavel" | "doc">(reduce ? "doc" : "gavel");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
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

  const uploadProof = async (file: File) => {
    if (file.size > LIMITS.evidenceBytes) return setMsg("5MB 이하 이미지만 올릴 수 있어요.");
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api(`/api/cases/${caseId}/execution`, { method: "POST", body: fd });
      router.refresh();
      setMsg("인증 사진을 올렸어요. 상대가 확인하면 집행 완료!");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  };

  const confirmExecution = async () => {
    setBusy(true);
    try {
      await api(`/api/cases/${caseId}/execution/confirm`, { json: {} });
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류");
    } finally {
      setBusy(false);
    }
  };

  const btn = "flex min-h-12 w-full items-center justify-center rounded-xl text-[15px] font-bold disabled:opacity-40";
  return (
    <>
      <Header />
      <AnimatePresence mode="wait">
        {phase === "gavel" ? (
          <motion.div key="gavel" exit={{ opacity: 0 }} className="grid h-[calc(100dvh-48px)] place-items-center bg-court" onClick={() => setPhase("doc")}>
            <Gavel />
          </motion.div>
        ) : (
          <motion.main key="doc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md px-4 pt-5 pb-16">
            <JudgmentDocument {...doc} executed={executed} />

            <div className="mt-6 space-y-2">
              <button type="button" disabled={busy} onClick={saveImage} className={`${btn} bg-ink text-white`}>
                판결문 이미지 저장
              </button>
              <button type="button" onClick={() => setGuide((g) => !g)} className={`${btn} border border-black/15`}>
                인스타 스토리에 올리기
              </button>
              {guide && (
                <ol className="list-decimal space-y-1 rounded-xl bg-black/[0.03] p-4 pl-8 text-sm text-muted">
                  <li>위의 [판결문 이미지 저장]을 눌러 9:16 이미지를 저장하세요.</li>
                  <li>인스타그램에서 스토리 만들기 → 저장한 이미지를 고르세요.</li>
                  <li>링크 스티커로 이 페이지 주소를 붙이면 친구들이 판결문을 볼 수 있어요.</li>
                </ol>
              )}
            </div>

            {me && !executed && (
              <section className="mt-8 rounded-2xl border border-black/10 p-4">
                <p className="mb-1 font-bold">집행</p>
                {me === loser ? (
                  <>
                    <p className="mb-3 text-sm text-muted">판결을 이행했다면 인증 사진을 올려주세요. 상대가 확인하면 &lsquo;집행 완료&rsquo; 도장이 찍힙니다.</p>
                    {proofUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={proofUrl} alt="집행 인증" className="mb-3 max-h-60 rounded-lg object-contain" />
                    )}
                    <label className={`${btn} cursor-pointer bg-seal text-white`}>
                      {hasProof ? "인증 사진 다시 올리기" : "집행 완료 인증"}
                      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
                    </label>
                  </>
                ) : hasProof ? (
                  <>
                    <p className="mb-3 text-sm text-muted">상대가 집행 인증 사진을 올렸습니다.</p>
                    {proofUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={proofUrl} alt="집행 인증" className="mb-3 max-h-60 rounded-lg object-contain" />
                    )}
                    <button type="button" disabled={busy} onClick={confirmExecution} className={`${btn} bg-seal text-white`}>
                      확인 (집행 완료)
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted">상대의 집행 인증을 기다리는 중입니다.</p>
                )}
                {msg && <p className="mt-2 text-sm text-seal">{msg}</p>}
              </section>
            )}

            {me === loser && (
              <Link href={counterHref} className={`${btn} mt-4 border-2 border-seal text-seal`}>
                반소 제기
              </Link>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}

function Gavel() {
  return (
    <div className="relative h-48 w-56">
      <motion.svg
        viewBox="0 0 120 120"
        className="absolute top-0 left-6 h-36 w-36 text-white"
        style={{ originX: "85%", originY: "85%" }}
        initial={{ rotate: -50 }}
        animate={{ rotate: [-50, 8, -18, 6] }}
        transition={{ duration: 0.9, times: [0, 0.45, 0.7, 1], ease: "easeIn" }}
      >
        <g transform="rotate(-35 60 60)" fill="currentColor">
          <rect x="28" y="22" width="56" height="26" rx="5" />
          <rect x="22" y="26" width="8" height="18" rx="2" fill="#c8102e" />
          <rect x="82" y="26" width="8" height="18" rx="2" fill="#c8102e" />
          <rect x="53" y="46" width="7" height="62" rx="3" />
        </g>
      </motion.svg>
      <div className="absolute right-4 bottom-4 left-4 h-6 rounded-md bg-[#5b3a29]" />
      <motion.div
        className="absolute bottom-10 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/60"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.4, 0], opacity: [0, 1, 0] }}
        transition={{ delay: 0.42, duration: 0.4 }}
      />
    </div>
  );
}
