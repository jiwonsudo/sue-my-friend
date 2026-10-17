"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { Header } from "@/components/Header";
import { MailboxSequence } from "@/components/Mailbox";
import { PaperDocument, type PaperDocumentProps } from "@/components/PaperDocument";
import { Seal } from "@/components/Seal";
import { api } from "@/lib/client/api";
import type { CaseRow, CaseStatus } from "@/lib/types";

type Props = {
  token: string;
  caseId: string;
  firstOpen: boolean;
  status: CaseStatus;
  responded: CaseRow["defendant_response"];
  deadline: string | null;
  doc: Omit<PaperDocumentProps, "seal" | "className">;
};

export function DefendantView({ token, caseId, firstOpen, status, responded, deadline, doc }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"intro" | "doc">(firstOpen && !reduce ? "intro" : "doc");
  const [stampIn, setStampIn] = useState(!firstOpen);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorded = useRef(false);

  // 열람 기록 + 피고 쿠키 발급
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    api(`/api/c/${token}/open`, { json: {} }).catch(() => {});
  }, [token]);

  const finishIntro = () => {
    setPhase("doc");
    setTimeout(() => {
      setStampIn(true);
      navigator.vibrate?.(60);
      setTimeout(() => {
        setToast("열람 시각이 기록되었습니다");
        setTimeout(() => setToast(null), 2600);
      }, 350);
    }, reduce ? 0 : 500);
  };

  useEffect(() => {
    // reduced-motion 첫 열람: 페이드만, 토스트는 그대로
    if (firstOpen && reduce) finishIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (action: "accept" | "object" | "countersue") => {
    const msg = {
      accept: "청구를 인정하고 이행하시겠습니까? 바로 판결이 선고됩니다.",
      object: "이의를 신청하고 공방을 시작할까요?",
      countersue: "맞고소하고 공방을 시작할까요?",
    }[action];
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ next: string }>(`/api/c/${token}/respond`, { json: { action } });
      router.push(r.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
      setBusy(false);
    }
  };

  const dismiss = async () => {
    if (!confirm("사건을 기각하면 문서가 숨겨지고 원고는 더 진행할 수 없습니다. 기각할까요?")) return;
    await api(`/api/c/${token}/dismiss`, { json: {} }).catch(() => {});
    router.refresh();
  };

  const report = async () => {
    const reason = prompt("신고 사유를 적어주세요 (괴롭힘, 개인정보 노출 등)");
    if (!reason?.trim()) return;
    await api(`/api/c/${token}/report`, { json: { reason } }).catch(() => {});
    setToast("신고가 접수되었습니다");
    setTimeout(() => setToast(null), 2000);
  };

  const canRespond = (status === "sent" || status === "opened") && !responded;
  const seal = (
    <motion.span
      className="block"
      initial={false}
      animate={stampIn ? { scale: 1, opacity: 1, rotate: -8 } : { scale: 3, opacity: 0, rotate: -8 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
    >
      <Seal name={doc.fromNick} size={60} />
    </motion.span>
  );

  if (closed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-sm text-muted">문서를 닫았습니다.</p>
        <button type="button" className="mt-6 text-xs text-black/30 underline" onClick={() => setClosed(false)}>
          다시 열기
        </button>
      </main>
    );
  }

  return (
    <>
      <Header
        right={
          phase === "intro" ? (
            <button type="button" className="min-h-11 px-2 text-sm text-muted" onClick={finishIntro}>
              건너뛰기
            </button>
          ) : null
        }
      />
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.div key="intro" exit={{ opacity: 0 }} className="bg-gradient-to-b from-white to-[#f4f1ea]">
            <MailboxSequence fromNick={doc.fromNick} onDone={finishIntro} />
          </motion.div>
        ) : (
          <motion.main
            key="doc"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md px-4 pt-5 pb-64"
          >
            <PaperDocument {...doc} seal={seal} className="fold-lines" />
          </motion.main>
        )}
      </AnimatePresence>

      {phase === "doc" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-md">
            {canRespond ? (
              <>
                <p className="mb-2 flex items-baseline justify-center gap-2 text-sm">
                  <span className="text-muted">답변 기한</span>
                  <Countdown deadline={deadline} className="text-xl font-bold text-seal" />
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={busy} onClick={() => respond("accept")} className="min-h-12 rounded-xl bg-ink px-2 text-[14px] font-bold text-white disabled:opacity-40">
                    인정하고 이행하기
                  </button>
                  <button disabled={busy} onClick={() => respond("object")} className="min-h-12 rounded-xl border border-black/15 px-2 text-[14px] font-bold disabled:opacity-40">
                    억울하다 (이의신청)
                  </button>
                  <button disabled={busy} onClick={() => respond("countersue")} className="min-h-12 rounded-xl bg-seal px-2 text-[14px] font-bold text-white disabled:opacity-40">
                    맞고소한다
                  </button>
                  <button disabled={busy} onClick={() => setClosed(true)} className="min-h-12 rounded-xl border border-black/15 px-2 text-[14px] font-bold text-muted disabled:opacity-40">
                    무시하기
                  </button>
                </div>
                {error && <p className="mt-2 text-center text-sm text-seal">{error}</p>}
                <div className="mt-2 flex justify-center gap-4 text-[12px] text-muted">
                  <button className="min-h-8 underline" onClick={dismiss}>
                    사건 기각하기
                  </button>
                  <button className="min-h-8 underline" onClick={report}>
                    신고
                  </button>
                </div>
              </>
            ) : status === "trial" || status === "voting" ? (
              <Link href={`/case/${caseId}/trial?as=defendant`} className="flex min-h-14 items-center justify-center rounded-2xl bg-court font-bold text-white">
                공방 입장
              </Link>
            ) : status === "judged" || status === "executed" ? (
              <Link href={`/v/${caseId}`} className="flex min-h-14 items-center justify-center rounded-2xl bg-seal font-bold text-white">
                판결문 보기
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm whitespace-nowrap text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
