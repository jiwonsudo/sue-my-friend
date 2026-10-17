"use client";
import { useState } from "react";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{value}</span>
        <button
          type="button"
          className="min-h-9 shrink-0 rounded-lg bg-white px-3 text-[13px] font-semibold shadow-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => {});
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? "복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}
