"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefendantAvatar, JudgeAvatar, PlaintiffAvatar } from "@/components/Avatars";
import { Countdown } from "@/components/Countdown";
import { CutIn } from "@/components/CutIn";
import { Header } from "@/components/Header";
import { adsAvailable, RewardedAd } from "@/components/RewardedAd";
import { ShareButtons } from "@/components/ShareButtons";
import { Typewriter } from "@/components/Typewriter";
import { api } from "@/lib/client/api";
import { isMuted, setMuted } from "@/lib/client/sfx";
import { CUTIN_LINES, DEFENSE_CARDS, LIMITS } from "@/lib/constants";
import { LAW_BY_ID, lawLabel, type LawyerSuggestion } from "@/lib/laws";
import { KIND_LABEL, rebuttalTarget, ROLE_LABEL } from "@/lib/trial";
import type { PublicEvidence, Role, StatementRow, TrialView } from "@/lib/types";

const POLL_MS = 5000;

export function TrialClient({
  initial,
  trialUrl,
}: {
  initial: TrialView;
  /** 상대에게 보낼 공방 주소. 열면 원고·피고 중 자리를 고른다 */
  trialUrl: string;
}) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const me = view.me as Role;
  const [cutIn, setCutIn] = useState<{ line: string; by: string } | null>(null);
  const [muted, setMutedState] = useState(false);
  const [zoom, setZoom] = useState<PublicEvidence | null>(null);
  // 내 진술을 낸 직후에는 상대에게 알릴 공유 버튼을 펼쳐 둔다
  const [showNotify, setShowNotify] = useState(false);


  const logEnd = useRef<HTMLDivElement>(null);

  const nick = useCallback((r: Role) => (r === "plaintiff" ? view.plaintiffNick : view.defendantNick), [view]);

  const refresh = useCallback(async () => {
    try {
      const v = await api<TrialView>(`/api/cases/${view.caseId}/trial?as=${me}`);
      setView(v);
      if (v.status === "judged" || v.status === "executed") router.push(`/v/${v.caseId}?as=${me}`);
    } catch {}
  }, [view.caseId, me, router]);


  useEffect(() => {
    setMutedState(isMuted());
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // 상대 반박이 새로 올라오면 컷인
  useEffect(() => {
    const key = `smf_seen_${view.caseId}_${me}`;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {}
    const fresh = view.statements.filter((s) => s.kind === "rebuttal" && s.role !== me && !s.forfeited && !seen.includes(s.id));
    if (fresh.length) {
      const last = fresh.at(-1)!;
      const line = last.evidence_id ? CUTIN_LINES[1] : CUTIN_LINES[Math.floor(Math.random() * CUTIN_LINES.length)];
      setCutIn({ line, by: `${ROLE_LABEL[last.role]} ${nick(last.role)}` });
      try {
        localStorage.setItem(key, JSON.stringify([...seen, ...fresh.map((s) => s.id)]));
      } catch {}
    }
  }, [view.statements, view.caseId, me, nick]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [view.statements.length]);

  const latest = [...view.statements].reverse().find((s) => !s.forfeited);
  const judgeLine = useMemo(() => {
    if (view.status === "voting") return "공방을 종결합니다. 곧 판결을 선고하겠습니다.";
    const c = view.current;
    if (!c) return "";
    const side = `${ROLE_LABEL[c.role]} 측 ${nick(c.role)}`;
    const forfeited = view.statements.at(-1)?.forfeited ? "직전 진술은 기한 경과로 포기 처리되었습니다. " : "";
    if (c.kind === "testimony") return `${forfeited}공판을 시작합니다. ${side}, 한 문장으로 증언하십시오.`;
    if (c.kind === "rebuttal") return `${forfeited}${side}, 한 문장으로 반박하십시오.`;
    return `${forfeited}최후진술입니다. ${side}, 한 문장으로 말씀하십시오.`;
  }, [view, nick]);

  // 마지막 진술을 먼저 읽어 주고, 다 읽으면 재판장이 다음 차례를 부른다
  const [judgeTurn, setJudgeTurn] = useState(!latest);
  const latestId = latest?.id;
  const latestText = latest?.sentences.join(" ") ?? "";
  useEffect(() => {
    if (!latestId || view.status !== "trial") {
      setJudgeTurn(true);
      return;
    }
    setJudgeTurn(false);
    const t = setTimeout(() => setJudgeTurn(true), [...latestText].length * 38 + 1800);
    return () => clearTimeout(t);
    // 진술이 새로 올라왔을 때만 (5초마다 오는 폴링 응답으로는 다시 시작하지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId, view.status]);

  const speaker: Role | "judge" = judgeTurn || !latest ? "judge" : latest.role;
  const dialogText = speaker === "judge" ? judgeLine : latestText;
  const myTurn = view.status === "trial" && view.current?.role === me;
  const evidenceById = useMemo(() => new Map(view.evidence.map((e) => [e.id, e])), [view.evidence]);

  return (
    <div className="court-bg min-h-dvh text-white">
      <Header

        right={
          <div className="flex items-center gap-1">
            <Link href="?" onClick={() => setTimeout(() => location.reload(), 50)} className="min-h-11 px-2 py-3 font-type text-[11px] text-white/50">
              자리 바꾸기
            </Link>
            <button
              type="button"
              aria-label={muted ? "소리 켜기" : "소리 끄기"}
              aria-pressed={!muted}
              className="grid min-h-11 min-w-11 place-items-center text-white/70"
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
            >
              <SpeakerIcon muted={muted} />
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-md px-4 pb-[22rem]">
        <p className="pt-3 font-type text-[11px] text-white/40">
          {view.caseNo} <span className="text-white/25">|</span> {view.title}
        </p>

        {/* 법정: 높은 법대 위 재판장, 아래 양쪽 진술대 */}
        <div className="relative mt-3">
          {/* 재판장석 */}
          <div className="relative mx-auto flex w-[72%] flex-col items-center">
            <Spot on={speaker === "judge"} />
            <div className="court-chair absolute top-0 h-[104px] w-[92px] rounded-t-[46px]" />
            <motion.div className="relative z-10 pt-4" animate={{ scale: speaker === "judge" ? 1.05 : 1 }}>
              <JudgeAvatar size={84} className="text-[#0b0b0d] drop-shadow-[0_0_1px_rgb(255_230_190/0.5)]" />
            </motion.div>
            <div className="court-bench relative z-20 -mt-6 flex h-12 w-full items-center justify-center">
              <Plate>재판장</Plate>
            </div>
          </div>
          {/* 진술대 */}
          <div className="-mt-1 grid grid-cols-2 gap-12 px-1">
            <Stand label="원고" name={view.plaintiffNick} active={speaker === "plaintiff"} me={me === "plaintiff"}>
              <PlaintiffAvatar size={86} />
            </Stand>
            <Stand label="피고" name={view.defendantNick} active={speaker === "defendant"} me={me === "defendant"} flip>
              <DefendantAvatar size={86} />
            </Stand>
          </div>
        </div>

        {/* 대사창 */}
        <div className="court-dialog mt-4 min-h-28 p-4">
          <p className="mb-1 font-type text-[12px] font-bold text-brass">
            {speaker === "judge" ? "재판장" : `${ROLE_LABEL[speaker]} ${nick(speaker)}`}
          </p>
          <p className="text-[16px] leading-relaxed">
            <Typewriter key={dialogText} text={dialogText} sound={!muted} />
          </p>
        </div>

        {/* 기록 */}
        <section className="mt-7">
          <p className="mb-1 flex items-baseline justify-between border-b border-white/25 pb-1.5 font-serif text-[15px] font-bold tracking-[0.3em] text-white/80">
            공판조서 <span className="font-type text-[11px] font-normal tracking-normal text-white/40">{view.statements.length}/6</span>
          </p>
          {view.statements.length === 0 && <p className="py-3 font-type text-[13px] text-white/40">진술 없음.</p>}
          {view.statements.map((s) => (
            <StatementCard key={s.id} s={s} all={view.statements} nick={nick} evidence={evidenceById} onZoom={setZoom} />
          ))}
          <div ref={logEnd} />
        </section>
      </div>

      {/* 하단 액션 */}
      <div className="fixed inset-x-0 bottom-0 z-20 max-h-[64dvh] overflow-y-auto border-t border-white/15 bg-court px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          {view.status === "voting" ? (
            <p className="py-3 text-center font-type text-[13px] text-white/70">판결 선고 대기 중</p>
          ) : myTurn && view.current ? (
            <Compose
              // 차례가 바뀌면 입력·선택한 조항을 새로 시작
              key={`${view.current.round}-${view.current.kind}`}
              view={view}
              onDone={() => {
                setShowNotify(true);
                refresh();
              }}
            />
          ) : view.current ? (
            <div className="pb-1">
              <p className="py-2 text-center font-type text-[13px] text-white/70">
                {nick(view.current.role)} {KIND_LABEL[view.current.kind]} 대기 · 남은 시간{" "}
                <Countdown deadline={view.current.deadline} format="hm" className="font-bold text-white" />
              </p>
              <button
                type="button"
                onClick={() => setShowNotify((v) => !v)}
                aria-expanded={showNotify}
                className="min-h-12 w-full bg-paper font-serif text-[15px] font-bold text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)]"
              >
                {nick(view.current.role)}에게 차례 알리기
              </button>
              {showNotify && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-center font-type text-[11.5px] text-white/55">
                    링크를 받은 쪽은 바로 공방 화면으로 들어옴. 기한 안에 진술하지 않으면 진술 포기로 처리됨.
                  </p>
                  <ShareButtons
                    compact
                    url={trialUrl}
                    title={`[${view.caseNo}] ${nick(view.current.role)}님 ${KIND_LABEL[view.current.kind]} 차례입니다`}
                    text={`${view.title} — ${ROLE_LABEL[me]} ${nick(me)}의 진술이 제출됨. 기한 6시간.`}
                    buttonLabel="공방 입장"
                  />
                </div>
              )}
            </div>
          ) : null}
          {view.status === "trial" && (
            <p className="mt-2 border-t border-dashed border-white/15 pt-2 text-center font-type text-[11px] leading-relaxed text-white/50">
              피고 한마디, 원고 한마디가 끝나면 AI 재판장이 바로 선고함.
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>{cutIn && <CutIn key="cutin" line={cutIn.line} by={cutIn.by} onDone={() => setCutIn(null)} />}</AnimatePresence>
      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
          >
            <div className="text-center">
              {zoom.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={zoom.url} alt={zoom.label} className="max-h-[75dvh] max-w-full rounded object-contain" />
              )}
              <p className="mt-3 font-serif text-lg font-bold">{zoom.label}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 화자에게 떨어지는 조명 */
function Spot({ on }: { on: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-x-6 -top-6 bottom-0 bg-[radial-gradient(ellipse_at_50%_35%,rgb(255_214_150/0.35),transparent_65%)]"
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    />
  );
}

/** 놋쇠 명패 */
function Plate({ children }: { children: React.ReactNode }) {
  return (
    <span className="brass-plate inline-block px-2.5 py-0.5 font-serif text-[11.5px] font-bold tracking-[0.2em] whitespace-nowrap text-[#2a1a0c]">
      {children}
    </span>
  );
}

/** 원고·피고 진술대 */
function Stand({
  label,
  name,
  active,
  me,
  flip,
  children,
}: {
  label: string;
  name: string;
  active: boolean;
  me?: boolean;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <Spot on={active} />
      <motion.div
        className={`relative z-10 ${flip ? "-scale-x-100" : ""} ${active ? "text-[#f1e4cc]" : "text-[#b9a68a]"}`}
        animate={{ y: active ? -3 : 0, opacity: active ? 1 : 0.75 }}
      >
        {children}
      </motion.div>
      <div className="court-stand relative z-20 -mt-7 flex h-11 w-full items-center justify-center px-1">
        <Plate>
          {label} {name}
          {me && <span className="ml-1 font-type text-[10px] tracking-normal text-[#5a3a14]">(나)</span>}
        </Plate>
      </div>
    </div>
  );
}

function StatementCard({
  s,
  all,
  nick,
  evidence,
  onZoom,
}: {
  s: StatementRow;
  all: StatementRow[];
  nick: (r: Role) => string;
  evidence: Map<string, PublicEvidence>;
  onZoom: (e: PublicEvidence) => void;
}) {
  const target = s.target_statement_id ? all.find((x) => x.id === s.target_statement_id) : null;
  const card = DEFENSE_CARDS.find((c) => c.id === s.card_id);
  const ev = s.evidence_id ? evidence.get(s.evidence_id) : null;
  return (
    <div className={`grid grid-cols-[3.2rem_1fr] gap-x-3 border-b border-white/10 py-3 ${s.role === "defendant" ? "bg-seal/[0.07]" : ""}`}>
      <p className="pt-0.5 pl-1 font-type text-[11px] leading-tight text-white/45">
        <span className={s.role === "plaintiff" ? "text-white/80" : "text-[#ff8f8f]"}>{ROLE_LABEL[s.role]}</span>
        <br />
        {KIND_LABEL[s.kind]}
      </p>
      <div>
      <p className="mb-1 font-type text-[11px] text-white/40">{nick(s.role)}</p>
      {s.forfeited ? (
        <p className="font-type text-[13px] text-white/40">진술 포기 (기한 초과)</p>
      ) : (
        <>
          {target && s.target_sentence_idx != null && (
            <p className="mb-1.5 border-l-2 border-seal pl-2 text-[13px] text-white/60">「{target.sentences[s.target_sentence_idx]}」</p>
          )}
          <ol className="space-y-1 text-[15px] leading-relaxed">
            {s.sentences.map((t, i) => (
              <li key={i}>{s.sentences.length > 1 ? `${i + 1}. ${t}` : t}</li>
            ))}
          </ol>
          {s.law_id && LAW_BY_ID.get(s.law_id) && (
            <p className="mt-2 inline-block border border-brass/60 bg-brass/10 px-2 py-0.5 font-type text-[11px] text-[#f0d896]">
              변호인 인용 · {lawLabel(LAW_BY_ID.get(s.law_id)!)}
            </p>
          )}
          {(card || ev) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {card && <span className="border border-amber-300/60 px-2 py-1 font-type text-[11.5px] text-amber-200">항변 {card.name}</span>}
              {ev && (
                <button type="button" onClick={() => onZoom(ev)} className="flex min-h-9 items-center gap-1.5 border border-white/30 px-2 py-1 font-type text-[11.5px]">
                  {ev.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.url} alt="" className="h-6 w-6 rounded object-cover" />
                  )}
                  {ev.label}
                </button>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function Compose({ view, onDone }: { view: TrialView; onDone: () => void }) {
  const slot = view.current!;
  const [lines, setLines] = useState<string[]>([""]);
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [lawId, setLawId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = slot.kind === "rebuttal" ? rebuttalTarget(view.statements, slot.round) : null;
  const needsTarget = !!target && !target.forfeited;
  const filled = lines.map((l) => l.trim()).filter(Boolean);
  // 반박할 문장이 하나뿐이면 고를 필요 없이 그 문장
  const chosen = targetIdx ?? (target && target.sentences.length === 1 ? 0 : null);
  const missing =
    needsTarget && chosen == null ? "위에서 반박할 문장을 먼저 고를 것" : filled.length === 0 ? "한 문장을 쓸 것" : null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/cases/${view.caseId}/statements?as=${slot.role}`, {
        json: { sentences: filled, targetSentenceIdx: chosen, lawId },
      });
      setLines([""]);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출 실패");
    } finally {
      setBusy(false);
    }
  };

  const label = { testimony: "증언", rebuttal: "반박", final: "최후진술" }[slot.kind];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[15px] font-bold">
          내 차례 · {label}
        </p>
        <p className="font-type text-[12px] text-white/60">
          남은 시간 <Countdown deadline={slot.deadline} format="hm" />
        </p>
      </div>

      {needsTarget && target && target.sentences.length === 1 && (
        <p className="border-l-2 border-seal pl-2 text-[14px] text-white/70">
          <span className="mb-0.5 block font-type text-[11px] text-white/45">상대 증언</span>「{target.sentences[0]}」
        </p>
      )}
      {/* 예전 사건: 증언이 여러 문장이면 하나를 골라 반박 */}
      {needsTarget && target && target.sentences.length > 1 && (
        <div>
          <p className="mb-1.5 font-type text-[12px] text-white/60">
            ① 반박할 문장 하나를 눌러 고를 것
          </p>
          <div role="radiogroup" aria-label="반박할 문장" className="space-y-1.5">
            {target.sentences.map((t, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={chosen === i}
                onClick={() => setTargetIdx(i)}
                className={`flex min-h-11 w-full items-start gap-2.5 border px-3 py-2 text-left text-[14px] ${
                  chosen === i ? "border-seal bg-seal/25" : "border-white/15 bg-white/5"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.5px] ${chosen === i ? "border-seal" : "border-white/40"}`}
                >
                  {chosen === i && <span className="h-2 w-2 rounded-full bg-seal" />}
                </span>
                {t}
              </button>
            ))}
          </div>
          <p className="mt-3 font-type text-[12px] text-white/60">② 반박 한 문장</p>
        </div>
      )}

      {view.lawyer && (
        <LawyerPanel
          caseId={view.caseId}
          as={slot.role}
          initial={view.lawyer}
          chosenLawId={lawId}
          onPick={(sg) => {
            setLawId(sg.lawId);
            if (sg.targetIdx != null) setTargetIdx(sg.targetIdx);
            setLines([sg.sentence]);
          }}
        />
      )}
      {lawId && LAW_BY_ID.get(lawId) && (
        <p className="flex items-center justify-between gap-2 border border-brass/60 bg-brass/10 px-2.5 py-1.5 font-type text-[11.5px] text-[#f0d896]">
          <span>변호인 인용 · {lawLabel(LAW_BY_ID.get(lawId)!)}</span>
          <button type="button" className="min-h-8 px-1 text-white/50 underline" onClick={() => setLawId(null)}>
            빼기
          </button>
        </p>
      )}
      {lines.map((l, i) => (
        <input
          key={i}
          value={l}
          maxLength={LIMITS.sentence}
          onChange={(e) => setLines(lines.map((x, j) => (j === i ? e.target.value : x)))}
          placeholder={slot.kind === "rebuttal" ? "반박 한 문장" : "증언 한 문장"}
          className="min-h-12 w-full border-b border-white/30 bg-transparent px-1 text-[16px] outline-none placeholder:text-white/30 focus:border-white/80"
        />
      ))}

      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="button"
        disabled={busy || !!missing}
        onClick={submit}
        className="min-h-14 w-full bg-seal font-serif text-[18px] font-black tracking-[0.06em] shadow-[inset_0_-3px_0_rgb(0_0_0/0.25)] disabled:opacity-40"
      >
        {busy ? "제출 중" : slot.kind === "rebuttal" ? "이의 있음!" : `${label} 제출`}
      </button>
      {missing && !busy && <p className="-mt-1 text-center font-type text-[12px] text-[#ffb3a8]">{missing}</p>}
    </div>
  );
}

/**
 * 광고 보상형 AI 변호인: 내 차례마다 1번. 광고를 보면 법 조항을 인용한 이의 2~3개를 추천받고 하나를 골라 제출한다.
 * 고른 이의는 재판장이 가산점을 준다.
 */
function LawyerPanel({
  caseId,
  as,
  initial,
  chosenLawId,
  onPick,
}: {
  caseId: string;
  as: Role;
  initial: NonNullable<TrialView["lawyer"]>;
  chosenLawId: string | null;
  onPick: (s: LawyerSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<LawyerSuggestion[] | null>(initial.suggestions);
  const [phase, setPhase] = useState<"idle" | "ad" | "working">("idle");
  const [error, setError] = useState<string | null>(null);
  const ticket = useRef<{ value: string; at: number; minMs: number } | null>(null);

  if (initial.used && !suggestions) return null;
  if (!suggestions && !adsAvailable) return null;

  const start = async () => {
    setError(null);
    try {
      const r = await api<{ ticket: string; minAdMs: number }>(`/api/cases/${caseId}/lawyer?as=${as}`, { json: { action: "ticket" } });
      ticket.current = { value: r.ticket, at: Date.now(), minMs: r.minAdMs };
      setPhase("ad");
    } catch (e) {
      setError(e instanceof Error ? e.message : "광고를 불러오지 못했습니다.");
    }
  };

  const grant = async () => {
    const t = ticket.current;
    if (!t) return;
    setPhase("working");
    // 광고가 너무 빨리 끝났으면(광고 없음 등) 서버 최소 시간까지 기다린다
    const wait = t.at + t.minMs + 300 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      const r = await api<{ suggestions: LawyerSuggestion[] }>(`/api/cases/${caseId}/lawyer?as=${as}`, { json: { action: "grant", ticket: t.value } });
      setSuggestions(r.suggestions);
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "선임 실패");
      setPhase("idle");
    }
  };

  return (
    <div className="border border-brass/40 bg-[#2a1a0e] p-3">
      {!suggestions ? (
        <>
          <p className="font-serif text-[14px] font-bold text-[#f0d896]">변호인 선임</p>
          <p className="mt-1 font-type text-[11.5px] leading-relaxed text-white/60">
            광고를 끝까지 보면 AI 변호인이 법 조항을 인용한 이의를 써 줌. 변호인을 쓴 진술은 재판장이 가산점을 줌. 이번 차례에 1번.
          </p>
          <button
            type="button"
            disabled={phase !== "idle"}
            onClick={start}
            className="brass-plate mt-2.5 min-h-12 w-full font-serif text-[15px] font-bold text-[#2a1a0c] disabled:opacity-50"
          >
            {phase === "working" ? "변호인이 검토 중" : "광고 보고 변호인 선임"}
          </button>
        </>
      ) : (
        <>
          <p className="font-serif text-[14px] font-bold text-[#f0d896]">변호인 의견 · 하나를 골라 제출</p>
          <div role="radiogroup" aria-label="변호인 추천 이의" className="mt-2 space-y-1.5">
            {suggestions.map((sg) => {
              const law = LAW_BY_ID.get(sg.lawId);
              const on = chosenLawId === sg.lawId;
              return (
                <button
                  key={sg.lawId}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPick(sg)}
                  className={`block min-h-11 w-full border px-3 py-2 text-left ${on ? "border-brass bg-brass/15" : "border-white/15 bg-white/5"}`}
                >
                  {law && <span className="block font-type text-[11px] text-[#f0d896]">{lawLabel(law)}</span>}
                  <span className="mt-0.5 block text-[14px] leading-snug">{sg.sentence}</span>
                  {law && <span className="mt-1 block font-type text-[10.5px] leading-snug text-white/45">요지: {law.gist}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 font-type text-[10px] text-white/40">게임용 인용이며 실제 법률 판단이 아님. 고른 뒤 문장은 고쳐 써도 됨.</p>
        </>
      )}
      {error && <p className="mt-2 text-center text-[12.5px] text-red-300">{error}</p>}
      {phase === "ad" && (
        <RewardedAd
          onReward={() => grant()}
          onCancel={() => {
            setPhase("idle");
            setError("광고를 끝까지 봐야 선임됨.");
          }}
        />
      )}
    </div>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" strokeLinecap="round" />
      ) : (
        <path d="M15.5 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M18 6.5c1.8 1.4 2.8 3.3 2.8 5.5s-1 4.1-2.8 5.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
