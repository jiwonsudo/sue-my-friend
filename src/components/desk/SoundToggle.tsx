"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/client/sfx";

/** 효과음 켜기/끄기 (브라우저에 기억) */
export function SoundToggle({ dark = false }: { dark?: boolean }) {
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  return (
    <button
      type="button"
      aria-label={muted ? "소리 켜기" : "소리 끄기"}
      aria-pressed={!muted}
      onClick={() => {
        setMuted(!muted);
        setMutedState(!muted);
      }}
      className={`grid min-h-11 min-w-11 place-items-center ${dark ? "text-black/55" : "text-paper/75"}`}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
        {muted ? (
          <path d="M16 9.5l5 5M21 9.5l-5 5" strokeLinecap="round" />
        ) : (
          <path d="M15.5 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M18 6.5c1.8 1.4 2.8 3.3 2.8 5.5s-1 4.1-2.8 5.5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
