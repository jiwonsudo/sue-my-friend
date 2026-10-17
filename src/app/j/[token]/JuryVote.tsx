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

  const btn = "min-h-14 rounded-xl px-2 text-[15px] font-bold disabled:opacity-40";
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-court/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-md space-y-3">
        {p.verdictHref ? (
          <Link href={p.verdictHref} className="flex min-h-14 items-center justify-center rounded-2xl bg-seal font-bold">
            판결 보기
          </Link>
        ) : !p.open ? (
          <p className="py-2 text-center text-sm text-white/60">투표가 열려 있지 않습니다.</p>
        ) : voted || p.isParty ? (
          <>
            {p.isParty && !voted && <p className="text-center text-xs text-white/50">당사자는 투표할 수 없어요. 현재 득표만 보여드려요.</p>}
            <VoteBars votes={votes} total={total} plaintiff={p.plaintiff} defendant={p.defendant} />
          </>
        ) : (
          <>
            <p className="text-center text-sm">
              당신의 판단은?{" "}
              {p.deadline && (
                <span className="text-white/60">
                  · 마감 <Countdown deadline={p.deadline} format="hm" />
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button disabled={busy} onClick={() => vote("plaintiff")} className={`${btn} bg-white text-ink`}>
                원고 승
              </button>
              <button disabled={busy} onClick={() => vote("both")} className={`${btn} border border-white/30`}>
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
