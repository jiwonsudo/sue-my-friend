"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 서버 컴포넌트 화면을 주기적으로 새로 그린다 (열람·대응 상태 반영) */
export function AutoRefresh({ ms = 15000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => clearInterval(t);
  }, [ms, router]);
  return null;
}
