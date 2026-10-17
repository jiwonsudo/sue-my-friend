"use client";
import { motion } from "framer-motion";
import type { TrialView } from "@/lib/types";

export function VoteBars({
  votes,
  total,
  plaintiff,
  defendant,
  light = false,
}: {
  votes: TrialView["votes"];
  total: number;
  plaintiff: string;
  defendant: string;
  light?: boolean;
}) {
  const rows = [
    { k: "plaintiff" as const, label: `원고 ${plaintiff} 승` },
    { k: "defendant" as const, label: `피고 ${defendant} 승` },
    { k: "both" as const, label: "쌍방 과실" },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const pct = total ? Math.round((votes[r.k] / total) * 100) : 0;
        return (
          <div key={r.k}>
            <div className="mb-0.5 flex justify-between font-type text-[12px]">
              <span>{r.label}</span>
              <span className="tabular-nums">
                {votes[r.k]}표 · {pct}%
              </span>
            </div>
            <div className={`h-2 overflow-hidden ${light ? "bg-black/10" : "bg-white/10"}`}>
              <motion.div className="h-full bg-seal" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <p className={`text-right font-type text-[11px] ${light ? "text-muted" : "text-white/40"}`}>참여 {total}명</p>
    </div>
  );
}
