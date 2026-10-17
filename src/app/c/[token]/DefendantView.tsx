"use client";

import { playStamp } from "@/lib/client/sfx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { BrandLabel, Desk } from "@/components/desk/Desk";
import { DropIn, StampIn } from "@/components/desk/motion";
import { PostIt } from "@/components/desk/PostIt";
import { SoundToggle } from "@/components/desk/SoundToggle";
import { Scissors } from "@/components/desk/props";
import { FORM_NO } from "@/components/desk/Sheet";
import { CheckSquare, DateStamp } from "@/components/desk/Stamps";
import { btn } from "@/components/desk/ui";
import { MailboxSequence } from "@/components/Mailbox";
import { PaperDocument, type PaperDocumentProps } from "@/components/PaperDocument";
import { Seal } from "@/components/Seal";
import { api } from "@/lib/client/api";
import { formatDate, formatTime } from "@/lib/document";
import type { CaseRow, CaseStatus } from "@/lib/types";

type Props = {
  token: string;
  caseId: string;
  firstOpen: boolean;
  status: CaseStatus;
  responded: CaseRow["defendant_response"];
  deadline: string | null;
  openedAt: string | null;
  doc: Omit<PaperDocumentProps, "seal" | "className">;
};

export function DefendantView({ token, caseId, firstOpen, status, responded, deadline, openedAt, doc }: Props) {
  const [receivedAt] = useState(() => openedAt ?? new Date().toISOString());
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
      playStamp();
      navigator.vibrate?.(60);
      setTimeout(() => {
        setToast("열람 시각 기록됨");
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
      accept: "청구를 인정하고 이행합니까? 즉시 판결이 선고됩니다.",
      object: "이의를 신청하고 공방을 시작합니까?",
      countersue: "맞고소하고 공방을 시작합니까?",
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
    if (!confirm("기각하면 문서가 숨겨지고 원고는 더 진행할 수 없습니다. 기각합니까?")) return;
    await api(`/api/c/${token}/dismiss`, { json: {} }).catch(() => {});
    router.refresh();
  };

  const report = async () => {
    const reason = prompt("신고 사유 (괴롭힘, 개인정보 노출 등)");
    if (!reason?.trim()) return;
    await api(`/api/c/${token}/report`, { json: { reason } }).catch(() => {});
    setToast("신고 접수됨");
    setTimeout(() => setToast(null), 2000);
  };

  const canRespond = (status === "sent" || status === "opened") && !responded;
  const seal = (
    <StampIn show={stampIn}>
      <Seal name={doc.fromNick} size={60} />
    </StampIn>
  );

  if (closed) {
    return (
      <Desk scene="defendant">
        <div className="pt-24 text-center">
          <p className="font-type text-[13px] text-paper/70">문서를 덮었음. 답변 기한이 지나면 궐석 판결.</p>
          <button type="button" className="mt-6 min-h-11 font-type text-[12px] text-paper/40 underline" onClick={() => setClosed(false)}>
            다시 펼치기
          </button>
        </div>
      </Desk>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-dvh bg-[#e9e1d1]">
        <div className="flex h-12 items-center justify-between px-4">
          <BrandLabel />
          <span className="flex items-center">
            <SoundToggle dark />
            <button type="button" className="min-h-11 px-2 font-type text-[13px] text-black/50" onClick={finishIntro}>
              건너뛰기
            </button>
          </span>
        </div>
        <MailboxSequence fromNick={doc.fromNick} onDone={finishIntro} />
      </div>
    );
  }

  const tray = canRespond ? (
    <ReplySlip deadline={deadline} busy={busy} error={error} onRespond={respond} onIgnore={() => setClosed(true)} onDismiss={dismiss} onReport={report} />
  ) : status === "trial" || status === "voting" ? (
    <Link href={`/case/${caseId}/trial?as=defendant`} className={`${btn.ink} w-full`}>
      공방 입장
    </Link>
  ) : status === "judged" || status === "executed" ? (
    <Link href={`/v/${caseId}`} className={`${btn.seal} w-full`}>
      판결문 보기
    </Link>
  ) : null;

  return (
    <Desk scene="defendant" tray={tray}>
      <DropIn enter={firstOpen ? "drop" : "fade"}>
        <PaperDocument
          {...doc}
          seal={seal}
          coffee
          className="fold-lines"
          stamp={
            <StampIn show={stampIn} delay={0.25} rotate={6}>
              <DateStamp label="수신" date={formatTime(receivedAt)} foot={formatDate(receivedAt).replaceAll(" ", "")} className="stamp-ink" />
            </StampIn>
          }
        />
      </DropIn>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            exit={{ opacity: 0 }}
            className="fixed top-14 left-1/2 z-50 -translate-x-1/2"
          >
            <PostIt rotate={-2} className="whitespace-nowrap">
              {toast}
            </PostIt>
          </motion.div>
        )}
      </AnimatePresence>
    </Desk>
  );
}

type Action = "accept" | "object" | "countersue";

/** 통고서 하단 절취선 아래 회신 서식. 체크칸을 고르고 제출한다. */
function ReplySlip({
  deadline,
  busy,
  error,
  onRespond,
  onIgnore,
  onDismiss,
  onReport,
}: {
  deadline: string | null;
  busy: boolean;
  error: string | null;
  onRespond: (a: Action) => void;
  onIgnore: () => void;
  onDismiss: () => void;
  onReport: () => void;
}) {
  const [pick, setPick] = useState<Action | "ignore" | null>(null);
  const options: { id: Action | "ignore"; label: string; note: string }[] = [
    { id: "accept", label: "청구를 인정하고 이행함", note: "즉시 판결 선고" },
    { id: "object", label: "이의를 신청함", note: "3라운드 공방" },
    { id: "countersue", label: "맞고소함", note: "3라운드 공방" },
    { id: "ignore", label: "답변하지 아니함", note: "기한 경과 시 궐석" },
  ];
  const submit = () => {
    if (pick === "ignore") onIgnore();
    else if (pick) onRespond(pick);
  };
  return (
    <div className="-mx-4 -mt-3">
      <div className="perforation h-2" aria-hidden />
      <div className="paper relative px-4 pt-2 pb-1 font-serif shadow-none">
        <div className="flex items-baseline justify-between">
          <p className="flex items-center gap-1.5 font-type text-[10.5px] text-black/45">
            <Scissors className="h-3 w-4" />[{FORM_NO.reply}] 회신서
          </p>
          <p className="font-type text-[12px]">
            회신 기한 <Countdown deadline={deadline} className="text-[17px] font-bold text-seal" />
          </p>
        </div>
        <div role="radiogroup" aria-label="회신 내용" className="mt-1 grid grid-cols-2 border-t border-l border-ink/60">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={pick === o.id}
              disabled={busy}
              onClick={() => setPick(o.id)}
              className={`flex min-h-14 items-start gap-2 border-r border-b border-ink/60 px-2 py-2 text-left disabled:opacity-40 ${pick === o.id ? "bg-ink-blue/[0.06]" : ""}`}
            >
              <CheckSquare checked={pick === o.id} className="mt-0.5" />
              <span className="leading-tight">
                <span className="block text-[13.5px] font-bold">{o.label}</span>
                <span className="font-type text-[10.5px] text-black/50">{o.note}</span>
              </span>
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-center text-sm text-seal">{error}</p>}
        <button type="button" disabled={!pick || busy} onClick={submit} className={`${btn.ink} mt-2 w-full`}>
          {pick === "ignore" ? "문서 덮기" : "회신 제출"}
        </button>
        <div className="flex justify-center gap-5 font-type text-[11.5px] text-black/50">
          <button type="button" className="min-h-10 underline" onClick={onDismiss}>
            사건 기각
          </button>
          <button type="button" className="min-h-10 underline" onClick={onReport}>
            신고
          </button>
        </div>
      </div>
    </div>
  );
}
