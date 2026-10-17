"use client";

import { LegalLinks } from "@/components/LegalLinks";
import { playCrumple, playSlide, playStamp } from "@/lib/client/sfx";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Desk } from "@/components/desk/Desk";
import { DropIn, SheetSwap, type SheetEnter, type SheetExit } from "@/components/desk/motion";
import { PostIt } from "@/components/desk/PostIt";
import { Printer } from "@/components/desk/Printer";
import { RedPen } from "@/components/desk/props";
import { SendSequence } from "@/components/desk/SendSequence";
import { btn, trayNote } from "@/components/desk/ui";
import { PaperDocument } from "@/components/PaperDocument";
import { api } from "@/lib/client/api";
import { LIMITS } from "@/lib/constants";
import { fillPlaceholders, formatDate } from "@/lib/document";
import type { Draft, Tone } from "@/lib/types";
import { IntakeForm, IntakeStub, type Input } from "./IntakeForm";

export type ResumeState = { caseId: string; caseNo: string; draft: Draft; regenLeft: number; input: Input };

type DraftRes = { caseId: string; caseNo?: string; draft: Draft; regenLeft: number; myLink?: string };

/** 프린터가 몇 줄은 찍고 나서 결과가 나오도록 최소 대기 */
const PRINT_MIN_MS = 1400;
const atLeast = <T,>(p: Promise<T>) => Promise.all([p, new Promise((r) => setTimeout(r, PRINT_MIN_MS))]).then(([v]) => v);

function todayKST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function NewCaseFlow({ initial, resume }: { initial: Pick<Input, "type" | "plaintiff_nick" | "defendant_nick">; resume: ResumeState | null }) {
  const router = useRouter();
  const [input, setInput] = useState<Input>(
    resume?.input ?? { ...initial, incident_date: todayKST(), situation: "", demand: "" },
  );
  const [caseId, setCaseId] = useState<string | null>(resume?.caseId ?? null);
  const [caseNo, setCaseNo] = useState<string>(resume?.caseNo ?? "");
  const [draft, setDraft] = useState<Draft | null>(resume?.draft ?? null);
  const [version, setVersion] = useState(0);
  const [regenLeft, setRegenLeft] = useState(resume?.regenLeft ?? LIMITS.maxRegen);
  const [busy, setBusy] = useState<null | "draft" | Tone | "save" | "send">(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [motionKind, setMotionKind] = useState<{ enter: SheetEnter; exit: SheetExit }>({ enter: "drop", exit: "fade" });
  const [sending, setSending] = useState<string | null>(null);

  const set = <K extends keyof Input>(k: K, v: Input[K]) => setInput((p) => ({ ...p, [k]: v }));
  const valid =
    input.plaintiff_nick.trim() && input.defendant_nick.trim() && input.situation.trim() && input.demand.trim() && input.incident_date;

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>) {
    setBusy(kind);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "일시 오류. 잠시 후 다시 시도할 것.");
    } finally {
      setBusy(null);
    }
  }

  const createDraft = () => {
    setMotionKind({ enter: "fade", exit: "fade" });
    playStamp();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return run("draft", async () => {
      const r = await atLeast(api<DraftRes>("/api/draft", { json: { input, tone: "기본" } }));
      setMotionKind({ enter: "print", exit: "fade" });
      setCaseId(r.caseId);
      setCaseNo(r.caseNo ?? "");
      setDraft(r.draft);
      setVersion((v) => v + 1);
    });
  };

  /** 더 킹받게: 구겨 버림 / 좀 순하게: 옆으로 밀어 둠 */
  const regen = (tone: Tone) => {
    setMotionKind({ enter: "fade", exit: tone === "더_킹받게" ? "crumple" : "aside" });
    if (tone === "더_킹받게") playCrumple();
    else playSlide();
    return run(tone, async () => {
      const r = await atLeast(api<DraftRes>("/api/draft", { json: { caseId, tone } }));
      setMotionKind({ enter: "print", exit: "fade" });
      setDraft(r.draft);
      setRegenLeft(r.regenLeft);
      setVersion((v) => v + 1);
    });
  };

  const save = () =>
    run("save", async () => {
      const r = await api<{ draft: Draft }>(`/api/cases/${caseId}/draft`, { method: "PATCH", json: { draft: editing } });
      setMotionKind({ enter: "fade", exit: "fade" });
      setDraft(r.draft);
      setEditing(null);
    });

  const send = () =>
    run("send", async () => {
      const r = await api<{ next: string }>(`/api/cases/${caseId}/send`, { json: {} });
      router.prefetch(r.next);
      setSending(r.next);
    });

  const afterSend = useCallback(() => sending && router.push(sending), [sending, router]);

  const printing = busy === "draft" || busy === "더_킹받게" || busy === "순하게";

  // ── 1. 접수서 작성
  if (!draft && !printing) {
    return (
      <Desk
        scene="intake"
        tray={
          <div className="space-y-2">
            {error && <p className="text-center font-type text-[13px] text-[#ff8a80]">{error}</p>}
            <button type="button" disabled={!valid || !!busy} onClick={createDraft} className={`${btn.seal} w-full`}>
              접수
            </button>
            <p className={`${trayNote} text-center`}>{valid ? "접수하면 통고서 초안이 바로 작성됨" : "원고·피고·경위·청구를 모두 기재할 것"}</p>
            <p className={`${trayNote} text-center text-[10.5px]`}>
              접수 시 <LegalLinks className="gap-1.5" />에 동의한 것으로 봄. 실명·연락처 기재 금지.
            </p>
          </div>
        }
      >
        <DropIn enter="fade">
          <IntakeForm input={input} set={set} today={todayKST()} />
        </DropIn>
      </Desk>
    );
  }

  // ── 2. 작성 중 / 미리보기 / 빨간 펜 교정
  const filled = (t: string) => fillPlaceholders(t, { incident_date: input.incident_date, sent_at: null, response_deadline_at: null });
  const swapKey = printing ? `printing-${version}` : editing ? `edit-${version}` : `doc-${version}`;

  const tray = printing ? (
    <p className={`${trayNote} py-3 text-center`}>통고서 작성 중. 잠시 대기.</p>
  ) : editing ? (
    <div className="space-y-2">
      {error && <p className="text-center font-type text-[13px] text-[#ff8a80]">{error}</p>}
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <button
          type="button"
          className={btn.line}
          onClick={() => {
            setMotionKind({ enter: "fade", exit: "fade" });
            setEditing(null);
          }}
        >
          정정 취소
        </button>
        <button type="button" className={btn.paper} disabled={!!busy} onClick={save}>
          {busy === "save" ? "저장 중" : "정정 완료"}
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      {error && <p className="text-center font-type text-[13px] text-[#ff8a80]">{error}</p>}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={`${btn.paper} px-1 text-[14.5px]`} disabled={!!busy || regenLeft <= 0} onClick={() => regen("더_킹받게")}>
          더 킹받게
        </button>
        <button type="button" className={`${btn.paper} px-1 text-[14.5px]`} disabled={!!busy || regenLeft <= 0} onClick={() => regen("순하게")}>
          좀 순하게
        </button>
        <button type="button" className={`${btn.line} px-1 text-[14.5px]`} disabled={!!busy} onClick={() => {
            setMotionKind({ enter: "fade", exit: "fade" });
            setEditing(structuredClone(draft!));
          }}>
          직접 수정
        </button>
      </div>
      <button type="button" className={`${btn.seal} w-full`} disabled={!!busy || !!sending} onClick={send}>
        {busy === "send" ? "발송 처리 중" : "이대로 발송"}
      </button>
      <p className={`${trayNote} text-center`}>톤 변경 잔여 {regenLeft}회 · 상대방에게는 위 문서가 그대로 송달됨</p>
    </div>
  );

  return (
    <Desk scene="intake" tray={sending ? null : tray}>
      <div className={`relative transition-opacity ${sending ? "opacity-0" : ""}`}>
        <IntakeStub input={input} caseNo={caseNo} />
        <div className="relative -mt-14">
          {editing && (
            <>
              <PostIt rotate={-3} className="absolute -top-9 left-2 z-20 text-[19px]">
                빨간 줄 = 정정 부분
              </PostIt>
              <RedPen className="pointer-events-none absolute -top-5 -right-10 z-20 w-56 rotate-[-28deg]" />
            </>
          )}
          <SheetSwap swapKey={swapKey} enter={motionKind.enter} exit={motionKind.exit}>
            {printing ? (
              <Printer
                label={busy === "draft" ? "통고서 작성 중" : "다시 작성 중"}
                head={["통 고 서", `사건번호  ${caseNo || "부여 중"}`, `수    신  ${input.defendant_nick} 귀하`, `발    신  ${input.plaintiff_nick}`]}
              />
            ) : (
              <PaperDocument
                caseNo={caseNo}
                toNick={input.defendant_nick}
                fromNick={input.plaintiff_nick}
                title={draft!.title}
                items={draft!.items.map(filled)}
                date={formatDate(new Date())}
                edit={editing ? { value: editing, original: draft!, onChange: setEditing } : undefined}
                className={editing ? "ring-1 ring-redpen/30" : ""}
              />
            )}
          </SheetSwap>
        </div>
      </div>
      <AnimatePresence>
        {sending && (
          <motion.div key="send" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SendSequence toNick={input.defendant_nick} fromNick={input.plaintiff_nick} onDone={afterSend} />
          </motion.div>
        )}
      </AnimatePresence>
    </Desk>
  );
}
