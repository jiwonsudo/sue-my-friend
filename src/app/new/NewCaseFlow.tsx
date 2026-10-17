"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PaperDocument } from "@/components/PaperDocument";
import { api } from "@/lib/client/api";
import { CASE_TYPES, LIMITS, type CaseType } from "@/lib/constants";
import { fillPlaceholders, formatDate } from "@/lib/document";
import type { Draft, Tone } from "@/lib/types";

type Input = {
  type: CaseType;
  plaintiff_nick: string;
  defendant_nick: string;
  incident_date: string;
  situation: string;
  demand: string;
};

export type ResumeState = { caseId: string; caseNo: string; draft: Draft; regenLeft: number; input: Input };

type DraftRes = { caseId: string; caseNo?: string; draft: Draft; regenLeft: number; myLink?: string };

function todayKST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

const PLACEHOLDER: Record<CaseType, { situation: string; demand: string }> = {
  bet: { situation: "롤 내기에서 지면 치킨 사기로 했는데 3주째 '이번 주말에'라고만 함", demand: "뿌링클 1마리" },
  ghosting: { situation: "생일 축하 메시지 읽고 4일째 답장 없음. 인스타 스토리는 올림", demand: "진심 어린 답장 3줄 이상" },
  noshow: { situation: "강남역 7시 약속, 6시 50분에 '나 오늘 좀 힘들 듯'", demand: "다음 밥값 전액" },
  borrowed: { situation: "편의점에서 3,500원 빌려가고 '내일 줄게' 한 지 두 달", demand: "3,500원 + 바나나우유 1개" },
  custom: { situation: "무슨 일이 있었는지 최대한 구체적으로", demand: "원하는 것" },
};

export function NewCaseFlow({ initial, resume }: { initial: Pick<Input, "type" | "plaintiff_nick" | "defendant_nick">; resume: ResumeState | null }) {
  const router = useRouter();
  const [input, setInput] = useState<Input>(
    resume?.input ?? { ...initial, incident_date: todayKST(), situation: "", demand: "" },
  );
  const [caseId, setCaseId] = useState<string | null>(resume?.caseId ?? null);
  const [caseNo, setCaseNo] = useState<string>(resume?.caseNo ?? "");
  const [draft, setDraft] = useState<Draft | null>(resume?.draft ?? null);
  const [regenLeft, setRegenLeft] = useState(resume?.regenLeft ?? LIMITS.maxRegen);
  const [busy, setBusy] = useState<null | "draft" | Tone | "save" | "send">(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  const set = <K extends keyof Input>(k: K, v: Input[K]) => setInput((p) => ({ ...p, [k]: v }));
  const valid =
    input.plaintiff_nick.trim() && input.defendant_nick.trim() && input.situation.trim() && input.demand.trim() && input.incident_date;

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>) {
    setBusy(kind);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(null);
    }
  }

  const createDraft = () =>
    run("draft", async () => {
      const r = await api<DraftRes>("/api/draft", { json: { input, tone: "기본" } });
      setCaseId(r.caseId);
      setCaseNo(r.caseNo ?? "");
      setDraft(r.draft);
      setRegenLeft(r.regenLeft);
      window.scrollTo({ top: 0 });
    });

  const regen = (tone: Tone) =>
    run(tone, async () => {
      const r = await api<DraftRes>("/api/draft", { json: { caseId, tone } });
      setDraft(r.draft);
      setRegenLeft(r.regenLeft);
    });

  const save = () =>
    run("save", async () => {
      const r = await api<{ draft: Draft }>(`/api/cases/${caseId}/draft`, { method: "PATCH", json: { draft: editing } });
      setDraft(r.draft);
      setEditing(null);
    });

  const send = () =>
    run("send", async () => {
      const r = await api<{ next: string }>(`/api/cases/${caseId}/send`, { json: {} });
      router.push(r.next);
    });

  // ── 1. 입력 폼
  if (!draft) {
    const ph = PLACEHOLDER[input.type];
    return (
      <main className="mx-auto max-w-md px-5 pt-6 pb-32">
        <h1 className="mb-6 text-2xl font-extrabold">어떤 원한인가요?</h1>
        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-semibold">사건 유형</legend>
          <div className="flex flex-wrap gap-2">
            {CASE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set("type", t.id)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                  input.type === t.id ? "border-ink bg-ink text-white" : "border-black/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Field label="내 닉네임">
            <input className={inputCls} maxLength={LIMITS.nick} value={input.plaintiff_nick} onChange={(e) => set("plaintiff_nick", e.target.value)} placeholder="지원" />
          </Field>
          <Field label="상대 닉네임">
            <input className={inputCls} maxLength={LIMITS.nick} value={input.defendant_nick} onChange={(e) => set("defendant_nick", e.target.value)} placeholder="민수" />
          </Field>
        </div>
        <Field label="사건일" className="mb-5">
          <input type="date" className={inputCls} max={todayKST()} value={input.incident_date} onChange={(e) => set("incident_date", e.target.value)} />
        </Field>
        <Field label="무슨 일이 있었나요" hint={`${input.situation.length}/${LIMITS.situation}`} className="mb-5">
          <textarea
            className={`${inputCls} min-h-36 resize-none py-3 leading-relaxed`}
            maxLength={LIMITS.situation}
            value={input.situation}
            onChange={(e) => set("situation", e.target.value)}
            placeholder={ph.situation}
          />
        </Field>
        <Field label="원하는 것" hint={`${input.demand.length}/${LIMITS.demand}`}>
          <input className={inputCls} maxLength={LIMITS.demand} value={input.demand} onChange={(e) => set("demand", e.target.value)} placeholder={ph.demand} />
        </Field>
        {error && <p className="mt-4 text-sm text-seal">{error}</p>}
        <BottomBar>
          <button type="button" disabled={!valid || !!busy} onClick={createDraft} className={`${primaryCls} w-full`}>
            {busy === "draft" ? "법률 문체로 옮기는 중…" : "초안 쓰기"}
          </button>
        </BottomBar>
      </main>
    );
  }

  // ── 2. 미리보기 / 직접 수정
  const filled = (t: string) => fillPlaceholders(t, { incident_date: input.incident_date, sent_at: null, response_deadline_at: null });
  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-48">
      <p className="mb-3 text-center text-xs text-muted">미리보기 · 상대에게는 이렇게 보여요</p>
      <AnimatePresence mode="wait">
        <motion.div key={JSON.stringify(draft) + (editing ? "e" : "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {editing ? (
            <div className="paper space-y-3 rounded-[3px] p-5 font-serif">
              <p className="font-sans text-xs text-muted">{"{{사건일}} {{경과기간}} {{답변기한}}은 발송할 때 자동으로 채워져요."}</p>
              <input className={`${inputCls} bg-white font-bold`} maxLength={LIMITS.title} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              {editing.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="pt-3 text-sm">{i + 1}.</span>
                  <textarea
                    className={`${inputCls} min-h-24 flex-1 resize-none bg-white py-2 text-[14px] leading-relaxed`}
                    maxLength={LIMITS.item}
                    value={item}
                    onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, j) => (j === i ? e.target.value : x)) })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <PaperDocument
              caseNo={caseNo}
              toNick={input.defendant_nick}
              fromNick={input.plaintiff_nick}
              title={draft.title}
              items={draft.items.map(filled)}
              date={formatDate(new Date())}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {error && <p className="mt-4 text-center text-sm text-seal">{error}</p>}

      <BottomBar>
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={secondaryCls} onClick={() => setEditing(null)}>
              취소
            </button>
            <button type="button" className={primaryCls} disabled={!!busy} onClick={save}>
              {busy === "save" ? "저장 중…" : "저장"}
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            <button type="button" className={`${primaryCls} w-full`} disabled={!!busy} onClick={send}>
              {busy === "send" ? "발송 중…" : "이대로 발송"}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" className={secondaryCls} disabled={!!busy || regenLeft <= 0} onClick={() => regen("더_킹받게")}>
                {busy === "더_킹받게" ? "…" : "더 킹받게"}
              </button>
              <button type="button" className={secondaryCls} disabled={!!busy || regenLeft <= 0} onClick={() => regen("순하게")}>
                {busy === "순하게" ? "…" : "좀 순하게"}
              </button>
              <button type="button" className={secondaryCls} disabled={!!busy} onClick={() => setEditing(structuredClone(draft))}>
                직접 수정
              </button>
            </div>
            <p className="text-center text-[11px] text-muted">톤 바꾸기 {regenLeft}번 남음</p>
          </div>
        )}
      </BottomBar>
    </main>
  );
}

const inputCls =
  "w-full min-h-12 rounded-xl border border-black/10 px-3.5 text-[16px] outline-none focus:border-ink placeholder:text-black/30";
const primaryCls =
  "min-h-14 rounded-2xl bg-seal px-4 text-[17px] font-bold text-white disabled:opacity-40 active:scale-[0.99] transition";
const secondaryCls =
  "min-h-12 rounded-xl border border-black/15 bg-white px-2 text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition";

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex justify-between text-sm font-semibold">
        {label}
        {hint && <span className="font-normal text-muted tabular-nums">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}
