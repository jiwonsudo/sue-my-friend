-- 광고 보상형 AI 변호인: 반박 차례마다 1번. 광고 시작 때 티켓을 발급하고, 일정 시간이 지난 뒤에만 선임(추천 생성)된다.
create table lawyer_uses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  role text not null check (role in ('plaintiff', 'defendant')),
  round int not null check (round between 1 and 3),
  ticket_hash text not null,
  ticket_issued_at timestamptz not null default now(),
  granted_at timestamptz,
  suggestions jsonb,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now(),
  unique (case_id, role, round)
);

alter table lawyer_uses enable row level security;
revoke all on lawyer_uses from anon, authenticated;

-- 변호인이 인용한 조항 (src/lib/laws.ts 의 id)
alter table statements add column law_id text;
alter table statements add column lawyer_use_id uuid references lawyer_uses (id);
