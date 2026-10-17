"use client";

import { motion } from "framer-motion";

const EASE = [0.3, 0.7, 0.2, 1] as const;

/**
 * 3단으로 접히는 종이. folded=true 면 아래 → 위 순서로 접고, false 면 위 → 아래 순서로 편다.
 * (우편함에서 펼치기, 발송할 때 접기에 같이 쓴다)
 */
export function TriFold({ folded, initialFolded, title = "통고서", className = "" }: { folded: boolean; initialFolded?: boolean; title?: string; className?: string }) {
  const start = initialFolded ?? folded;
  return (
    <div className={`relative h-[390px] w-[280px] [transform-style:preserve-3d] ${className}`}>
      <div className="paper absolute inset-x-0 top-1/3 h-1/3 px-5 shadow-none">
        <Lines n={5} />
      </div>
      <motion.div
        className="absolute inset-x-0 top-0 h-1/3"
        style={{ transformOrigin: "bottom", transformStyle: "preserve-3d" }}
        initial={{ rotateX: start ? -178 : 0 }}
        animate={{ rotateX: folded ? -178 : 0 }}
        transition={{ duration: 0.55, delay: folded ? 0.55 : 0, ease: EASE }}
      >
        <Face>
          <p className="font-type text-[9px] text-black/40">[친고 서식 제2호]</p>
          <p className="mt-1 font-serif text-lg font-black tracking-[0.5em]">{title}</p>
          <Lines n={2} />
        </Face>
      </motion.div>
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ transformOrigin: "top", transformStyle: "preserve-3d" }}
        initial={{ rotateX: start ? 178 : 0 }}
        animate={{ rotateX: folded ? 178 : 0 }}
        transition={{ duration: 0.55, delay: folded ? 0 : 0.55, ease: EASE }}
      >
        <Face>
          <Lines n={4} />
        </Face>
      </motion.div>
    </div>
  );
}

/** 앞면(내용) + 뒷면(빈 종이) */
function Face({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="paper absolute inset-0 px-5 pt-4 shadow-none [backface-visibility:hidden]">{children}</div>
      <div className="paper-2 absolute inset-0 shadow-none [backface-visibility:hidden] [transform:rotateX(180deg)]" />
    </>
  );
}

function Lines({ n }: { n: number }) {
  return (
    <div className="space-y-3 pt-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-1.5 bg-black/12" style={{ width: `${90 - ((i * 17) % 35)}%` }} />
      ))}
    </div>
  );
}
