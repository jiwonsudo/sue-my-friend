import type { LawyerSuggestion } from "./laws";
import type { CardId, CaseType } from "./constants";

export type Role = "plaintiff" | "defendant";
export type TokenRole = Role | "jury";

export type CaseStatus =
  | "draft"
  | "sent"
  | "opened"
  | "trial"
  | "voting"
  | "judged"
  | "executed"
  | "dismissed";

export type Tone = "기본" | "더_킹받게" | "순하게";

export type Draft = {
  title: string;
  items: string[];
  preview_line: string;
};

export type CaseRow = {
  id: string;
  case_no: string;
  type: CaseType;
  plaintiff_nick: string;
  defendant_nick: string;
  incident_date: string;
  situation: string;
  demand: string;
  draft: Draft;
  status: CaseStatus;
  sent_at: string | null;
  opened_at: string | null;
  response_deadline_at: string | null;
  trial_started_at: string | null;
  voting_deadline_at: string | null;
  jury_invited_at: string | null;
  defendant_response: "accept" | "object" | "countersue" | "ignore" | null;
  regen_count: number;
  /** 이 사건에 쓴 AI 비용 (USD, numeric 이라 문자열로 올 수 있음) */
  ai_cost_usd: number | string;
  token_salt: string;
  created_at: string;
};

export type StatementKind = "testimony" | "rebuttal" | "final";

export type StatementRow = {
  id: string;
  case_id: string;
  round: number;
  role: Role;
  kind: StatementKind;
  sentences: string[];
  target_statement_id: string | null;
  target_sentence_idx: number | null;
  card_id: CardId | null;
  evidence_id: string | null;
  /** 변호인이 인용한 조항 (src/lib/laws.ts id) */
  law_id: string | null;
  lawyer_use_id: string | null;
  forfeited: boolean;
  created_at: string;
};

export type EvidenceRow = {
  id: string;
  case_id: string;
  owner_role: Role;
  label: string;
  image_path: string;
  created_at: string;
};

export type Verdict = "plaintiff" | "defendant" | "both" | "settled" | "default";

export type JudgmentRow = {
  case_id: string;
  verdict: Verdict;
  order_text: string;
  reason_text: string;
  judged_by: "system" | "jury" | "judge";
  execution_proof_path: string | null;
  executed_at: string | null;
  created_at: string;
};

/** 공방 화면에 내려주는 형태 (토큰·salt 등 민감 정보 제외) */
export type PublicEvidence = { id: string; label: string; owner_role: Role; url: string | null };

export type TrialSlot = { round: number; role: Role; kind: StatementKind };

export type TrialView = {
  caseId: string;
  caseNo: string;
  title: string;
  status: CaseStatus;
  plaintiffNick: string;
  defendantNick: string;
  me: Role | null;
  statements: StatementRow[];
  evidence: PublicEvidence[];
  current: (TrialSlot & { deadline: string }) | null;
  /** 내 반박 차례일 때만: 이번 차례 변호인 선임 여부와 추천 */
  lawyer: { used: boolean; suggestions: LawyerSuggestion[] | null } | null;
};
