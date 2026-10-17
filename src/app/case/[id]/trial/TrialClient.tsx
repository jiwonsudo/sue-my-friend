"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefendantAvatar, JudgeAvatar, PlaintiffAvatar } from "@/components/Avatars";
import { Countdown } from "@/components/Countdown";
import { CutIn } from "@/components/CutIn";
import { Header } from "@/components/Header";
import { ShareButtons } from "@/components/ShareButtons";
import { VoteBars } from "@/components/VoteBars";
import { Typewriter } from "@/components/Typewriter";
import { api } from "@/lib/client/api";
import { isMuted, setMuted } from "@/lib/client/sfx";
import { CARD_NOTICE, CUTIN_LINES, DEFENSE_CARDS, LIMITS, type CardId } from "@/lib/constants";
import { KIND_LABEL, otherRole, rebuttalTarget, ROLE_LABEL } from "@/lib/trial";
import type { PublicEvidence, Role, StatementRow, TrialView } from "@/lib/types";

const POLL_MS = 5000;

export function TrialClient({
  initial,
  juryLink,
  juryImage,
  canSwitch,
}: {
  initial: TrialView;
  juryLink: string | null;
  juryImage: string | null;
  canSwitch: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const me = view.me as Role;
  const [cutIn, setCutIn] = useState<{ line: string; by: string } | null>(null);
  const [muted, setMutedState] = useState(false);
  const [zoom, setZoom] = useState<PublicEvidence | null>(null);
  const [showJury, setShowJury] = useState(false);
  const [jury, setJury] = useState<{ link: string; image: string } | null>(juryLink && juryImage ? { link: juryLink, image: juryImage } : null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);


  const logEnd = useRef<HTMLDivElement>(null);

  const nick = useCallback((r: Role) => (r === "plaintiff" ? view.plaintiffNick : view.defendantNick), [view]);

  const refresh = useCallback(async () => {
    try {
      const v = await api<TrialView>(`/api/cases/${view.caseId}/trial?as=${me}`);
      setView(v);
      if (v.status === "judged" || v.status === "executed") router.push(`/v/${v.caseId}`);
    } catch {}
  }, [view.caseId, me, router]);

  const invite = async () => {
    setInviting(true);
    setInviteError(null);
    try {
      const r = await api<{ jury: string }>(`/api/cases/${view.caseId}/jury`, { json: {} });
      setJury({ link: r.jury, image: `${new URL(r.jury).origin}/api/og/jury/${r.jury.split("/j/")[1]}` });
      setShowJury(true);
      refresh();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "초대 실패");
    } finally {
      setInviting(false);
    }
  };
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
  const speaker: Role | "judge" = latest && view.status === "trial" ? latest.role : "judge";
  const judgeLine = useMemo(() => {
    if (view.status === "voting") return "공방을 종결합니다. 이제 배심원의 판단을 구하겠습니다.";
    const c = view.current;
    if (!c) return "";
    const who = `${ROLE_LABEL[c.role]} ${nick(c.role)}`;
    if (c.kind === "testimony") return `${c.round}라운드. ${who}은(는) 증언하십시오.`;
    if (c.kind === "rebuttal") return `${who}은(는) 상대 증언 중 한 문장을 골라 반박하십시오.`;
    return `최후진술입니다. ${who}, 한 문장으로 말씀하십시오.`;
  }, [view, nick]);

  const dialogText = latest && view.status === "trial" ? latest.sentences.join(" ") : judgeLine;
  const myTurn = view.status === "trial" && view.current?.role === me;
  const evidenceById = useMemo(() => new Map(view.evidence.map((e) => [e.id, e])), [view.evidence]);

  return (
    <div className="court-bg min-h-dvh text-white">
      <Header

        right={
          <div className="flex items-center gap-1">
            {canSwitch && (
              <Link href={`?as=${otherRole(me)}`} onClick={() => setTimeout(() => location.reload(), 50)} className="min-h-11 px-2 py-3 font-type text-[11px] text-white/50">
                {ROLE_LABEL[otherRole(me)]} 시점
              </Link>
            )}
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

        {/* 무대 */}
        <div className="mt-3 grid grid-cols-3 items-end gap-2 text-center">
          <Figure label="원고" name={view.plaintiffNick} active={speaker === "plaintiff"} me={me === "plaintiff"}>
            <PlaintiffAvatar size={76} />
          </Figure>
          <Figure label="재판장" name="" active={speaker === "judge"} raised>
            <JudgeAvatar size={84} />
          </Figure>
          <Figure label="피고" name={view.defendantNick} active={speaker === "defendant"} me={me === "defendant"} flip>
            <DefendantAvatar size={76} />
          </Figure>
        </div>

        {/* 대사창 */}
        <div className="mt-4 min-h-28 border-2 border-white/80 bg-black/70 p-4 shadow-[0_0_0_4px_rgba(0,0,0,0.6)]">
          <p className="mb-1 font-type text-[12px] font-bold text-seal">
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
            <VotingPanel view={view} />
          ) : myTurn && view.current ? (
            <Compose view={view} me={me} onDone={refresh} />
          ) : view.current ? (
            <p className="py-3 text-center font-type text-[13px] text-white/70">
              상대 {KIND_LABEL[view.current.kind]} 대기 · 남은 시간{" "}
              <Countdown deadline={view.current.deadline} format="hm" className="font-bold text-white" />
            </p>
          ) : null}
          {jury ? (
            <>
              <button
                type="button"
                onClick={() => setShowJury((v) => !v)}
                aria-expanded={showJury}
                className="mt-2 min-h-11 w-full border border-white/25 font-serif text-[14px] font-bold"
              >
                배심원 모집 링크 {showJury ? "닫기" : "보기"}
              </button>
              {showJury && (
                <div className="mt-2">
                  <ShareButtons
                    compact
                    url={jury.link}
                    title={`${view.title} — 배심원을 모집합니다`}
                    text="공방 기록을 읽고 원고 승·피고 승·쌍방 과실 중 하나에 투표."
                    imageUrl={jury.image}
                    buttonLabel="배심원 참여"
                  />
                </div>
              )}
            </>
          ) : view.status === "trial" ? (
            <div className="mt-2 border-t border-dashed border-white/15 pt-2">
              <button type="button" disabled={inviting} onClick={invite} className="min-h-11 w-full border border-white/25 font-serif text-[14px] font-bold disabled:opacity-40">
                배심원 초대
              </button>
              <p className="mt-1.5 text-center font-type text-[11px] leading-relaxed text-white/45">
                미초대 시 공방 종료 즉시 AI 재판장이 양측 진술로 판결함.
              </p>
              {inviteError && <p className="text-center text-sm text-red-300">{inviteError}</p>}
            </div>
          ) : null}
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

function Figure({
  label,
  name,
  active,
  me,
  raised,
  flip,
  children,
}: {
  label: string;
  name: string;
  active: boolean;
  me?: boolean;
  raised?: boolean;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div animate={{ scale: active ? 1.06 : 1, opacity: active ? 1 : 0.55 }} className={raised ? "-translate-y-3" : ""}>
      <div className={`mx-auto w-fit ${active ? "text-white" : "text-white/70"} ${flip ? "-scale-x-100" : ""}`}>{children}</div>
      <div className={`mx-auto mt-1 w-fit px-2 py-0.5 font-type text-[11px] font-bold ${raised ? "bg-seal" : "border border-white/20"}`}>
        {label}
        {name && ` ${name}`}
        {me && <span className="ml-1 text-white/50">(나)</span>}
      </div>
    </motion.div>
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
        {s.round}R
        <br />
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
              <li key={i}>{s.kind === "testimony" ? `${i + 1}. ${t}` : t}</li>
            ))}
          </ol>
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

function Compose({ view, me, onDone }: { view: TrialView; me: Role; onDone: () => void }) {
  const slot = view.current!;
  const [lines, setLines] = useState<string[]>([""]);
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [cardId, setCardId] = useState<CardId | null>(null);
  const [ev, setEv] = useState<PublicEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = slot.kind === "rebuttal" ? rebuttalTarget(view.statements, slot.round) : null;
  const needsTarget = !!target && !target.forfeited;
  const max = slot.kind === "testimony" ? 4 : 1;
  const filled = lines.map((l) => l.trim()).filter(Boolean);

  const upload = async (file: File) => {
    if (file.size > LIMITS.evidenceBytes) return setError("5MB 이하 이미지만 올릴 수 있어요.");
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      setEv(await api<PublicEvidence>(`/api/cases/${view.caseId}/evidence?as=${me}`, { method: "POST", body: fd }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  };

  const rename = async (label: string) => {
    if (!ev || !label.trim() || label === ev.label) return;
    try {
      const r = await api<{ label: string }>(`/api/cases/${view.caseId}/evidence/${ev.id}?as=${me}`, { method: "PATCH", json: { label } });
      setEv({ ...ev, label: r.label });
    } catch {}
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/cases/${view.caseId}/statements`, {
        json: { sentences: filled, targetSentenceIdx: targetIdx, cardId, evidenceId: ev?.id ?? null },
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
          내 차례 · {slot.round}라운드 {label}
        </p>
        <p className="font-type text-[12px] text-white/60">
          남은 시간 <Countdown deadline={slot.deadline} format="hm" />
        </p>
      </div>

      {needsTarget && target && (
        <div>
          <p className="mb-1.5 font-type text-[12px] text-white/60">반박할 문장 선택</p>
          <div className="space-y-1.5">
            {target.sentences.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTargetIdx(i)}
                className={`block min-h-11 w-full border px-3 py-2 text-left text-[14px] ${
                  targetIdx === i ? "border-seal bg-seal/25" : "border-white/15 bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {lines.map((l, i) => (
        <input
          key={i}
          value={l}
          maxLength={LIMITS.sentence}
          onChange={(e) => setLines(lines.map((x, j) => (j === i ? e.target.value : x)))}
          placeholder={slot.kind === "testimony" ? `${i + 1}번째 문장` : slot.kind === "rebuttal" ? "반박 한 문장" : "최후진술 한 문장"}
          className="min-h-12 w-full border-b border-white/30 bg-transparent px-1 text-[16px] outline-none placeholder:text-white/30 focus:border-white/80"
        />
      ))}
      {lines.length < max && (
        <button type="button" className="min-h-11 font-type text-[12px] text-white/60 underline" onClick={() => setLines([...lines, ""])}>
          문장 추가 ({lines.length}/{max})
        </button>
      )}

      {slot.kind === "rebuttal" && (
        <>
          <div>
            <p className="mb-1.5 font-type text-[12px] text-white/60">항변 카드 (선택)</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {DEFENSE_CARDS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardId(cardId === c.id ? null : c.id)}
                  className={`min-h-16 w-28 shrink-0 border p-2 text-left font-serif text-[12.5px] font-bold ${
                    cardId === c.id ? "border-amber-300 bg-amber-300/15 text-amber-100" : "border-white/15 bg-white/5"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {cardId && (
              <div className="mt-2 bg-amber-100 p-3 text-[12px] text-ink">
                <p>{DEFENSE_CARDS.find((c) => c.id === cardId)!.desc}</p>
                <p className="mt-1 text-[10px] text-black/50">{CARD_NOTICE}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ev ? (
              <>
                {ev.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.url} alt="" className="h-11 w-11 object-cover" />
                )}
                <input
                  defaultValue={ev.label}
                  maxLength={LIMITS.label}
                  onBlur={(e) => rename(e.target.value)}
                  className="min-h-11 flex-1 border-b border-white/30 bg-transparent px-1 font-type text-[14px]"
                  aria-label="증거 이름"
                />
                <button type="button" className="min-h-11 px-2 text-xs text-white/60" onClick={() => setEv(null)}>
                  빼기
                </button>
              </>
            ) : (
              <label className="flex min-h-11 cursor-pointer items-center border border-dashed border-white/25 px-3 font-type text-[12.5px] text-white/70">
                증거 사진 첨부 (선택, 5MB 이하)
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            )}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="button"
        disabled={busy || filled.length === 0 || (needsTarget && targetIdx == null)}
        onClick={submit}
        className="min-h-14 w-full bg-seal font-serif text-[18px] font-black tracking-[0.06em] shadow-[inset_0_-3px_0_rgb(0_0_0/0.25)] disabled:opacity-40"
      >
        {busy ? "제출 중" : slot.kind === "rebuttal" ? "이의 있음!" : `${label} 제출`}
      </button>
    </div>
  );
}

function VotingPanel({ view }: { view: TrialView }) {
  const total = view.votes.plaintiff + view.votes.defendant + view.votes.both;
  return (
    <div className="space-y-2 py-1">
      <p className="text-center font-type text-[13px]">
        배심원 평의 중 · 마감까지 <Countdown deadline={view.votingDeadline} format="hm" className="font-bold" />
      </p>
      <VoteBars votes={view.votes} total={total} plaintiff={view.plaintiffNick} defendant={view.defendantNick} />
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
