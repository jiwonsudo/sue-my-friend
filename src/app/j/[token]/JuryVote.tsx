"use client";

import Link from "next/link";
import { useState } from "react";
import { Countdown } from "@/components/Countdown";
import { VoteBars } from "@/components/VoteBars";
import { api } from "@/lib/client/api";
import type { TrialView } from "@/lib/types";

type Votes = TrialView["votes"];

export function JuryVote(p: {
  token: string;
  open: boolean;
  isParty: boolean;
  initialVoted: boolean;
  votes: Votes;
  deadline: string | null;
  plaintiff: string;
  defendant: string;
  verdictHref: string | null;
}) {
  const [votes, setVotes] = useState(p.votes);
  const [voted, setVoted] = useState(p.initialVoted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = votes.plaintiff + votes.defendant + votes.both;

  const vote = async (verdict: keyof Votes) => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ votes: Votes }>(`/api/j/${p.token}/vote`, { json: { verdict } });
      setVotes(r.votes);
      setVoted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
      if (e instanceof Error && e.message.includes("이미")) setVoted(true);
    } finally {
      setBusy(false);
    }
  };

  const btn = "min-h-14 px-2 font-serif text-[15px] font-bold disabled:opacity-40 active:translate-y-px";
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/15 bg-court px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md space-y-3">
        {p.verdictHref ? (
          <Link href={p.verdictHref} className="flex min-h-14 items-center justify-center bg-seal font-serif text-[16px] font-bold">
            판결문 보기
          </Link>
        ) : !p.open ? (
          <p className="py-2 text-center font-type text-[13px] text-white/60">투표 기간 아님.</p>
        ) : voted || p.isParty ? (
          <>
            {p.isParty && !voted && <p className="text-center font-type text-[11.5px] text-white/50">당사자는 투표 불가. 현재 득표만 표시.</p>}
            <VoteBars votes={votes} total={total} plaintiff={p.plaintiff} defendant={p.defendant} />
          </>
        ) : (
          <>
            <p className="text-center font-type text-[13px]">
              평결 1인 1표{" "}
              {p.deadline && (
                <span className="text-white/60">
                  · 마감 <Countdown deadline={p.deadline} format="hm" />
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button disabled={busy} onClick={() => vote("plaintiff")} className={`${btn} bg-paper text-ink`}>
                원고 승
              </button>
              <button disabled={busy} onClick={() => vote("both")} className={`${btn} border border-white/35`}>
                쌍방 과실
              </button>
              <button disabled={busy} onClick={() => vote("defendant")} className={`${btn} bg-seal`}>
                피고 승
              </button>
            </div>
          </>
        )}
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}
