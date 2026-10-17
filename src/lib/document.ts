import type { CaseRow, Verdict } from "./types";

const TZ = "Asia/Seoul";

/** 2026. 10. 17. */
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00+09:00` : d) : d;
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}. ${get("month")}. ${get("day")}.`;
}

/** 14:22 */
export function formatTime(d: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function formatDateTime(d: Date | string): string {
  return `${formatDate(d)} ${formatTime(d)}`;
}

function elapsedLabel(from: string, to: Date): string {
  const start = new Date(`${from}T00:00:00+09:00`).getTime();
  const days = Math.max(0, Math.floor((to.getTime() - start) / 86_400_000));
  if (days === 0) return "당일";
  return `${days}일`;
}

type DocCase = Pick<CaseRow, "incident_date" | "sent_at" | "response_deadline_at">;

/** LLM 이 남긴 자리표시자를 서버/화면에서 채운다. */
export function fillPlaceholders(text: string, c: DocCase, now = new Date()): string {
  const ref = c.sent_at ? new Date(c.sent_at) : now;
  const deadline = c.response_deadline_at
    ? `${formatDateTime(c.response_deadline_at)}까지`
    : "본 서면 수령 후 12시간 이내";
  return text
    .replaceAll("{{사건일}}", formatDate(c.incident_date))
    .replaceAll("{{경과기간}}", elapsedLabel(c.incident_date, ref))
    .replaceAll("{{답변기한}}", deadline);
}

export function orderText(verdict: Verdict, demand: string): string {
  switch (verdict) {
    case "plaintiff":
      return `피고는 원고에게 ${demand}을(를) 7일 이내에 이행하라.`;
    case "defendant":
      return "원고의 청구를 기각한다. 소송비용(음료 1잔)은 원고가 부담한다.";
    case "both":
      return `피고는 원고에게 ${demand}의 절반을 이행하라. 나머지 절반은 서로 잊는다.`;
    case "settled":
      return `피고는 청구를 인낙하였으므로 7일 이내에 ${demand}을(를) 이행하라.`;
    case "default":
      return `피고는 도주하였다. 피고는 원고에게 ${demand}을(를) 7일 이내에 이행하라.`;
  }
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  plaintiff: "원고 승소",
  defendant: "피고 승소",
  both: "쌍방 과실",
  settled: "청구 인낙",
  default: "궐석 판결",
};

/** 패소(=이행) 측. 피고 승소면 원고가 음료 1잔을 낸다. */
export function loserOf(verdict: Verdict): "plaintiff" | "defendant" {
  return verdict === "defendant" ? "plaintiff" : "defendant";
}
