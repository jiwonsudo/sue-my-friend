"use client";
import { useState } from "react";

/** 종이 위 주소 칸 + 복사 */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <p className="mb-1 text-[12px] tracking-[0.1em] text-black/60">{label}</p>
      <div className="flex items-end gap-2">
        <span className="min-w-0 flex-1 truncate border-b border-ink/50 pb-1 font-type text-[12.5px] text-ink">{value}</span>
        <button
          type="button"
          className="min-h-11 shrink-0 border border-ink/70 px-3 font-serif text-[13px] font-bold"
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
