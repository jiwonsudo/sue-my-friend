import type { CaseType } from "./constants";

/**
 * AI 변호인이 인용할 수 있는 조항 목록. 실존 조항의 번호·제목에 요지만 적는다 (원문 그대로가 아님).
 * AI 는 이 목록 안에서만 고르게 해서 없는 조항을 지어내지 못하게 한다.
 * types 가 비어 있으면 모든 사건 유형에서 쓸 수 있다.
 */
export type Law = {
  id: string;
  code: "민법" | "형법" | "헌법" | "민사소송법";
  article: string;
  title: string;
  gist: string;
  types?: CaseType[];
};

export const LAWS: Law[] = [
  { id: "civil-2", code: "민법", article: "제2조", title: "신의성실", gist: "권리 행사와 의무 이행은 신의에 따라 성실하게 해야 하고, 권리를 남용해서는 안 된다." },
  { id: "civil-103", code: "민법", article: "제103조", title: "반사회질서의 법률행위", gist: "선량한 풍속이나 사회질서에 어긋나는 약속은 무효다.", types: ["bet", "game", "custom"] },
  { id: "civil-164", code: "민법", article: "제164조", title: "1년의 단기소멸시효", gist: "음식료 등 일부 채권은 1년간 행사하지 않으면 소멸시효가 완성된다.", types: ["bet", "borrowed", "dutch", "food"] },
  { id: "civil-387", code: "민법", article: "제387조", title: "이행기와 이행지체", gist: "기한이 없는 채무는 이행 청구를 받은 때부터 지체책임이 생긴다.", types: ["bet", "borrowed", "item", "dutch", "late", "custom"] },
  { id: "civil-390", code: "민법", article: "제390조", title: "채무불이행과 손해배상", gist: "채무를 이행하지 않으면 손해배상을 청구할 수 있다. 다만 고의나 과실 없이 이행할 수 없었다면 예외다.", types: ["bet", "noshow", "late", "flipflop", "borrowed", "item", "game", "custom"] },
  { id: "civil-397", code: "민법", article: "제397조", title: "금전채무불이행에 대한 특칙", gist: "돈을 갚지 않은 경우 채권자는 손해를 증명할 필요가 없고, 채무자는 과실이 없다고 항변하지 못한다.", types: ["borrowed", "dutch"] },
  { id: "civil-527", code: "민법", article: "제527조", title: "계약의 청약의 구속력", gist: "계약의 청약은 이를 철회하지 못한다.", types: ["flipflop", "bet", "noshow"] },
  { id: "civil-536", code: "민법", article: "제536조", title: "동시이행의 항변권", gist: "서로 의무가 있는 계약에서는 상대가 이행을 제공할 때까지 내 이행을 거절할 수 있다.", types: ["bet", "borrowed", "dutch", "custom"] },
  { id: "civil-544", code: "민법", article: "제544조", title: "이행지체와 해제", gist: "상대가 이행하지 않으면 기간을 정해 최고한 뒤 계약을 해제할 수 있다.", types: ["bet", "noshow", "flipflop", "game", "custom"] },
  { id: "civil-598", code: "민법", article: "제598조", title: "소비대차의 의의", gist: "돈이나 물건을 빌려주고 같은 종류·수량으로 돌려받기로 하면 소비대차가 성립한다.", types: ["borrowed"] },
  { id: "civil-603", code: "민법", article: "제603조", title: "반환시기", gist: "빌린 사람은 약정한 때에 갚아야 하고, 약정이 없으면 빌려준 사람이 상당한 기간을 정해 반환을 최고해야 한다.", types: ["borrowed"] },
  { id: "civil-609", code: "민법", article: "제609조", title: "사용대차의 의의", gist: "물건을 무상으로 빌려 쓰고 다 쓴 뒤 그 물건을 돌려주기로 약정하면 사용대차가 성립한다.", types: ["item"] },
  { id: "civil-613", code: "민법", article: "제613조", title: "차용물의 반환시기", gist: "빌린 물건은 약정한 때에 돌려줘야 하고, 약정이 없으면 다 쓴 때에 돌려줘야 한다.", types: ["item"] },
  { id: "civil-741", code: "민법", article: "제741조", title: "부당이득의 내용", gist: "법률상 원인 없이 남의 재산으로 이익을 얻고 그로 인해 남에게 손해를 입혔다면 그 이익을 돌려줘야 한다.", types: ["dutch", "food", "borrowed"] },
  { id: "civil-750", code: "민법", article: "제750조", title: "불법행위의 내용", gist: "고의나 과실로 남에게 손해를 입히면 배상할 책임이 있다.", types: ["noshow", "late", "food", "ghosting", "unread", "groupchat", "birthday", "photo", "game", "spoiler", "custom"] },
  { id: "civil-751", code: "민법", article: "제751조", title: "재산 이외의 손해의 배상", gist: "정신적 고통을 준 경우에도 배상할 책임이 있다.", types: ["noshow", "ghosting", "unread", "birthday", "photo", "spoiler", "custom"] },
  { id: "criminal-20", code: "형법", article: "제20조", title: "정당행위", gist: "사회상규에 위배되지 않는 행위는 벌하지 않는다." },
  { id: "criminal-246", code: "형법", article: "제246조", title: "도박", gist: "도박은 처벌하지만, 일시오락 정도에 불과한 경우는 예외다.", types: ["bet", "game"] },
  { id: "criminal-307", code: "형법", article: "제307조", title: "명예훼손", gist: "공연히 사실이나 허위사실을 드러내 사람의 명예를 훼손하면 처벌한다.", types: ["photo", "spoiler"] },
  { id: "criminal-314", code: "형법", article: "제314조", title: "업무방해", gist: "허위사실 유포, 위계나 위력으로 사람의 업무를 방해하면 처벌한다.", types: ["game", "spoiler", "groupchat"] },
  { id: "criminal-329", code: "형법", article: "제329조", title: "절도", gist: "타인의 재물을 훔친 사람은 처벌한다.", types: ["food", "item"] },
  { id: "const-10", code: "헌법", article: "제10조", title: "인간의 존엄과 행복추구권", gist: "모든 국민은 인간으로서 존엄과 가치를 가지며 행복을 추구할 권리를 가진다." },
  { id: "const-17", code: "헌법", article: "제17조", title: "사생활의 비밀과 자유", gist: "모든 국민은 사생활의 비밀과 자유를 침해받지 않는다.", types: ["ghosting", "unread", "groupchat", "photo", "custom"] },
  { id: "const-19", code: "헌법", article: "제19조", title: "양심의 자유", gist: "모든 국민은 양심의 자유를 가진다.", types: ["ghosting", "unread", "groupchat", "birthday", "custom"] },
  { id: "const-21", code: "헌법", article: "제21조", title: "언론·출판·집회·결사의 자유", gist: "모든 국민은 언론·출판의 자유와 집회·결사의 자유를 가진다.", types: ["groupchat", "spoiler"] },
  { id: "civpro-202", code: "민사소송법", article: "제202조", title: "자유심증주의", gist: "법원은 변론 전체의 취지와 증거조사 결과를 참작해 자유로운 심증으로 사실을 판단한다." },
  { id: "civpro-288", code: "민사소송법", article: "제288조", title: "불요증사실", gist: "당사자가 자백한 사실과 현저한 사실은 증명할 필요가 없다." },
];

export const LAW_BY_ID = new Map(LAWS.map((l) => [l.id, l]));

export function lawLabel(l: Law): string {
  return `${l.code} ${l.article}(${l.title})`;
}

/** 사건 유형에 맞는 조항을 먼저, 모든 유형 공통 조항은 뒤에 */
export function lawsFor(type: CaseType): Law[] {
  return [...LAWS.filter((l) => l.types?.includes(type)), ...LAWS.filter((l) => !l.types)];
}

export type LawyerSuggestion = { lawId: string; targetIdx: number | null; sentence: string };
