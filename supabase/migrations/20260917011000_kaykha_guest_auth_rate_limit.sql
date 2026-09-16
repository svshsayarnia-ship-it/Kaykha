create table if not exists app_private.kaykha_guest_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  issued_count integer not null default 0 check (issued_count >= 0),
  last_seen_at timestamptz not null default now()
);

create index if not exists kaykha_guest_rate_limits_last_seen_idx
  on app_private.kaykha_guest_rate_limits(last_seen_at);

create or replace function public.consume_kaykha_guest_quota(p_fingerprint text)
returns table(allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_row app_private.kaykha_guest_rate_limits%rowtype;
  v_limit integer := 6;
  v_window interval := interval '1 hour';
begin
  if nullif(trim(p_fingerprint), '') is null then
    return query select false, 3600, 0;
    return;
  end if;

  delete from app_private.kaykha_guest_rate_limits
  where last_seen_at < v_now - interval '7 days';

  insert into app_private.kaykha_guest_rate_limits(fingerprint, window_started_at, issued_count, last_seen_at)
  values(trim(p_fingerprint), v_now, 0, v_now)
  on conflict (fingerprint) do nothing;

  select * into v_row
  from app_private.kaykha_guest_rate_limits
  where fingerprint = trim(p_fingerprint)
  for update;

  if v_row.window_started_at <= v_now - v_window then
    update app_private.kaykha_guest_rate_limits
      set window_started_at = v_now,
          issued_count = 1,
          last_seen_at = v_now
    where fingerprint = trim(p_fingerprint);
    return query select true, 0, v_limit - 1;
    return;
  end if;

  if v_row.issued_count >= v_limit then
    update app_private.kaykha_guest_rate_limits
      set last_seen_at = v_now
    where fingerprint = trim(p_fingerprint);
    return query select false,
      greatest(1, ceil(extract(epoch from ((v_row.window_started_at + v_window) - v_now)))::integer),
      0;
    return;
  end if;

  update app_private.kaykha_guest_rate_limits
    set issued_count = issued_count + 1,
        last_seen_at = v_now
  where fingerprint = trim(p_fingerprint);
  return query select true, 0, greatest(0, v_limit - (v_row.issued_count + 1));
end;
$$;

revoke all on function public.consume_kaykha_guest_quota(text) from public, anon, authenticated;
grant execute on function public.consume_kaykha_guest_quota(text) to service_role;

create or replace function public.list_kaykha_stale_guest_user_ids(p_limit integer default 5)
returns table(user_id uuid)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select u.id
  from auth.users u
  where coalesce(u.raw_user_meta_data->>'client','') = 'kaykha'
    and coalesce(u.raw_user_meta_data->>'purpose','') = 'multiplayer_guest'
    and u.created_at < now() - interval '14 days'
    and not exists (select 1 from public.kaykha_games g where g.host_user_id = u.id)
    and not exists (select 1 from public.kaykha_members m where m.user_id = u.id)
  order by u.created_at asc
  limit greatest(1, least(coalesce(p_limit,5), 20));
$$;

revoke all on function public.list_kaykha_stale_guest_user_ids(integer) from public, anon, authenticated;
grant execute on function public.list_kaykha_stale_guest_user_ids(integer) to service_role;
