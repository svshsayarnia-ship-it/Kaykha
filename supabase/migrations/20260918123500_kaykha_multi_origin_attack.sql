-- Kaykha coordinated multi-origin attacks, 2026-09-18.
-- Keeps the one-order-per-member tempo model while allowing an attack order to commit multiple owned cities.

-- Subterfuge-inspired coordinated attack: one sealed order may commit several owned cities to one target.
create or replace function app_private.kaykha_attack_origin_ids(
  p_game_id uuid,
  p_member_id uuid,
  p_primary_origin text,
  p_payload jsonb
) returns text[]
language sql
stable
security definer
set search_path=public,app_private,pg_temp
as $$
  with raw as (
    select trim(p_primary_origin) as origin_id, 0::bigint as ord
    union all
    select trim(x.value), x.ord
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'attack_origin_ids')='array'
          then p_payload->'attack_origin_ids'
        else '[]'::jsonb
      end
    ) with ordinality as x(value,ord)
  ),
  dedup as (
    select origin_id,min(ord) as ord
    from raw
    where origin_id is not null and origin_id<>''
    group by origin_id
  ),
  valid as (
    select d.origin_id,d.ord
    from dedup d
    join public.kaykha_territories t
      on t.game_id=p_game_id
     and t.territory_id=d.origin_id
     and t.owner_member_id=p_member_id
    order by d.ord
    limit 16
  )
  select coalesce(array_agg(origin_id order by ord),array[]::text[]) from valid;
$$;

create or replace function app_private.kaykha_canonicalize_multi_attack()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_origins text[];
begin
  if new.order_type='attack' then
    v_origins:=app_private.kaykha_attack_origin_ids(new.game_id,new.member_id,new.origin_territory_id,new.payload);
    if coalesce(array_length(v_origins,1),0)=0 then
      raise exception 'حداقل یک شهر خودی برای حمله لازم است';
    end if;
    new.origin_territory_id:=v_origins[1];
    new.payload:=jsonb_set(coalesce(new.payload,'{}'::jsonb),'{attack_origin_ids}',to_jsonb(v_origins),true)
      || jsonb_build_object('attack_plan_version',1);
  else
    new.payload:=coalesce(new.payload,'{}'::jsonb)-'attack_origin_ids'-'attack_plan_version';
  end if;
  return new;
end;
$$;

drop trigger if exists kaykha_multi_attack_origins on app_private.kaykha_secret_orders;
create trigger kaykha_multi_attack_origins
before insert or update of order_type,origin_territory_id,target_territory_id,payload,member_id
on app_private.kaykha_secret_orders
for each row execute function app_private.kaykha_canonicalize_multi_attack();


CREATE OR REPLACE FUNCTION public.get_kaykha_command_preview(p_game_id uuid, p_order_type text, p_origin_territory_id text, p_target_territory_id text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'app_private', 'pg_temp'
AS $function$
declare
  v_me uuid;
  v_house text;
  v_target_owner uuid;
  v_preview jsonb;
  v_attack integer;
  v_visible_defense integer;
  v_origins text[];
  v_origin_count integer:=0;
  v_suren_first boolean:=false;
  v_failure_attrition integer:=1;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;

  select id,house_id into v_me,v_house
  from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if v_me is null then raise exception 'تو عضو این تالار نیستی'; end if;

  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=p_game_id and territory_id=trim(p_target_territory_id);
  if not found then raise exception 'هدف فرمان روی نقشه وجود ندارد'; end if;

  if p_order_type in ('attack','raid','sabotage') and v_target_owner=v_me then
    raise exception 'فرمان خصمانه را نمی‌توان روی قلمرو خودی پیش‌نمایش کرد';
  end if;
  if p_order_type in ('spy','revolt','spell') and (v_target_owner is null or v_target_owner=v_me) then
    raise exception 'این فرمان باید قلمرو زندهٔ یکی از رقبا را هدف بگیرد';
  end if;

  v_preview:=public.get_kaykha_command_preview_legacy_p0(
    p_game_id,p_order_type,p_origin_territory_id,p_target_territory_id,p_payload
  );

  if p_order_type='attack' then
    v_origins:=app_private.kaykha_attack_origin_ids(p_game_id,v_me,p_origin_territory_id,p_payload);
    v_origin_count:=coalesce(array_length(v_origins,1),0);
    if v_origin_count=0 then raise exception 'حداقل یک شهر خودی برای حمله انتخاب کن'; end if;

    select coalesce(sum(strength),0)::integer into v_attack
    from public.kaykha_territories
    where game_id=p_game_id and owner_member_id=v_me and territory_id=any(v_origins);

    select strength into v_visible_defense
    from public.kaykha_territories
    where game_id=p_game_id and territory_id=trim(p_target_territory_id);

    if v_house='سورن' then
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.effect_key='family.سورن' and e.source_member_id=v_me
          and e.consumed_at is null and coalesce((e.payload->>'first_attack_ready')::boolean,true)
      ) into v_suren_first;
      if v_suren_first then v_attack:=v_attack+2; end if;
    end if;

    if v_house='اشکانیان' then v_failure_attrition:=0; end if;

    v_preview:=v_preview||jsonb_build_object(
      'combat',jsonb_build_object(
        'model','deterministic_visible_snapshot',
        'origin_ids',to_jsonb(v_origins),
        'origin_count',v_origin_count,
        'combined_attack',v_origin_count>1,
        'visible_attack_power',v_attack,
        'visible_defense_power',v_visible_defense,
        'visible_conquest_estimate_pct',case when v_attack>v_visible_defense then 100 else 0 end,
        'success_rule','در نبرد عادی، قدرت حمله باید از دفاع بیشتر باشد؛ برابری برای فتح کافی نیست.',
        'normal_failure_attrition',v_failure_attrition,
        'attrition_rule',case when v_house='اشکانیان'
          then 'در شکست عادی، اشکانیان از نبرد بی‌تلفات بازمی‌گردند.'
          else 'در حملهٔ عادی، مبدأ پس از درگیری ۱ قدرت از دست می‌دهد؛ برخی اثرهای ویژه می‌توانند این قاعده را تغییر دهند.' end,
        'simultaneous_tie_rule','اگر چند حمله هم‌زمان از دفاع عبور کنند، حاشیهٔ قدرت بیشتر برنده است؛ سپس نوبت ابتکار چرخشی تعیین‌کننده می‌شود.',
        'hidden_modifiers_notice','این درصد فقط بر اساس اطلاعات آشکار است. وهم، مرشد، بست، پیمان خون و اثرهای پنهان مدافع عمداً افشا نمی‌شوند.'
      )
    );
  end if;

  return v_preview;
end;
$function$;

CREATE OR REPLACE FUNCTION app_private.resolve_kaykha_attacks_snapshot(p_game_id uuid, p_round integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'app_private', 'pg_temp'
AS $function$
declare
  r record;
  w record;
  v_member_count integer:=1;
  v_power integer;
  v_defense integer;
  v_origin_ids text[];
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
    origin_ids text[] not null,
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
    v_origin_ids:=app_private.kaykha_attack_origin_ids(p_game_id,r.member_id,r.origin_territory_id,r.payload);
    v_power:=null; v_defense:=null; v_defender:=null; v_sanctuary:=null;
    v_forced:=false; v_execution:=false; v_suren_first:=false; v_murshid:=false;
    v_block:=null; v_success:=false; v_margin:=0;

    select t.owner_member_id,t.strength+coalesce(t.illusion_strength,0),t.sanctuary_until_round
      into v_defender,v_defense,v_sanctuary
    from public.kaykha_territories t
    where t.game_id=p_game_id and t.territory_id=r.target_territory_id;

    select coalesce(sum(t.strength),0)::integer into v_power
    from public.kaykha_territories t
    where t.game_id=p_game_id and t.owner_member_id=r.member_id and t.territory_id=any(v_origin_ids);

    if coalesce(array_length(v_origin_ids,1),0)=0 or v_power<=0 or v_defense is null then
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

    insert into kaykha_attack_work(order_id,member_id,house_id,seat_no,origin_id,origin_ids,target_id,defender_id,
      attack_power,defense_power,forced,execution,suren_first,blocked_reason,success,margin,initiative)
    values(r.order_id,r.member_id,r.house_id,r.seat_no,r.origin_territory_id,v_origin_ids,r.target_territory_id,v_defender,
      v_power,v_defense,v_forced,v_execution,(r.house_id='سورن' and v_suren_first),v_block,v_success,v_margin,v_initiative);
  end loop;

  update kaykha_attack_work as aw
  set winner=true
  where aw.success and aw.blocked_reason is null
    and aw.order_id=(
      select x.order_id from kaykha_attack_work x
      where x.target_id=aw.target_id and x.success and x.blocked_reason is null
      order by x.margin desc,x.initiative asc,x.order_id asc
      limit 1
    );

  -- Attrition is applied from the frozen attack snapshot before any target ownership changes.
  for w in select * from kaykha_attack_work where blocked_reason is null order by initiative,order_id loop
    if not w.execution and not (w.house_id='اشکانیان' and not w.success) then
      update public.kaykha_territories
      set strength=greatest(1,strength-1),revision=revision+1
      where game_id=p_game_id and territory_id=any(w.origin_ids) and owner_member_id=w.member_id;
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
        values(p_game_id,p_round,'defeat','حمله از '||coalesce(array_to_string(w.origin_ids,' + '),w.origin_id)||' به '||w.target_id||' با قدرت '||w.attack_power||' در برابر دفاع '||w.defense_power||' متوقف شد.');
      end if;
    elsif not w.winner then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'warning','حملهٔ '||coalesce(array_to_string(w.origin_ids,' + '),w.origin_id)||' به '||w.target_id||' از دفاع گذشت، اما در رقابت هم‌زمان با مهاجم نیرومندتر مالک شهر نشد.');
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
        coalesce(array_to_string(w.origin_ids,' + '),w.origin_id)||' با قدرت '||w.attack_power||' در برابر دفاع '||w.defense_power||'، '||w.target_id||' را فتح کرد.'||
        case when w.forced then ' فرمان ویژه، عبور از دفاع را تضمین کرد.' else '' end||
        case when w.house_id='سورن' then ' سواران سورن '||v_loot||' سکه از سود شهر برداشتند.' else '' end
      );
    end if;

    insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
    values(p_game_id,p_round,'order',w.order_id::text,'combat_result','{}'::jsonb,'{}'::jsonb,
      jsonb_build_object('origin',w.origin_id,'origins',to_jsonb(w.origin_ids),'origin_count',cardinality(w.origin_ids),'target',w.target_id,'attack',w.attack_power,'defense',w.defense_power,
        'blocked',w.blocked_reason,'success',w.success,'winner',w.winner,'margin',w.margin,'initiative',w.initiative,'snapshot',true));
  end loop;

  return v_count;
end;
$function$;

