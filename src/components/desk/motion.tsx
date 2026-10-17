"use client";

import { playSlide } from "@/lib/client/sfx";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** 서류가 책상을 떠나는 방식 */
export type SheetExit = "aside" | "crumple" | "lift" | "fade";
/** 서류가 책상에 놓이는 방식 */
export type SheetEnter = "drop" | "print" | "slide" | "fade";

type Custom = { enter: SheetEnter; exit: SheetExit };

const RECT = "polygon(0% 0%, 50% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%)";
const BALL = "polygon(22% 18%, 55% 8%, 84% 24%, 90% 56%, 76% 86%, 46% 94%, 14% 78%, 8% 44%)";

const full: Variants = {
  initial: ({ enter }: Custom) =>
    enter === "drop"
      ? { opacity: 0, y: -18, scale: 1.04, rotate: -1.2 }
      : enter === "print"
        ? { opacity: 1, y: -40, clipPath: "inset(0% 0% 100% 0%)" }
        : enter === "slide"
          ? { opacity: 0, x: 60, rotate: 3 }
          : { opacity: 0 },
  animate: ({ enter }: Custom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    clipPath: enter === "print" ? "inset(0% 0% 0% 0%)" : undefined,
    transition:
      enter === "print"
        ? { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }
        : enter === "drop"
          ? { type: "spring", stiffness: 260, damping: 24 }
          : { duration: 0.35, ease: "easeOut" },
  }),
  exit: ({ exit }: Custom) =>
    exit === "crumple"
      ? {
          clipPath: [RECT, BALL, BALL],
          scale: [1, 0.55, 0.12],
          rotate: [0, -20, 160],
          x: [0, 0, 160],
          y: [0, 20, -260],
          opacity: [1, 1, 0],
          filter: ["brightness(1)", "brightness(0.85)", "brightness(0.8)"],
          transition: { duration: 0.75, times: [0, 0.45, 1], ease: "easeIn" },
        }
      : exit === "aside"
        ? { x: "-115%", y: 30, rotate: -9, opacity: 0.9, transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] } }
        : exit === "lift"
          ? { y: -30, scale: 1.03, opacity: 0, transition: { duration: 0.3 } }
          : { opacity: 0, transition: { duration: 0.2 } },
};

const reduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export function useSheetVariants(): Variants {
  return useReducedMotion() ? reduced : full;
}

/**
 * 책상 위 서류 교체. swapKey 가 바뀌면 이전 장은 exit 방식으로 치우고 새 장을 enter 방식으로 놓는다.
 * prefers-reduced-motion 이면 페이드만.
 */
export function SheetSwap({
  swapKey,
  enter = "drop",
  exit = "aside",
  className,
  children,
}: {
  swapKey: string;
  enter?: SheetEnter;
  exit?: SheetExit;
  className?: string;
  children: React.ReactNode;
}) {
  const variants = useSheetVariants();
  const custom: Custom = { enter, exit };
  return (
    <AnimatePresence mode="wait" custom={custom} initial={false}>
      <motion.div key={swapKey} custom={custom} variants={variants} initial="initial" animate="animate" exit="exit" className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** 페이지에 처음 들어올 때 서류가 책상에 놓이는 동작 */
export function DropIn({
  children,
  enter = "drop",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  enter?: SheetEnter;
  delay?: number;
  className?: string;
}) {
  const variants = useSheetVariants();
  return (
    <motion.div
      custom={{ enter, exit: "fade" } satisfies Custom}
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** 고무도장 쾅 */
export function StampIn({
  children,
  show = true,
  delay = 0,
  rotate = -8,
  className,
}: {
  children: React.ReactNode;
  show?: boolean;
  delay?: number;
  rotate?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`inline-block ${className ?? ""}`}
      initial={false}
      animate={show ? { scale: 1, opacity: 1, rotate } : { scale: reduce ? 1 : 2.6, opacity: 0, rotate }}
      transition={reduce ? { duration: 0.2, delay } : { type: "spring", stiffness: 520, damping: 20, delay }}
    >
      {children}
    </motion.span>
  );
}

/**
 * 집어 드는 서류: 누르면 반듯하게 들렸다가 다음 화면으로.
 * children 은 pick(href) 를 받아 안쪽 버튼에서도 같은 동작을 쓴다.
 */
export function PickUp({
  href,
  rotate = 0,
  className,
  children,
}: {
  href: string;
  rotate?: number;
  className?: string;
  children: (pick: (to?: string) => void) => React.ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [lifted, setLifted] = useState(false);
  const pick = (to = href) => {
    if (lifted) return;
    setLifted(true);
    playSlide();
    router.prefetch(to);
    setTimeout(() => router.push(to), reduce ? 0 : 340);
  };
  return (
    <motion.div
      className={`cursor-pointer ${className ?? ""}`}
      onClick={() => pick()}
      initial={false}
      animate={
        lifted && !reduce
          ? { y: -16, rotate: 0, scale: 1.03, filter: "drop-shadow(0 28px 24px rgb(0 0 0 / 0.5))" }
          : { y: 0, rotate, scale: 1, filter: "drop-shadow(0 0 0 rgb(0 0 0 / 0))" }
      }
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children(pick)}
    </motion.div>
  );
}
