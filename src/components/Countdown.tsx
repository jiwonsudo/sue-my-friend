"use client";
import { remaining, useNow } from "@/lib/client/useNow";

export function Countdown({ deadline, format = "hms", className = "" }: { deadline: string | null; format?: "hms" | "hm"; className?: string }) {
  const now = useNow(1000);
  const r = remaining(deadline, now);
  if (!r) return null;
  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {r[format]}
    </span>
  );
}
