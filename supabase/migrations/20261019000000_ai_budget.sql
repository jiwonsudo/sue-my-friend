-- 사건별 AI 사용액(USD) 누적. 사건당 상한(AI_BUDGET_KRW_PER_CASE)을 넘지 않게 호출 전에 확인한다.
alter table cases add column ai_cost_usd numeric(12, 6) not null default 0;

-- 동시 요청에도 안전하게 더한다
create function add_ai_cost(p_case_id uuid, p_usd numeric)
returns numeric
language sql
as $$
  update cases set ai_cost_usd = ai_cost_usd + p_usd where id = p_case_id returning ai_cost_usd;
$$;

revoke all on function add_ai_cost(uuid, numeric) from public, anon, authenticated;
