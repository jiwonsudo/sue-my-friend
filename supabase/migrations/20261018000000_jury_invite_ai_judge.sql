-- 배심원은 당사자가 초대했을 때만 모집한다. 초대가 없으면 AI 재판장이 판결한다.
alter table cases add column jury_invited_at timestamptz;

-- 누가 판결했는지: system(인낙·궐석 등 정해진 판결), jury(배심원 평결), judge(AI 재판장)
alter table judgments
  add column judged_by text not null default 'system'
  check (judged_by in ('system', 'jury', 'judge'));
