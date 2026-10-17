"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { playImpact } from "@/lib/client/sfx";

/** 반박 컷인: 흔들림 + 집중선 + 큰 대사 */
export function CutIn({ line, by, onDone }: { line: string; by: string; onDone: () => void }) {
  useEffect(() => {
    playImpact();
    navigator.vibrate?.([40, 30, 60]);
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, -14, 12, -8, 6, 0], y: [0, 8, -10, 6, -3, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      onClick={onDone}
    >
      <motion.div
        className="speed-lines absolute -inset-1/2 opacity-90"
        animate={{ rotate: 8 }}
        transition={{ duration: 1.9, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_15%,#000_70%)]" />
      <motion.div
        className="relative mx-4 -rotate-6 bg-seal px-6 py-5 shadow-[8px_8px_0_#000]"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.08 }}
      >
        <p className="mb-1 font-type text-[13px] font-bold text-white/80">{by}</p>
        <p className="text-[34px] leading-tight font-black tracking-tight text-white [text-shadow:3px_3px_0_#000]">{line}</p>
      </motion.div>
    </motion.div>
  );
}
