-- Keep Kaykha lobbies readable and rejoinable without recursive RLS failures.
-- The helper functions live in app_private so they are not exposed as public RPCs.

grant usage on schema app_private to authenticated;

create or replace function app_private.kaykha_is_game_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1
       from public.kaykha_members m
       where m.game_id = p_game_id
         and m.user_id = (select auth.uid())
     );
$$;

create or replace function app_private.kaykha_user_in_game(p_game_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
     and exists (
       select 1
       from public.kaykha_members m
       where m.game_id = p_game_id
         and m.user_id = p_user_id
     );
$$;

create or replace function app_private.kaykha_can_read_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1
       from public.kaykha_members target
       join public.kaykha_members me on me.game_id = target.game_id
       where target.id = p_member_id
         and me.user_id = (select auth.uid())
     );
$$;

create or replace function app_private.kaykha_is_own_member_id(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (select auth.uid()) is not null
     and exists (
       select 1
       from public.kaykha_members m
       where m.id = p_member_id
         and m.user_id = (select auth.uid())
     );
$$;

revoke all on function app_private.kaykha_is_game_member(uuid) from public, anon;
revoke all on function app_private.kaykha_user_in_game(uuid, uuid) from public, anon;
revoke all on function app_private.kaykha_can_read_member(uuid) from public, anon;
revoke all on function app_private.kaykha_is_own_member_id(uuid) from public, anon;
grant execute on function app_private.kaykha_is_game_member(uuid) to authenticated;
grant execute on function app_private.kaykha_user_in_game(uuid, uuid) to authenticated;
grant execute on function app_private.kaykha_can_read_member(uuid) to authenticated;
grant execute on function app_private.kaykha_is_own_member_id(uuid) to authenticated;

-- Core room/board policies: no policy reads kaykha_members through kaykha_members RLS anymore.
drop policy if exists "members can read their games" on public.kaykha_games;
create policy "members can read their games" on public.kaykha_games
  for select to authenticated
  using (app_private.kaykha_is_game_member(id));

drop policy if exists "members can read roster" on public.kaykha_members;
create policy "members can read roster" on public.kaykha_members
  for select to authenticated
  using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "members can read territories" on public.kaykha_territories;
create policy "members can read territories" on public.kaykha_territories
  for select to authenticated
  using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "members can read public events" on public.kaykha_events;
create policy "members can read public events" on public.kaykha_events
  for select to authenticated
  using (app_private.kaykha_is_game_member(game_id));

-- All other public Kaykha reads that depended on the recursive roster policy.
drop policy if exists "game members read kaykha bounties" on public.kaykha_bounties;
create policy "game members read kaykha bounties" on public.kaykha_bounties
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "kaykha_compensations_read" on public.kaykha_compensations;
create policy "kaykha_compensations_read" on public.kaykha_compensations
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "game members read kaykha contracts" on public.kaykha_contracts;
create policy "game members read kaykha contracts" on public.kaykha_contracts
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "game members read kaykha credit ledger" on public.kaykha_credit_ledger;
create policy "game members read kaykha credit ledger" on public.kaykha_credit_ledger
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "game members read kaykha crises" on public.kaykha_crises;
create policy "game members read kaykha crises" on public.kaykha_crises
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "members can read deeds" on public.kaykha_deeds;
create policy "members can read deeds" on public.kaykha_deeds
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "game members read defense pledges" on public.kaykha_defense_pledges;
create policy "game members read defense pledges" on public.kaykha_defense_pledges
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "game members read kaykha loans" on public.kaykha_loans;
create policy "game members read kaykha loans" on public.kaykha_loans
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "members can read market tiles" on public.kaykha_market_tiles;
create policy "members can read market tiles" on public.kaykha_market_tiles
  for select to authenticated using (app_private.kaykha_is_game_member(game_id));

drop policy if exists "kaykha_member_traits_game_read" on public.kaykha_member_traits;
create policy "kaykha_member_traits_game_read" on public.kaykha_member_traits
  for select to authenticated using (app_private.kaykha_can_read_member(member_id));

drop policy if exists "players read relevant whispers" on public.kaykha_whispers;
create policy "players read relevant whispers" on public.kaykha_whispers
  for select to authenticated
  using (
    app_private.kaykha_is_game_member(game_id)
    and (recipient_member_id is null or app_private.kaykha_is_own_member_id(recipient_member_id))
  );

-- Private message/proposal membership checks use the non-recursive helper too.
drop policy if exists "members can send private messages" on public.kaykha_messages;
create policy "members can send private messages" on public.kaykha_messages
  for insert to authenticated
  with check (
    (select auth.uid()) = sender_user_id
    and sender_user_id <> recipient_user_id
    and app_private.kaykha_user_in_game(game_id, sender_user_id)
    and app_private.kaykha_user_in_game(game_id, recipient_user_id)
  );

drop policy if exists "participants can read private messages" on public.kaykha_messages;
create policy "participants can read private messages" on public.kaykha_messages
  for select to authenticated
  using (
    ((select auth.uid()) = sender_user_id or (select auth.uid()) = recipient_user_id)
    and app_private.kaykha_is_game_member(game_id)
  );

drop policy if exists "members can create proposals" on public.kaykha_proposals;
create policy "members can create proposals" on public.kaykha_proposals
  for insert to authenticated
  with check (
    (select auth.uid()) = sender_user_id
    and sender_user_id <> recipient_user_id
    and app_private.kaykha_user_in_game(game_id, sender_user_id)
    and app_private.kaykha_user_in_game(game_id, recipient_user_id)
  );

-- Rejoining with the same account/code is now idempotent, so refreshes and reconnects do not strand a player.
create or replace function public.join_kaykha_game(
  p_code text, p_display_name text, p_house_id text
) returns table(game_id uuid, game_code text, seat_no smallint)
language plpgsql security definer set search_path = public, app_private, pg_temp as $$
declare
  v_game public.kaykha_games%rowtype;
  v_seat smallint;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then raise exception 'نام فرمانده باید بین ۲ تا ۳۲ کاراکتر باشد'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then raise exception 'خاندان نامعتبر است'; end if;

  select g.* into v_game
  from public.kaykha_games g
  where g.code = upper(trim(p_code))
  for update;

  if not found then raise exception 'تالار پیدا نشد'; end if;

  -- Existing players may always reconnect with the same code, even after the match has started.
  select m.seat_no into v_seat
  from public.kaykha_members m
  where m.game_id = v_game.id
    and m.user_id = (select auth.uid())
  limit 1;

  if found then
    return query select v_game.id, v_game.code, v_seat;
    return;
  end if;

  -- New players can only enter while the room is still in lobby state.
  if v_game.status <> 'lobby' then raise exception 'این تالار دیگر برای ورود باز نیست'; end if;

  if exists (
    select 1 from public.kaykha_members m
    where m.game_id = v_game.id and m.house_id = trim(p_house_id)
  ) then
    raise exception 'این خاندان در تالار انتخاب شده است';
  end if;

  select (coalesce(max(m.seat_no), 0) + 1)::smallint into v_seat
  from public.kaykha_members m
  where m.game_id = v_game.id;

  if v_seat > v_game.total_seats then raise exception 'تالار پر است'; end if;

  insert into public.kaykha_members(game_id, user_id, display_name, house_id, seat_no)
  values(v_game.id, (select auth.uid()), trim(p_display_name), trim(p_house_id), v_seat);

  return query select v_game.id, v_game.code, v_seat;
end;
$$;

revoke all on function public.join_kaykha_game(text,text,text) from public, anon;
grant execute on function public.join_kaykha_game(text,text,text) to authenticated;
