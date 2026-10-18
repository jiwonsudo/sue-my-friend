-- 끝난 사건(판결·기각)은 끝난 지 1시간 뒤 통째로 삭제한다.
-- 딸린 진술·판결·토큰·신고 등은 on delete cascade 로 함께 지워진다.

alter table cases add column closed_at timestamptz;

-- 판결·기각으로 바뀌는 순간을 기록 (앱 코드가 어디서 상태를 바꾸든 빠지지 않게 트리거로)
create function set_case_closed_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('judged', 'executed', 'dismissed') and new.closed_at is null then
    new.closed_at := now();
  end if;
  return new;
end;
$$;

create trigger cases_closed_at
  before insert or update of status on cases
  for each row execute function set_case_closed_at();

-- 이미 끝나 있던 사건: 판결 시각, 없으면 지금부터 1시간
update cases c
set closed_at = coalesce((select j.created_at from judgments j where j.case_id = c.id), now())
where c.status in ('judged', 'executed', 'dismissed');

create index cases_closed_at on cases (closed_at) where closed_at is not null;

create function purge_closed_cases() returns integer
language sql
security definer
set search_path = public
as $$
  with gone as (
    delete from cases where closed_at < now() - interval '1 hour' returning 1
  )
  select count(*)::integer from gone;
$$;

revoke all on function purge_closed_cases() from public, anon, authenticated;

-- 10분마다 정리. 앱은 1시간이 지난 사건을 이미 없는 것으로 취급하므로 실제 삭제가 조금 늦어도 보이지 않는다.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule('purge-closed-cases', '*/10 * * * *', 'select public.purge_closed_cases()');
