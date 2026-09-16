create or replace function public.post_kaykha_bounty(
  p_game_id uuid,
  p_bounty_type text,
  p_target_territory_id text,
  p_reward_coins integer
) returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_member_id uuid;
  v_game public.kaykha_games%rowtype;
  v_id uuid;
  v_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'negotiation' then raise exception 'دیوار خون فقط در بازار مکاره باز است'; end if;
  select id into v_member_id from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;
  if p_bounty_type not in ('raid','sabotage','hunt','defend') or p_reward_coins not between 1 and 40 then raise exception 'جزئیات قرارداد خون نامعتبر است'; end if;
  select owner_member_id into v_owner from public.kaykha_territories where game_id=p_game_id and territory_id=trim(p_target_territory_id);
  if not found then raise exception 'هدف روی نقشه نیست'; end if;

  if p_bounty_type='hunt' and (v_owner is null or v_owner=v_member_id) then
    raise exception 'قرارداد شکار باید قلمرو زندهٔ یک رقیب را هدف بگیرد';
  elsif p_bounty_type='defend' and v_owner is distinct from v_member_id then
    raise exception 'قرارداد دفاع فقط برای یکی از شهرهای خودت ثبت می‌شود';
  elsif p_bounty_type='raid' and not exists(
    select 1 from public.kaykha_deeds d
    where d.game_id=p_game_id and d.city_id=trim(p_target_territory_id) and d.zone_key='gates' and not d.is_protected and not d.is_raided
  ) then
    raise exception 'در این شهر هدف قابل غارتی روی دروازه باقی نمانده است';
  elsif p_bounty_type='sabotage' and not exists(
    select 1 from public.kaykha_deeds d
    where d.game_id=p_game_id and d.city_id=trim(p_target_territory_id) and d.zone_key='guild_alleys' and not d.is_protected and not d.is_raided
  ) then
    raise exception 'در این شهر هدف قابل خرابکاری در راستهٔ اصناف باقی نمانده است';
  end if;

  update public.kaykha_members set coins=coins-p_reward_coins where id=v_member_id and coins>=p_reward_coins;
  if not found then raise exception 'سکهٔ کافی برای این قرارداد ندارید'; end if;
  insert into public.kaykha_bounties(game_id,bounty_type,target_territory_id,reward_coins)
  values(p_game_id,p_bounty_type,trim(p_target_territory_id),p_reward_coins) returning id into v_id;
  insert into app_private.kaykha_bounty_sources(bounty_id,creator_member_id) values(v_id,v_member_id);
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,v_game.round_no,'danger','قراردادی ناشناس روی دیوار خون می‌تپد؛ نوع مأموریت و هدف در دفتر قرارداد ثبت شده است.');
  return v_id;
end;
$function$;

grant execute on function public.post_kaykha_bounty(uuid,text,text,integer) to authenticated;

create or replace function app_private.resolve_kaykha_economy_and_contracts(p_game_id uuid,p_round integer)
returns integer
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_actions integer:=0;
  r record;
  v_due integer;
  v_paid boolean;
  v_territory text;
  v_fulfilled boolean;
begin
  for r in
    select d.owner_member_id,
      sum(mt.base_income*case d.property_level when 'stall' then 1 when 'merchant_house' then 2 else 3 end)::integer as income,
      count(*) filter(where d.zone_key='royal_square')::integer as royal_tiles
    from public.kaykha_deeds d
    join public.kaykha_market_tiles mt
      on mt.game_id=d.game_id and mt.city_id=d.city_id and mt.position_no=d.position_no
    where d.game_id=p_game_id and not d.is_raided
      and not exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=d.city_id
          and e.effect_key in ('family.vraz_scorched','class.execution_scorch','class.hoard_blockade')
          and e.consumed_at is null and e.round_no<=p_round and e.expires_round>=p_round
      )
    group by d.owner_member_id
  loop
    update public.kaykha_members
    set coins=least(999,coins+r.income),prestige=least(99,prestige+r.royal_tiles)
    where id=r.owner_member_id;
    v_actions:=v_actions+1;
  end loop;

  for r in
    select owner_member_id,city_id,resource_key
    from public.kaykha_deeds d
    where game_id=p_game_id and zone_key='guild_alleys' and not is_raided
      and not exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=d.city_id
          and e.effect_key in ('family.vraz_scorched','class.execution_scorch','class.hoard_blockade')
          and e.consumed_at is null and e.round_no<=p_round and e.expires_round>=p_round
      )
    group by owner_member_id,city_id,resource_key
    having count(*)>=4
  loop
    update public.kaykha_members set coins=least(999,coins+8) where id=r.owner_member_id;
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'economy','چهار نشان هم‌صنف به هم رسیدند؛ تیمچه سود انحصار خود را پرداخت کرد.');
    v_actions:=v_actions+1;
  end loop;

  for r in
    select * from public.kaykha_contracts
    where game_id=p_game_id and contract_type='debt' and status='active' and due_round<=p_round
    order by created_at,id
  loop
    v_due:=coalesce((r.terms->>'amount')::integer,0)+greatest(0,coalesce((r.terms->>'interest')::integer,0));
    update public.kaykha_members set coins=coins-v_due where id=r.counterparty_member_id and coins>=v_due;
    v_paid:=found;
    if v_paid then
      update public.kaykha_members set coins=least(999,coins+v_due) where id=r.creator_member_id;
      update public.kaykha_contracts set status='fulfilled',resolved_at=now() where id=r.id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'economy','موعد یک سفته رسید و بدهی بی‌صدا پرداخت شد.');
    else
      select territory_id into v_territory from public.kaykha_territories
      where game_id=p_game_id and owner_member_id=r.counterparty_member_id
      order by economy asc,territory_id asc limit 1 for update;
      if v_territory is not null then
        update public.kaykha_territories set owner_member_id=r.creator_member_id,revision=revision+1
        where game_id=p_game_id and territory_id=v_territory;
      end if;
      update public.kaykha_contracts set status='defaulted',resolved_at=now() where id=r.id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger',case when coalesce((r.terms->>'system_loan')::boolean,false)
        then 'وام درباریِ نهابد بی‌پاسخ ماند؛ مصادره به‌صورت خودکار اجرا شد.'
        else 'سفته‌ای بی‌پاسخ ماند؛ دفتر دربار مصادره را ثبت کرد.' end);
    end if;
    v_actions:=v_actions+1;
  end loop;

  for r in
    select b.*,s.creator_member_id
    from public.kaykha_bounties b
    join app_private.kaykha_bounty_sources s on s.bounty_id=b.id
    where b.game_id=p_game_id and b.status='claimed' and b.claimant_member_id is not null
    order by b.created_at,b.id
    for update of b
  loop
    v_fulfilled:=false;
    if r.bounty_type='hunt' then
      select exists(
        select 1 from public.kaykha_territories t
        where t.game_id=p_game_id and t.territory_id=r.target_territory_id and t.owner_member_id=r.claimant_member_id
      ) into v_fulfilled;
    elsif r.bounty_type='raid' then
      select exists(
        select 1 from app_private.kaykha_secret_orders o
        where o.game_id=p_game_id and o.round_no=p_round and o.member_id=r.claimant_member_id
          and o.order_type='raid' and o.target_territory_id=r.target_territory_id
      ) and exists(
        select 1 from public.kaykha_deeds d
        where d.game_id=p_game_id and d.city_id=r.target_territory_id and d.zone_key='gates' and d.is_raided
      ) into v_fulfilled;
    elsif r.bounty_type='sabotage' then
      select exists(
        select 1 from app_private.kaykha_secret_orders o
        where o.game_id=p_game_id and o.round_no=p_round and o.member_id=r.claimant_member_id
          and o.order_type='sabotage' and o.target_territory_id=r.target_territory_id
      ) and exists(
        select 1 from public.kaykha_deeds d
        where d.game_id=p_game_id and d.city_id=r.target_territory_id and d.zone_key='guild_alleys' and d.is_raided
      ) into v_fulfilled;
    elsif r.bounty_type='defend' then
      select exists(
        select 1 from app_private.kaykha_secret_orders o
        where o.game_id=p_game_id and o.round_no=p_round and o.member_id=r.claimant_member_id
          and o.order_type='support' and o.target_territory_id=r.target_territory_id
      ) and exists(
        select 1 from public.kaykha_territories t
        where t.game_id=p_game_id and t.territory_id=r.target_territory_id and t.owner_member_id=r.creator_member_id
      ) into v_fulfilled;
    end if;

    if v_fulfilled then
      update public.kaykha_members set coins=least(999,coins+r.reward_coins) where id=r.claimant_member_id;
      update public.kaykha_bounties set status='fulfilled',resolved_at=now() where id=r.id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','مأموریت دیوار خون مطابق نوع قرارداد انجام شد و کیسهٔ پاداش جابه‌جا شد.');
      v_actions:=v_actions+1;
    end if;
  end loop;

  update public.kaykha_territories t
  set is_in_mutiny=true,mutiny_round=p_round,owner_member_id=null,strength=1,revision=revision+1
  where t.game_id=p_game_id and t.owner_member_id is not null and t.economy<=0 and not t.is_in_mutiny
    and not exists(
      select 1 from public.kaykha_members m where m.id=t.owner_member_id and m.house_id='کارن'
    )
    and not exists(
      select 1 from app_private.kaykha_effect_states e
      where e.game_id=p_game_id and e.target_territory_id=t.territory_id
        and e.effect_key in ('family.vraz_scorched','class.execution_scorch')
        and e.round_no=p_round and e.consumed_at is null
    );
  if found then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'danger','شهری که با اقتصاد صفر وارد سپیده‌دم شده بود و بازسازی نشد، به شورش افتاد و کنترلش از دست رفت.');
    v_actions:=v_actions+1;
  end if;
  return v_actions;
end;
$function$;
