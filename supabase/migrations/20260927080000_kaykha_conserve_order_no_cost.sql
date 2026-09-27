-- A zero-cost pass keeps a player from soft-locking when every paid action is
-- unaffordable. It is still a sealed server order and therefore preserves the
-- existing all-members-before-dawn contract.

alter table app_private.kaykha_secret_orders
  drop constraint if exists kaykha_secret_orders_order_type_check;

alter table app_private.kaykha_secret_orders
  add constraint kaykha_secret_orders_order_type_check
  check (order_type in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell','conserve'));

create or replace function public.submit_kaykha_conserve(
  p_game_id uuid,
  p_origin_territory_id text
)
returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_game public.kaykha_games%rowtype;
  v_member public.kaykha_members%rowtype;
  v_order_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;

  select * into v_game
  from public.kaykha_games
  where id=p_game_id
  for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then
    raise exception 'اکنون امکان عبور از راند نیست';
  end if;

  select * into v_member
  from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai
  for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  if not exists (
    select 1 from public.kaykha_territories
    where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=v_member.id
  ) then raise exception 'شهر مبدأ باید شهر خودت باشد'; end if;

  if exists (
    select 1 from app_private.kaykha_secret_orders
    where game_id=p_game_id and member_id=v_member.id and round_no=v_game.round_no
  ) then raise exception 'برای این راند قبلاً فرمانی ثبت شده است'; end if;

  insert into app_private.kaykha_secret_orders(
    game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload
  ) values (
    p_game_id,v_member.id,v_game.round_no,'conserve',p_origin_territory_id,p_origin_territory_id,
    jsonb_build_object('_baha',jsonb_build_object('gold',0,'credibility',0,'bribe_tokens',0,'revision',1),'conserve',true)
  ) returning order_id into v_order_id;

  return v_order_id;
end
$$;

revoke all on function public.submit_kaykha_conserve(uuid,text) from public,anon;
grant execute on function public.submit_kaykha_conserve(uuid,text) to authenticated;
