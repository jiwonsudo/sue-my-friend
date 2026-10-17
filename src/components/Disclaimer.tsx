import { DISCLAIMER } from "@/lib/constants";

/** 양식에 고정된 고지문 (LLM 출력 아님) */
export function Disclaimer({ className = "" }: { className?: string }) {
  return <p className={`text-[11px] leading-relaxed text-muted ${className}`}>{DISCLAIMER}</p>;
}
