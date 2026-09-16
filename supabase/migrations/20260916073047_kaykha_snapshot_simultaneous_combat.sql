create or replace function app_private.resolve_kaykha_attacks_snapshot(p_game_id uuid,p_round integer)
returns integer
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $function$
declare
  r record;
  w record;
  v_member_count integer:=1;
  v_power integer;
  v_defense integer;
  v_defender uuid;
  v_sanctuary integer;
  v_forced boolean;
  v_execution boolean;
  v_suren_first boolean;
  v_murshid boolean;
  v_block text;
  v_success boolean;
  v_margin integer;
  v_initiative integer;
  v_loot integer;
  v_count integer:=0;
begin
  create temporary table if not exists kaykha_attack_work(
    order_id uuid primary key,
    member_id uuid not null,
    house_id text,
    seat_no integer,
    origin_id text not null,
    target_id text not null,
    defender_id uuid,
    attack_power integer,
    defense_power integer,
    forced boolean not null default false,
    execution boolean not null default false,
    suren_first boolean not null default false,
    blocked_reason text,
    success boolean not null default false,
    margin integer not null default 0,
    initiative integer not null default 0,
    winner boolean not null default false
  ) on commit drop;
  truncate table kaykha_attack_work;

  select greatest(1,count(*))::integer into v_member_count
  from public.kaykha_members where game_id=p_game_id;

  for r in
    select so.*,m.house_id,m.seat_no
    from app_private.kaykha_secret_orders so
    join public.kaykha_members m on m.id=so.member_id
    where so.game_id=p_game_id and so.round_no=p_round and so.order_type='attack'
    order by m.seat_no nulls last,so.order_id
  loop
    v_count:=v_count+1;
    v_power:=null; v_defense:=null; v_defender:=null; v_sanctuary:=null;
    v_forced:=false; v_execution:=false; v_suren_first:=false; v_murshid:=false;
    v_block:=null; v_success:=false; v_margin:=0;

    select t.owner_member_id,t.strength+coalesce(t.illusion_strength,0),t.sanctuary_until_round
      into v_defender,v_defense,v_sanctuary
    from public.kaykha_territories t
    where t.game_id=p_game_id and t.territory_id=r.target_territory_id;

    select t.strength into v_power
    from public.kaykha_territories t
    where t.game_id=p_game_id and t.territory_id=r.origin_territory_id and t.owner_member_id=r.member_id;

    if v_power is null or v_defense is null then
      v_block:='invalid_state';
    elsif v_defender=r.member_id then
      v_block:='self_target';
    elsif coalesce(v_sanctuary,0)>=p_round then
      v_block:='sanctuary';
    elsif exists(
      select 1 from public.kaykha_contracts c
      where c.game_id=p_game_id and c.contract_type='blood_debt' and c.status='active'
        and c.creator_member_id=v_defender and c.counterparty_member_id=r.member_id
    ) then
      v_block:='blood_debt';
    else
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.effect_key='family.سورن' and e.source_member_id=r.member_id
          and e.consumed_at is null and coalesce((e.payload->>'first_attack_ready')::boolean,true)
      ) into v_suren_first;
      if r.house_id='سورن' and v_suren_first then v_power:=v_power+2; end if;

      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.source_member_id=r.member_id and e.target_territory_id=r.target_territory_id
          and e.effect_key in ('family.vraz_scorched','class.execution_march')
          and e.consumed_at is null and e.round_no<=p_round and e.expires_round>=p_round
      ) into v_forced;
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.source_member_id=r.member_id and e.target_territory_id=r.target_territory_id
          and e.effect_key='class.execution_march' and e.consumed_at is null and e.expires_round>=p_round
      ) into v_execution;
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.source_member_id=v_defender and e.target_territory_id=r.target_territory_id
          and e.effect_key='class.murshid' and e.consumed_at is null and e.expires_round>=p_round
      ) into v_murshid;
      if v_murshid then v_defense:=v_defense+2; end if;

      v_success:=v_forced or v_power>v_defense;
      v_margin:=case when v_success then greatest(1,v_power-v_defense) else v_power-v_defense end;
    end if;

    v_initiative:=mod(
      coalesce(r.seat_no,1)-1-mod(greatest(0,p_round-1),v_member_count)+v_member_count*4,
      v_member_count
    );

    insert into kaykha_attack_work(order_id,member_id,house_id,seat_no,origin_id,target_id,defender_id,
      attack_power,defense_power,forced,execution,suren_first,blocked_reason,success,margin,initiative)
    values(r.order_id,r.member_id,r.house_id,r.seat_no,r.origin_territory_id,r.target_territory_id,v_defender,
      v_power,v_defense,v_forced,v_execution,(r.house_id='سورن' and v_suren_first),v_block,v_success,v_margin,v_initiative);
  end loop;

  update kaykha_attack_work w
  set winner=true
  where w.success and w.blocked_reason is null
    and w.order_id=(
      select x.order_id from kaykha_attack_work x
      where x.target_id=w.target_id and x.success and x.blocked_reason is null
      order by x.margin desc,x.initiative asc,x.order_id asc
      limit 1
    );

  for w in select * from kaykha_attack_work where blocked_reason is null order by initiative,order_id loop
    if not w.execution and not (w.house_id='اشکانیان' and not w.success) then
      update public.kaykha_territories
      set strength=greatest(1,strength-1),revision=revision+1
      where game_id=p_game_id and territory_id=w.origin_id and owner_member_id=w.member_id;
    end if;

    if w.suren_first then
      update app_private.kaykha_effect_states
      set consumed_at=coalesce(consumed_at,now())
      where game_id=p_game_id and source_member_id=w.member_id and effect_key='family.سورن' and consumed_at is null;
    end if;
  end loop;

  for w in select * from kaykha_attack_work order by initiative,order_id loop
    if w.blocked_reason='sanctuary' then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'diplomacy','بستِ '||w.target_id||' برقرار بود؛ حمله بدون درگیری بازگشت.');
    elsif w.blocked_reason='blood_debt' then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'diplomacy','خون‌بهای ثبت‌شده، شمشیر یک فرمانده را پیش از حمله بست.');
    elsif w.blocked_reason is not null then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'warning','حمله به دلیل وضعیت نامعتبر مبدأ یا هدف اجرا نشد.');
    elsif not w.success then
      if w.house_id='اشکانیان' then
        perform app_private.record_kaykha_effect(
          p_game_id,p_round,'family.اشکانیان',w.member_id,w.defender_id,w.target_id,
          jsonb_build_object('effect','parthian-return','attack_power',w.attack_power,'defense',w.defense_power,'snapshot',true)
        );
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,p_round,'defense','سواران اشکانی از نبردِ '||w.target_id||' بی‌تلفات بازگشتند.');
      else
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,p_round,'defeat','حمله از '||w.origin_id||' به '||w.target_id||' با قدرت '||w.attack_power||' در برابر دفاع '||w.defense_power||' متوقف شد.');
      end if;
    elsif not w.winner then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'warning','حملهٔ '||w.origin_id||' به '||w.target_id||' از دفاع گذشت، اما در رقابت هم‌زمان با مهاجم نیرومندتر مالک شهر نشد.');
    else
      update public.kaykha_territories
      set owner_member_id=w.member_id,
          strength=greatest(1,w.margin),
          economy=case when w.execution then 0 else economy end,
          is_in_mutiny=false,illusion_strength=0,revision=revision+1
      where game_id=p_game_id and territory_id=w.target_id;

      if w.house_id='سورن' then
        select least(20,greatest(1,coalesce(sum(mt.base_income * case d.property_level when 'stall' then 1 when 'merchant_house' then 2 else 3 end),0)))::integer
          into v_loot
        from public.kaykha_deeds d
        join public.kaykha_market_tiles mt on mt.game_id=d.game_id and mt.city_id=d.city_id and mt.position_no=d.position_no
        where d.game_id=p_game_id and d.city_id=w.target_id and not d.is_raided;
        update public.kaykha_members set coins=least(999,coins+v_loot) where id=w.member_id;
        perform app_private.record_kaykha_effect(
          p_game_id,p_round,'family.سورن',w.member_id,w.defender_id,w.target_id,
          jsonb_build_object('coins',v_loot,'first_attack',w.suren_first,'snapshot',true)
        );
      else
        v_loot:=0;
      end if;

      if w.execution then
        insert into app_private.kaykha_effect_states(game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload)
        values(p_game_id,p_round,'class.execution_scorch',w.member_id,w.defender_id,w.target_id,p_round+2,'{}');
        update app_private.kaykha_effect_states set consumed_at=now()
        where game_id=p_game_id and source_member_id=w.member_id and target_territory_id=w.target_id
          and effect_key='class.execution_march' and consumed_at is null;
      end if;

      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory',
        w.origin_id||' با قدرت '||w.attack_power||' در برابر دفاع '||w.defense_power||'، '||w.target_id||' را فتح کرد.'||
        case when w.forced then ' فرمان ویژه، عبور از دفاع را تضمین کرد.' else '' end||
        case when w.house_id='سورن' then ' سواران سورن '||v_loot||' سکه از سود شهر برداشتند.' else '' end
      );
    end if;

    insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
    values(p_game_id,p_round,'order',w.order_id::text,'combat_result','{}'::jsonb,'{}'::jsonb,
      jsonb_build_object('origin',w.origin_id,'target',w.target_id,'attack',w.attack_power,'defense',w.defense_power,
        'blocked',w.blocked_reason,'success',w.success,'winner',w.winner,'margin',w.margin,'initiative',w.initiative,'snapshot',true));
  end loop;

  return v_count;
end;
$function$;

do $patch$
declare
  v_def text;
  v_start integer;
  v_rel_end integer;
  v_end integer;
  v_marker text := E'  for o in\\n    select so.*,m.house_id from app_private.kaykha_secret_orders so\\n    join public.kaykha_members m on m.id=so.member_id\\n    where so.game_id=p_game_id and so.round_no=v_game.round_no and so.order_type=''attack''';
  v_end_marker text := '  v_outcomes:=v_outcomes+app_private.resolve_kaykha_economy_and_contracts';
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='resolve_kaykha_round_core'
  order by p.oid limit 1;

  v_start:=position(v_marker in v_def);
  if v_start=0 then raise exception 'attack resolver start marker not found'; end if;
  v_rel_end:=position(v_end_marker in substring(v_def from v_start));
  if v_rel_end=0 then raise exception 'attack resolver end marker not found'; end if;
  v_end:=v_start+v_rel_end-1;

  v_def:=substring(v_def from 1 for v_start-1)
    || E'  v_outcomes:=v_outcomes+app_private.resolve_kaykha_attacks_snapshot(p_game_id,v_game.round_no);\\n\\n'
    || substring(v_def from v_end);
  execute v_def;
end;
$patch$;
