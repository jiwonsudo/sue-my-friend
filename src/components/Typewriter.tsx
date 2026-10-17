"use client";
import { useEffect, useMemo, useState } from "react";
import { playBlip } from "@/lib/client/sfx";

/** 한 글자씩 타이핑. 탭하면 즉시 전체 표시. 텍스트가 바뀌면 부모에서 key 로 리셋. */
export function Typewriter({ text, speed = 38, sound = true }: { text: string; speed?: number; sound?: boolean }) {
  const chars = useMemo(() => [...text], [text]);
  const [n, setN] = useState(0);
  const done = n >= chars.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      setN((x) => x + 1);
      if (sound && n % 2 === 0 && chars[n] !== " ") playBlip();
    }, speed);
    return () => clearTimeout(t);
  }, [n, done, speed, sound, chars]);

  return (
    <span onClick={() => setN(chars.length)} className="cursor-pointer">
      {chars.slice(0, n).join("")}
      {!done && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-white/70 align-middle" />}
    </span>
  );
}
