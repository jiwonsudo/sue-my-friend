"use client";
import { useEffect, useRef } from "react";

/** 책상 앞 모서리에 고정된 하단 영역. 높이를 --tray-h 로 알려 본문이 가려지지 않게 한다. */
export function DeskTray({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--tray-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--tray-h");
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] ${
        dark ? "border-t border-white/10 bg-court" : "desk-tray"
      }`}
    >
      <div className="mx-auto max-w-[440px]">{children}</div>
    </div>
  );
}
