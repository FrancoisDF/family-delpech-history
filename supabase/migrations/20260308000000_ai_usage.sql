create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  visitor_hash text not null,
  ip_hash text not null,
  model text not null default '',
  status text not null check (status in ('reserved', 'completed', 'failed')),
  estimated_tokens integer not null default 0 check (estimated_tokens >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12, 8) not null default 0 check (estimated_cost_usd >= 0),
  actual_cost_usd numeric(12, 8) not null default 0 check (actual_cost_usd >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_usage_events_visitor_created_idx
  on public.ai_usage_events (visitor_hash, created_at desc);
create index if not exists ai_usage_events_created_status_idx
  on public.ai_usage_events (created_at, status);

alter table public.ai_usage_events enable row level security;

create or replace function public.reserve_ai_usage(
  p_request_id uuid,
  p_visitor_hash text,
  p_ip_hash text,
  p_estimated_tokens integer,
  p_estimated_cost_usd numeric,
  p_burst_limit integer,
  p_burst_window_seconds integer,
  p_daily_budget_usd numeric,
  p_daily_token_limit integer,
  p_monthly_budget_usd numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_month_start timestamptz := date_trunc('month', v_now);
  v_day_start timestamptz := date_trunc('day', v_now);
  v_monthly_cost numeric;
  v_daily_cost numeric;
  v_daily_tokens integer;
  v_burst_count integer;
  v_reservation_id uuid := gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtext('ai-budget-' || to_char(v_now, 'YYYY-MM')));

  select coalesce(sum(greatest(actual_cost_usd, estimated_cost_usd)), 0)
    into v_monthly_cost
    from ai_usage_events
   where created_at >= v_month_start
     and status in ('reserved', 'completed');
  if v_monthly_cost + p_estimated_cost_usd > p_monthly_budget_usd then
    return jsonb_build_object('allowed', false, 'reason', 'monthly');
  end if;

  select coalesce(sum(greatest(actual_cost_usd, estimated_cost_usd)), 0),
         coalesce(sum(estimated_tokens), 0)
    into v_daily_cost, v_daily_tokens
    from ai_usage_events
   where visitor_hash = p_visitor_hash
     and created_at >= v_day_start
     and status in ('reserved', 'completed');
  if v_daily_cost + p_estimated_cost_usd > p_daily_budget_usd
     or v_daily_tokens + p_estimated_tokens > p_daily_token_limit then
    return jsonb_build_object('allowed', false, 'reason', 'daily');
  end if;

  select count(*)
    into v_burst_count
    from ai_usage_events
   where visitor_hash = p_visitor_hash
     and created_at >= v_now - make_interval(secs => p_burst_window_seconds)
     and status in ('reserved', 'completed');
  if v_burst_count >= p_burst_limit then
    return jsonb_build_object('allowed', false, 'reason', 'burst');
  end if;

  insert into ai_usage_events (
    id, request_id, visitor_hash, ip_hash, status, estimated_tokens, estimated_cost_usd
  ) values (
    v_reservation_id, p_request_id, p_visitor_hash, p_ip_hash, 'reserved',
    p_estimated_tokens, p_estimated_cost_usd
  );

  return jsonb_build_object('allowed', true, 'reservation_id', v_reservation_id);
end;
$$;

create or replace function public.record_ai_usage(
  p_reservation_id uuid,
  p_request_id uuid,
  p_visitor_hash text,
  p_ip_hash text,
  p_model text,
  p_status text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_actual_cost_usd numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update ai_usage_events
     set status = p_status,
         model = p_model,
         estimated_tokens = p_input_tokens + p_output_tokens,
         input_tokens = p_input_tokens,
         output_tokens = p_output_tokens,
         estimated_cost_usd = p_actual_cost_usd,
         actual_cost_usd = p_actual_cost_usd,
         completed_at = now()
   where id = p_reservation_id
     and request_id = p_request_id
     and visitor_hash = p_visitor_hash
     and ip_hash = p_ip_hash
     and status = 'reserved';
end;
$$;

grant execute on function public.reserve_ai_usage(uuid, text, text, integer, numeric, integer, integer, numeric, integer, numeric) to service_role;
grant execute on function public.record_ai_usage(uuid, uuid, text, text, text, text, integer, integer, numeric) to service_role;
