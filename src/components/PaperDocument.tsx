"use client";

import { playPen } from "@/lib/client/sfx";
import { useLayoutEffect, useRef } from "react";
import { LIMITS } from "@/lib/constants";
import type { Draft } from "@/lib/types";
import { Disclaimer } from "./Disclaimer";
import { FORM_NO, FormTable, Sheet } from "./desk/Sheet";
import { Seal } from "./Seal";

export type PaperDocumentProps = {
  caseNo: string;
  toNick: string;
  fromNick: string;
  title: string;
  items: string[];
  date: string;
  seal?: React.ReactNode;
  /** 오른쪽 위 접수·수신 도장 */
  stamp?: React.ReactNode;
  coffee?: boolean;
  className?: string;
  /** 빨간 펜 교정 모드 */
  edit?: { value: Draft; original: Draft; onChange: (d: Draft) => void };
};

/** 통고서 양식 */
export function PaperDocument({ caseNo, toNick, fromNick, title, items, date, seal, stamp, coffee, className = "", edit }: PaperDocumentProps) {
  return (
    <Sheet formNo={FORM_NO.notice} side="(1쪽 중 1쪽)" page={1} coffee={coffee} className={`font-serif text-[15px] leading-[1.85] ${className}`}>
      <div className="px-6 pt-5 pb-5 sm:px-9">
        <div className="relative mb-6 min-h-16">
          <h1 className="text-[28px] leading-none font-black tracking-[0.55em]">통고서</h1>
          <div className="mt-2.5 h-[5px] w-[9.5rem] border-y border-ink" />
          {stamp && <div className="absolute -top-2 right-0">{stamp}</div>}
        </div>
        <FormTable
          rows={[
            ["사건번호", <span key="n" className="font-type text-[13.5px]">{caseNo || "발송 시 부여"}</span>],
            ["수 신", `${toNick} 귀하`],
            ["발 신", fromNick],
            [
              "제 목",
              edit ? (
                <Correctable
                  key="t"
                  value={edit.value.title}
                  original={edit.original.title}
                  max={LIMITS.title}
                  bold
                  onChange={(v) => edit.onChange({ ...edit.value, title: v })}
                  label="제목"
                />
              ) : (
                <b key="t">{title}</b>
              ),
            ],
          ]}
        />
        <ol className="mt-6 space-y-3">
          {(edit ? edit.value.items : items).map((item, i) => (
            <li key={i} className="grid grid-cols-[1.6em_1fr]">
              <span>{i + 1}.</span>
              {edit ? (
                <Correctable
                  value={item}
                  original={edit.original.items[i] ?? ""}
                  max={LIMITS.item}
                  label={`${i + 1}항`}
                  onChange={(v) => edit.onChange({ ...edit.value, items: edit.value.items.map((x, j) => (j === i ? v : x)) })}
                />
              ) : (
                <span>{item}</span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center tracking-[0.15em]">{date}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="tracking-[0.1em]">발신인 {fromNick}</span>
          <span className="relative inline-flex h-10 w-10 items-center justify-center text-black/40">
            (인)
            <span className="absolute -top-3 -left-2">{seal ?? <Seal name={fromNick} size={60} />}</span>
          </span>
        </div>
        <hr className="mt-8 mb-3 border-paper-line" />
        <Disclaimer />
      </div>
    </Sheet>
  );
}

/**
 * 빨간 펜 교정: 원문과 달라지면 원문에 두 줄을 긋고 그 위에 손글씨로 고쳐 쓴 것처럼 보인다.
 */
function Correctable({
  value,
  original,
  max,
  bold,
  label,
  onChange,
}: {
  value: string;
  original: string;
  max: number;
  bold?: boolean;
  label: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const changed = value !== original;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, changed]);
  return (
    <span className="block">
      {changed && (
        <span className={`block text-black/45 line-through decoration-redpen decoration-[1.5px] [text-decoration-style:double] ${bold ? "font-bold" : ""}`}>
          {original}
        </span>
      )}
      <textarea
        ref={ref}
        aria-label={`${label} 고쳐 쓰기`}
        rows={1}
        maxLength={max}
        value={value}
        onChange={(e) => {
          playPen();
          onChange(e.target.value);
        }}
        className={`block w-full resize-none overflow-hidden bg-transparent outline-none ${
          changed
            ? "-rotate-[0.4deg] font-hand text-[22px] leading-[1.25] text-redpen"
            : `border-b border-dashed border-redpen/50 text-[16px] focus:bg-redpen/[0.04] ${bold ? "font-bold" : ""}`
        }`}
      />
    </span>
  );
}
