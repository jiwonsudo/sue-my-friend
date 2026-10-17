-- 친구 고소하기: 초기 스키마
-- 모든 읽기·쓰기는 서버(service role)에서만 한다. anon/authenticated 는 전부 차단.

create extension if not exists pgcrypto with schema extensions;

-- 사건번호 순번 (연도별)
create table case_counters (
  year int primary key,
  last int not null default 0
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  case_no text unique not null,
  type text not null check (type in ('bet', 'ghosting', 'noshow', 'borrowed', 'custom')),
  plaintiff_nick text not null check (char_length(plaintiff_nick) between 1 and 20),
  defendant_nick text not null check (char_length(defendant_nick) between 1 and 20),
  incident_date date not null,
  situation text not null check (char_length(situation) <= 500),
  demand text not null check (char_length(demand) <= 100),
  draft jsonb not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'opened', 'trial', 'voting', 'judged', 'executed', 'dismissed')),
  sent_at timestamptz,
  opened_at timestamptz,
  response_deadline_at timestamptz,
  trial_started_at timestamptz,
  voting_deadline_at timestamptz,
  defendant_response text check (defendant_response in ('accept', 'object', 'countersue', 'ignore')),
  regen_count int not null default 0,
  -- 피고·배심원 토큰 파생용 salt (토큰 원문은 저장하지 않는다)
  token_salt text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create table party_tokens (
  case_id uuid not null references cases (id) on delete cascade,
  role text not null check (role in ('plaintiff', 'defendant', 'jury')),
  token_hash text unique not null,
  primary key (case_id, role)
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  owner_role text not null check (owner_role in ('plaintiff', 'defendant')),
  label text not null check (char_length(label) between 1 and 30),
  image_path text not null,
  created_at timestamptz not null default now()
);

create table statements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  round int not null check (round between 1 and 3),
  role text not null check (role in ('plaintiff', 'defendant')),
  kind text not null check (kind in ('testimony', 'rebuttal', 'final')),
  sentences text[] not null default '{}',
  target_statement_id uuid references statements (id),
  target_sentence_idx int,
  card_id text check (card_id in ('delay', 'no_fault', 'not_money', 'gambling', 'amusement')),
  evidence_id uuid references evidence (id),
  forfeited boolean not null default false,
  created_at timestamptz not null default now(),
  -- 한 사건에서 같은 라운드·역할·종류는 한 번만
  unique (case_id, round, role, kind)
);

create table votes (
  case_id uuid not null references cases (id) on delete cascade,
  voter_hash text not null,
  verdict text not null check (verdict in ('plaintiff', 'defendant', 'both')),
  created_at timestamptz not null default now(),
  unique (case_id, voter_hash)
);

create table judgments (
  case_id uuid unique not null references cases (id) on delete cascade,
  verdict text not null check (verdict in ('plaintiff', 'defendant', 'both', 'settled', 'default')),
  order_text text not null,
  reason_text text not null,
  execution_proof_path text,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table reports (
  case_id uuid not null references cases (id) on delete cascade,
  role text not null,
  reason text not null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

-- 초안 생성 남용 방지용 카운트
create table draft_requests (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index draft_requests_ip_time on draft_requests (ip_hash, created_at);
create index statements_case on statements (case_id, created_at);
create index evidence_case on evidence (case_id);

-- 사건번호 발급: 2026킹-0001
create or replace function next_case_no() returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from (now() at time zone 'Asia/Seoul'))::int;
  n int;
begin
  insert into case_counters (year, last) values (y, 1)
  on conflict (year) do update set last = case_counters.last + 1
  returning last into n;
  return y::text || '킹-' || lpad(n::text, 4, '0');
end;
$$;

-- RLS: 켜고 정책을 만들지 않는다 = anon/authenticated 전면 차단 (service role 은 우회)
alter table case_counters enable row level security;
alter table cases enable row level security;
alter table party_tokens enable row level security;
alter table evidence enable row level security;
alter table statements enable row level security;
alter table votes enable row level security;
alter table judgments enable row level security;
alter table reports enable row level security;
alter table draft_requests enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on function next_case_no() from public, anon, authenticated;
grant execute on function next_case_no() to service_role;

-- 증거·집행 인증 이미지: 비공개 버킷, 이미지만, 5MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
on conflict (id) do nothing;
