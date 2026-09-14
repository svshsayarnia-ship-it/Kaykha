-- City-specific deed pricing and a broader historically grounded market.

alter table public.kaykha_deeds
  drop constraint if exists kaykha_deeds_resource_key_check;
alter table public.kaykha_deeds
  add constraint kaykha_deeds_resource_key_check
  check (resource_key in (
    'copper','carpet','silk','herbs','armor',
    'saffron','grain','dates','lapis'
  ));

alter table public.kaykha_market_tiles
  drop constraint if exists kaykha_market_tiles_resource_key_check;
alter table public.kaykha_market_tiles
  add constraint kaykha_market_tiles_resource_key_check
  check (resource_key in (
    'copper','carpet','silk','herbs','armor',
    'saffron','grain','dates','lapis'
  ));

create or replace function app_private.kaykha_city_market_index(p_city_id text)
returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select case trim(p_city_id)
    when 'bam' then 85
    when 'zaranj' then 88
    when 'yazd' then 91
    when 'nishapur' then 94
    when 'hegmataneh' then 97
    when 'ray' then 100
    when 'susa' then 102
    when 'gorgan' then 105
    when 'balkh' then 108
    when 'shiraz' then 111
    when 'tabriz' then 114
    when 'isfahan' then 117
    when 'merv' then 120
    when 'ctesiphon' then 123
    when 'alamut' then 126
    when 'gambroon' then 129
    when 'hormuz' then 132
    else 100
  end
$$;

create or replace function app_private.kaykha_deed_price(
  p_city_id text,
  p_property_level text
) returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select ceil(
    (case p_property_level
      when 'stall' then 6
      when 'merchant_house' then 12
      when 'caravanserai' then 20
      else null
    end)::numeric
    * app_private.kaykha_city_market_index(p_city_id)::numeric / 100
  )::integer
$$;

revoke all on function app_private.kaykha_city_market_index(text) from public, anon, authenticated;
revoke all on function app_private.kaykha_deed_price(text,text) from public, anon, authenticated;

create or replace function app_private.seed_kaykha_market(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.kaykha_market_tiles
    (game_id, city_id, position_no, resource_key, zone_key, visibility, base_income)
  select p_game_id, t.territory_id, z.position_no,
    (array[
      'copper','carpet','silk','herbs','armor',
      'saffron','grain','dates','lapis'
    ])[1 + mod(abs(hashtext(t.territory_id || ':' || z.position_no::text)), 9)],
    z.zone_key, z.visibility, z.base_income
  from public.kaykha_territories t
  cross join (values
    (1::smallint, 'gates'::text, 'public'::text, 4::smallint),
    (2::smallint, 'royal_square'::text, 'public'::text, 3::smallint),
    (3::smallint, 'guild_alleys'::text, 'semi_hidden'::text, 3::smallint),
    (4::smallint, 'undercity'::text, 'secret'::text, 2::smallint)
  ) as z(position_no, zone_key, visibility, base_income)
  where t.game_id = p_game_id
  on conflict (game_id, city_id, position_no) do update
    set resource_key = case
          when public.kaykha_market_tiles.owner_member_id is null then excluded.resource_key
          else public.kaykha_market_tiles.resource_key
        end,
        zone_key=excluded.zone_key,
        visibility=excluded.visibility,
        base_income=excluded.base_income;
end;
$$;

create or replace function public.get_kaykha_market(p_game_id uuid, p_city_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_member_id uuid;
  v_is_whisperer boolean := false;
  v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select id into v_member_id
    from public.kaykha_members
   where game_id=p_game_id and user_id=(select auth.uid());
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;

  select exists(
    select 1 from app_private.kaykha_shadow_roles
     where game_id=p_game_id and member_id=v_member_id and role_key='whisperer'
  ) into v_is_whisperer;

  select jsonb_build_object(
    'pricing',jsonb_build_object(
      'city_id',trim(p_city_id),
      'market_index',app_private.kaykha_city_market_index(p_city_id),
      'levels',jsonb_build_object(
        'stall',jsonb_build_object('cost',app_private.kaykha_deed_price(p_city_id,'stall'),'income',1),
        'merchant_house',jsonb_build_object('cost',app_private.kaykha_deed_price(p_city_id,'merchant_house'),'income',2),
        'caravanserai',jsonb_build_object('cost',app_private.kaykha_deed_price(p_city_id,'caravanserai'),'income',3)
      )
    ),
    'tiles',coalesce((select jsonb_agg(jsonb_build_object(
      'position_no',mt.position_no,'resource_key',mt.resource_key,'zone_key',mt.zone_key,
      'visibility',mt.visibility,'base_income',mt.base_income,
      'deed',case when d.id is null then null else jsonb_build_object(
        'property_level',d.property_level,
        'owner_member_id',case when d.visibility='secret' and d.owner_member_id<>v_member_id and not v_is_whisperer then null else d.owner_member_id end,
        'owner_share',case when d.visibility='secret' and d.owner_member_id<>v_member_id and not v_is_whisperer then null else d.owner_share end,
        'is_protected',d.is_protected,'is_raided',d.is_raided
      ) end
    ) order by mt.position_no)
    from public.kaykha_market_tiles mt
    left join public.kaykha_deeds d on d.game_id=mt.game_id and d.city_id=mt.city_id and d.position_no=mt.position_no
    where mt.game_id=p_game_id and mt.city_id=trim(p_city_id)),'[]'::jsonb),
    'contracts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'contract_type',c.contract_type,'contract_level',c.contract_level,'status',c.status,
      'due_round',c.due_round,'terms',c.terms,'creator_member_id',c.creator_member_id,
      'counterparty_member_id',c.counterparty_member_id
    ) order by c.created_at desc)
    from public.kaykha_contracts c
    where c.game_id=p_game_id and c.status in ('open','active','defaulted')),'[]'::jsonb),
    'bounties',coalesce((select jsonb_agg(jsonb_build_object(
      'id',b.id,'bounty_type',b.bounty_type,'target_territory_id',b.target_territory_id,
      'reward_coins',b.reward_coins,'status',b.status,'claimant_member_id',b.claimant_member_id
    ) order by b.created_at desc)
    from public.kaykha_bounties b where b.game_id=p_game_id and b.status in ('open','claimed')),'[]'::jsonb),
    'whispers',coalesce((select jsonb_agg(jsonb_build_object(
      'id',w.id,'body',w.body,'recipient_member_id',w.recipient_member_id,'created_at',w.created_at
    ) order by w.created_at desc)
    from public.kaykha_whispers w
    where w.game_id=p_game_id and (w.recipient_member_id is null or w.recipient_member_id=v_member_id)
    limit 12),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.buy_kaykha_deed(
  p_game_id uuid,
  p_city_id text,
  p_position_no smallint,
  p_property_level text
) returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_member_id uuid;
  v_game public.kaykha_games%rowtype;
  v_tile public.kaykha_market_tiles%rowtype;
  v_price integer;
  v_deed_id uuid;
  v_zik_member uuid;
  v_level_label text;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'negotiation' then
    raise exception 'خرید سند فقط در بازار مکاره ممکن است';
  end if;
  select id into v_member_id from public.kaykha_members
    where game_id=p_game_id and user_id=(select auth.uid());
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;
  select * into v_tile from public.kaykha_market_tiles
    where game_id=p_game_id and city_id=trim(p_city_id) and position_no=p_position_no for update;
  if not found then raise exception 'این محله وجود ندارد'; end if;
  if exists(select 1 from public.kaykha_deeds
    where game_id=p_game_id and city_id=v_tile.city_id and position_no=v_tile.position_no) then
    raise exception 'این دکان پیش‌تر صاحب دارد';
  end if;

  v_price:=app_private.kaykha_deed_price(v_tile.city_id,p_property_level);
  v_level_label:=case p_property_level
    when 'stall' then 'دکان'
    when 'merchant_house' then 'حجره'
    when 'caravanserai' then 'کاروانسرا'
    else null
  end;
  if v_price is null or v_level_label is null then raise exception 'سطح ملک نامعتبر است'; end if;

  update public.kaykha_members set coins=coins-v_price
    where id=v_member_id and coins>=v_price;
  if not found then raise exception 'سکهٔ کافی برای این سند ندارید؛ قیمت این شهر % سکه است',v_price; end if;

  insert into public.kaykha_deeds
    (game_id,city_id,owner_member_id,property_level,resource_key,position_no,zone_key,visibility,is_protected)
  values
    (p_game_id,v_tile.city_id,v_member_id,p_property_level,v_tile.resource_key,v_tile.position_no,
      v_tile.zone_key,v_tile.visibility,v_tile.zone_key='royal_square')
  returning id into v_deed_id;
  update public.kaykha_market_tiles set owner_member_id=v_member_id
    where game_id=p_game_id and city_id=v_tile.city_id and position_no=v_tile.position_no;

  if v_tile.zone_key='undercity' then
    for v_zik_member in
      select id from public.kaykha_members
      where game_id=p_game_id and house_id='زیک' and id<>v_member_id and not is_ai
    loop
      update public.kaykha_members set coins=least(999,coins+1) where id=v_zik_member;
    end loop;
  end if;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,v_game.round_no,'economy',
    v_level_label||' شهر '||v_tile.city_id||' با قیمت '||v_price||' سکه مهر شد.'||
    case when v_tile.zone_key='undercity' then ' شبکه‌های بازار سیاه نیز سهم خود را گرفتند.' else '' end);
  return v_deed_id;
end;
$$;

revoke all on function public.get_kaykha_market(uuid,text) from public, anon;
grant execute on function public.get_kaykha_market(uuid,text) to authenticated;
revoke all on function public.buy_kaykha_deed(uuid,text,smallint,text) from public, anon;
grant execute on function public.buy_kaykha_deed(uuid,text,smallint,text) to authenticated;

-- Existing active games receive the broader assortment only on unsold tiles.
select app_private.seed_kaykha_market(g.id)
from public.kaykha_games g
where g.status in ('lobby','active');
