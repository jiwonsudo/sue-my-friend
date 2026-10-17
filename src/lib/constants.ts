export const SERVICE_NAME = "내 친구 고소하기";

export const DISCLAIMER =
  "※ 본 문서는 친구 간 장난으로 작성된 것으로, 기재된 내용은 사실이 아닐 수 있으며 어떠한 법적 효력이나 책임도 발생하지 않습니다.";

export const CASE_TYPES = [
  { id: "bet", label: "내기 미이행" },
  { id: "ghosting", label: "읽씹" },
  { id: "noshow", label: "약속 노쇼" },
  { id: "borrowed", label: "빌린 거 안 갚음" },
  { id: "custom", label: "직접 입력" },
] as const;

export type CaseType = (typeof CASE_TYPES)[number]["id"];

export const CASE_TYPE_LABEL: Record<CaseType, string> = Object.fromEntries(
  CASE_TYPES.map((t) => [t.id, t.label]),
) as Record<CaseType, string>;

export const LIMITS = {
  nick: 20,
  situation: 500,
  demand: 100,
  sentence: 120,
  item: 300,
  title: 60,
  maxRegen: 3,
  draftsPerIpPerHour: 10,
  evidenceBytes: 5 * 1024 * 1024,
  label: 30,
} as const;

export const HOUR = 60 * 60 * 1000;
export const RESPONSE_WINDOW_MS = 24 * HOUR;
export const TURN_WINDOW_MS = 24 * HOUR;
export const VOTING_WINDOW_MS = 24 * HOUR;

export const DEFENSE_CARDS = [
  {
    id: "delay",
    name: "지체책임 발생",
    desc: "기한 없는 채무는 이행청구를 받은 때부터 지체 (민법 제387조 제2항)",
  },
  {
    id: "no_fault",
    name: "과실 없음",
    desc: "채무불이행 손해배상은 고의·과실이 있어야 한다 (민법 제390조)",
  },
  {
    id: "not_money",
    name: "금전채무 아님",
    desc: "지연손해금 특칙은 금전채무에 대한 규정이다 (민법 제397조)",
  },
  {
    id: "gambling",
    name: "도박이라 무효",
    desc: "형법 제246조 도박죄를 근거로 내기 자체를 문제 삼는다",
  },
  {
    id: "amusement",
    name: "일시오락 항변",
    desc: "형법 제246조 단서: 일시오락 정도면 예외",
  },
] as const;

export type CardId = (typeof DEFENSE_CARDS)[number]["id"];
export const CARD_IDS = DEFENSE_CARDS.map((c) => c.id) as CardId[];
export const CARD_NOTICE = "게임 카드이며 실제 법률 판단이 아닙니다";

export const CUTIN_LINES = [
  "잠깐, 그 말 취소해!",
  "증거 있습니다!",
  "재판장님, 이건 말이 안 됩니다",
] as const;
