export const SERVICE_NAME = "내 친구 고소하기";

export const DISCLAIMER =
  "※ 본 문서는 친구 간 장난으로 작성된 것으로, 기재된 내용은 사실이 아닐 수 있으며 어떠한 법적 효력이나 책임도 발생하지 않습니다.";

/** 사건 대분류 */
export const CASE_GROUPS = [
  { id: "promise", label: "약속·내기" },
  { id: "money", label: "돈·물건" },
  { id: "contact", label: "연락·SNS" },
  { id: "hobby", label: "게임·취미" },
  { id: "etc", label: "기타" },
] as const;

export type CaseGroup = (typeof CASE_GROUPS)[number]["id"];

/** 세부 사건 유형 (DB cases.type 제약과 맞출 것) */
export const CASE_TYPES = [
  { id: "bet", group: "promise", label: "내기 미이행" },
  { id: "noshow", group: "promise", label: "약속 노쇼" },
  { id: "late", group: "promise", label: "상습 지각" },
  { id: "flipflop", group: "promise", label: "말 바꾸기" },
  { id: "borrowed", group: "money", label: "빌린 돈 안 갚음" },
  { id: "item", group: "money", label: "빌린 물건 미반납" },
  { id: "dutch", group: "money", label: "더치페이 미정산" },
  { id: "food", group: "money", label: "내 음식 무단 취식" },
  { id: "ghosting", group: "contact", label: "읽씹" },
  { id: "unread", group: "contact", label: "안읽씹" },
  { id: "groupchat", group: "contact", label: "단톡방 잠수" },
  { id: "birthday", group: "contact", label: "생일·기념일 미축하" },
  { id: "photo", group: "contact", label: "흑역사 사진 게시" },
  { id: "game", group: "hobby", label: "게임 트롤·버스 미이행" },
  { id: "spoiler", group: "hobby", label: "스포일러 유포" },
  { id: "custom", group: "etc", label: "직접 입력" },
] as const satisfies readonly { id: string; group: CaseGroup; label: string }[];

export type CaseType = (typeof CASE_TYPES)[number]["id"];

export const CASE_TYPE_LABEL: Record<CaseType, string> = Object.fromEntries(
  CASE_TYPES.map((t) => [t.id, t.label]),
) as Record<CaseType, string>;

export const CASE_GROUP_OF: Record<CaseType, CaseGroup> = Object.fromEntries(
  CASE_TYPES.map((t) => [t.id, t.group]),
) as Record<CaseType, CaseGroup>;

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
export const RESPONSE_WINDOW_MS = 12 * HOUR;
export const TURN_WINDOW_MS = 6 * HOUR;
export const VOTING_WINDOW_MS = 6 * HOUR;

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
  "이의 있소!",
] as const;
