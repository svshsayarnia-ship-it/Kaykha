create index if not exists kaykha_games_status_updated_idx
  on public.kaykha_games(status, updated_at)
  where is_practice = false;

create or replace function app_private.cleanup_stale_kaykha_lobbies()
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_deleted integer := 0;
begin
  delete from public.kaykha_games
  where status = 'lobby'
    and is_practice = false
    and updated_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create or replace function app_private.kaykha_cleanup_lobbies_on_game_insert()
returns trigger
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
begin
  perform app_private.cleanup_stale_kaykha_lobbies();
  return null;
end;
$$;

drop trigger if exists trg_kaykha_cleanup_stale_lobbies on public.kaykha_games;
create trigger trg_kaykha_cleanup_stale_lobbies
before insert on public.kaykha_games
for each statement execute function app_private.kaykha_cleanup_lobbies_on_game_insert();

create or replace function app_private.kaykha_reject_stale_lobby_member_insert()
returns trigger
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_stale boolean := false;
begin
  select (g.status = 'lobby' and not g.is_practice and g.updated_at < now() - interval '24 hours')
    into v_stale
  from public.kaykha_games g
  where g.id = new.game_id;

  if coalesce(v_stale, false) then
    raise exception 'این تالار منقضی شده است؛ میزبان یک تالار تازه بسازد';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_kaykha_reject_stale_lobby_member on public.kaykha_members;
create trigger trg_kaykha_reject_stale_lobby_member
before insert on public.kaykha_members
for each row execute function app_private.kaykha_reject_stale_lobby_member_insert();

select app_private.cleanup_stale_kaykha_lobbies();
