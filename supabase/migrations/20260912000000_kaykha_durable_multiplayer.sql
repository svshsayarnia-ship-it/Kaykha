-- Kaykha Phase 4B: durable games, sealed orders and market deeds.
-- Applied to the connected Supabase project on 2026-09-12.

alter table public.kaykha_games
  add column if not exists mode text not null default 'hegemony'
  check (mode in ('hegemony','dynasty','survival','silk_road'));

alter table public.kaykha_members
  add column if not exists persona_key text,
  add column if not exists prestige integer not null default 0 check (prestige >= 0),
  add column if not exists seat_no smallint check (seat_no between 1 and 16);

create unique index if not exists kaykha_members_game_seat_unique
  on public.kaykha_members (game_id, seat_no) where seat_no is not null;
create unique index if not exists kaykha_members_game_house_unique
  on public.kaykha_members (game_id, house_id) where house_id is not null;

alter table app_private.kaykha_secret_orders
  drop constraint if exists kaykha_secret_orders_order_type_check;
alter table app_private.kaykha_secret_orders
  add constraint kaykha_secret_orders_order_type_check
  check (order_type in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell'));

create table if not exists public.kaykha_deeds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  city_id text not null check (char_length(city_id) between 1 and 64),
  owner_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  property_level text not null check (property_level in ('stall','merchant_house','caravanserai')),
  resource_key text not null check (resource_key in ('copper','carpet','silk','herbs','armor')),
  position_no smallint not null check (position_no between 1 and 99),
  created_at timestamptz not null default now(),
  unique (game_id, city_id, position_no)
);

create table if not exists public.kaykha_market_tiles (
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  city_id text not null check (char_length(city_id) between 1 and 64),
  position_no smallint not null check (position_no between 1 and 99),
  resource_key text not null check (resource_key in ('copper','carpet','silk','herbs','armor')),
  owner_member_id uuid references public.kaykha_members(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (game_id, city_id, position_no)
);

create index if not exists kaykha_deeds_owner_member_idx on public.kaykha_deeds(owner_member_id);
create index if not exists kaykha_market_tiles_owner_member_idx on public.kaykha_market_tiles(owner_member_id);

alter table public.kaykha_deeds enable row level security;
alter table public.kaykha_market_tiles enable row level security;

create policy "members can read deeds" on public.kaykha_deeds
  for select to authenticated
  using (exists (
    select 1 from public.kaykha_members me
    where me.game_id = kaykha_deeds.game_id
      and me.user_id = (select auth.uid())
  ));

create policy "members can read market tiles" on public.kaykha_market_tiles
  for select to authenticated
  using (exists (
    select 1 from public.kaykha_members me
    where me.game_id = kaykha_market_tiles.game_id
      and me.user_id = (select auth.uid())
  ));

revoke all on table public.kaykha_deeds from anon;
revoke all on table public.kaykha_market_tiles from anon;
grant select on table public.kaykha_deeds to authenticated;
grant select on table public.kaykha_market_tiles to authenticated;

create or replace function public.create_kaykha_game(
  p_display_name text, p_house_id text, p_total_seats integer default 6,
  p_mode text default 'hegemony'
) returns table(game_id uuid, game_code text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game_id uuid; v_code text; v_member_id uuid; v_attempt integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then raise exception 'نام فرمانده باید بین ۲ تا ۳۲ کاراکتر باشد'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then raise exception 'خاندان نامعتبر است'; end if;
  if p_total_seats not between 4 and 16 then raise exception 'تعداد صندلی‌ها باید بین ۴ تا ۱۶ باشد'; end if;
  if p_mode not in ('hegemony','dynasty','survival','silk_road') then raise exception 'حالت بازی نامعتبر است'; end if;
  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 6));
    begin
      insert into public.kaykha_games(code, host_user_id, total_seats, mode)
      values (v_code, (select auth.uid()), p_total_seats, p_mode) returning id into v_game_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 8 then raise; end if;
    end;
  end loop;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,seat_no)
  values(v_game_id,(select auth.uid()),trim(p_display_name),trim(p_house_id),1) returning id into v_member_id;
  insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence) values
    (v_game_id,'ray',v_member_id,5,4,3),(v_game_id,'isfahan',null,4,4,3),
    (v_game_id,'nishapur',null,3,5,3),(v_game_id,'gorgan',v_member_id,3,3,4),
    (v_game_id,'hamedan',null,4,3,2),(v_game_id,'marv',null,2,5,3);
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game_id,0,'neutral','تالار برپا شد؛ بازار و دربار منتظر خاندان‌هاست.');
  return query select v_game_id, v_code;
end;
$$;

create or replace function public.join_kaykha_game(
  p_code text, p_display_name text, p_house_id text
) returns table(game_id uuid, game_code text, seat_no smallint)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game public.kaykha_games%rowtype; v_seat smallint;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then raise exception 'نام فرمانده باید بین ۲ تا ۳۲ کاراکتر باشد'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then raise exception 'خاندان نامعتبر است'; end if;
  select * into v_game from public.kaykha_games where code = upper(trim(p_code)) for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.status <> 'lobby' then raise exception 'این تالار دیگر برای ورود باز نیست'; end if;
  if exists (select 1 from public.kaykha_members where game_id=v_game.id and user_id=(select auth.uid())) then raise exception 'پیش‌تر وارد این تالار شده‌ای'; end if;
  if exists (select 1 from public.kaykha_members where game_id=v_game.id and house_id=trim(p_house_id)) then raise exception 'این خاندان در تالار انتخاب شده است'; end if;
  select coalesce(max(seat_no),0)::smallint+1 into v_seat from public.kaykha_members where game_id=v_game.id;
  if v_seat > v_game.total_seats then raise exception 'تالار پر است'; end if;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,seat_no)
  values(v_game.id,(select auth.uid()),trim(p_display_name),trim(p_house_id),v_seat);
  return query select v_game.id,v_game.code,v_seat;
end;
$$;

create or replace function public.start_kaykha_game(p_game_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game public.kaykha_games%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id <> (select auth.uid()) then raise exception 'فقط میزبان می‌تواند بازی را آغاز کند'; end if;
  if v_game.status <> 'lobby' then raise exception 'بازی پیش‌تر آغاز شده است'; end if;
  if (select count(*) from public.kaykha_members where game_id=v_game.id and not is_ai) < 2 then raise exception 'برای آغاز بازی دست‌کم دو فرمانده لازم است'; end if;
  update public.kaykha_games set status='active',phase='negotiation',round_no=1,updated_at=now() where id=v_game.id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game.id,1,'neutral','بازار مکاره گشوده شد؛ زمان مذاکره، سند و پیمان است.');
end;
$$;

create or replace function public.open_kaykha_orders(p_game_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_game public.kaykha_games%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id <> (select auth.uid()) then raise exception 'فقط میزبان می‌تواند پرده را عوض کند'; end if;
  if v_game.status <> 'active' or v_game.phase <> 'negotiation' then raise exception 'اکنون زمان ثبت فرمان نیست'; end if;
  update public.kaykha_games set phase='orders',updated_at=now() where id=v_game.id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game.id,v_game.round_no,'neutral','خنجرهای پنهان آغاز شد؛ فرمان‌ها مهر می‌شوند.');
end;
$$;

create or replace function public.submit_kaykha_order(
  p_game_id uuid,p_order_type text,p_origin_territory_id text,p_target_territory_id text,
  p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public, app_private, pg_temp as $$
declare v_game public.kaykha_games%rowtype; v_member_id uuid; v_order_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then raise exception 'نوع فرمان نامعتبر است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status <> 'active' or v_game.phase <> 'orders' then raise exception 'اکنون امکان مهر کردن فرمان نیست'; end if;
  select id into v_member_id from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if v_member_id is null then raise exception 'تو عضو این تالار نیستی'; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=v_member_id) then raise exception 'مبدأ باید یکی از قلمروهای تو باشد'; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_target_territory_id) then raise exception 'هدف در این نقشه وجود ندارد'; end if;
  insert into app_private.kaykha_secret_orders(game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload)
  values(p_game_id,v_member_id,v_game.round_no,p_order_type,p_origin_territory_id,p_target_territory_id,coalesce(p_payload,'{}'::jsonb))
  on conflict(game_id,member_id,round_no) do update set
    order_type=excluded.order_type,origin_territory_id=excluded.origin_territory_id,
    target_territory_id=excluded.target_territory_id,payload=excluded.payload,locked_at=now()
  returning order_id into v_order_id;
  return v_order_id;
end;
$$;

revoke all on function public.create_kaykha_game(text,text,integer,text) from public, anon;
revoke all on function public.join_kaykha_game(text,text,text) from public, anon;
revoke all on function public.start_kaykha_game(uuid) from public, anon;
revoke all on function public.open_kaykha_orders(uuid) from public, anon;
revoke all on function public.submit_kaykha_order(uuid,text,text,text,jsonb) from public, anon;
grant execute on function public.create_kaykha_game(text,text,integer,text) to authenticated;
grant execute on function public.join_kaykha_game(text,text,text) to authenticated;
grant execute on function public.start_kaykha_game(uuid) to authenticated;
grant execute on function public.open_kaykha_orders(uuid) to authenticated;
grant execute on function public.submit_kaykha_order(uuid,text,text,text,jsonb) to authenticated;