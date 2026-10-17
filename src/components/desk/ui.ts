/** 책상 화면 공용 버튼 스타일. 둥근 알약 대신 서류 탭·고무도장 손잡이 느낌의 각진 버튼. */
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] px-4 font-serif text-[16px] font-bold tracking-[0.06em] transition active:translate-y-px disabled:opacity-40 disabled:active:translate-y-0";

export const btn = {
  /** 인주색: 접수·발송처럼 도장을 찍는 동작 */
  seal: `${base} bg-seal text-paper shadow-[inset_0_-2px_0_rgb(0_0_0/0.25),0_2px_4px_rgb(0_0_0/0.35)]`,
  /** 먹색 */
  ink: `${base} bg-ink text-paper shadow-[inset_0_-2px_0_rgb(255_255_255/0.08),0_2px_4px_rgb(0_0_0/0.35)]`,
  /** 종이 탭 (어두운 트레이 위) */
  paper: `${base} bg-paper text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_2px_4px_rgb(0_0_0/0.35)]`,
  /** 테두리만 (어두운 트레이 위) */
  line: `${base} border border-paper/35 text-paper`,
  /** 종이 위에서 쓰는 보조 버튼 */
  onPaper: `${base} border border-ink/70 text-ink`,
} as const;

/** 트레이 위 작은 안내 문구 */
export const trayNote = "font-type text-[11.5px] text-paper/60";
