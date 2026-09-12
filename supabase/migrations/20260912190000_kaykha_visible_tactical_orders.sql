-- Phase five visible tactical orders: spy creates private intel; revolt creates visible instability.
create table if not exists app_private.kaykha_intel (
  id bigint generated always as identity primary key,
  game_id uuid not null,
  member_id uuid not null,
  round_no integer not null,
  target_territory_id text not null,
  target_member_id uuid,
  intel jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kaykha_intel_member_round_idx
  on app_private.kaykha_intel(game_id, member_id, round_no desc, created_at desc);

alter table app_private.kaykha_intel enable row level security;
revoke all on table app_private.kaykha_intel from public, anon, authenticated;

create or replace function public.get_kaykha_intel(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_member_id uuid;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'ورود به تالار لازم است';
  end if;
  select id into v_member_id
  from public.kaykha_members
  where game_id=p_game_id and user_id=auth.uid() and not is_ai
  limit 1;
  if v_member_id is null then
    raise exception 'این فرمانده عضو تالار نیست';
  end if;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.round_no desc, i.created_at desc),'[]'::jsonb)
    into v_result
  from app_private.kaykha_intel i
  where i.game_id=p_game_id and i.member_id=v_member_id;
  return v_result;
end;
$function$;

revoke all on function public.get_kaykha_intel(uuid) from public, anon;
grant execute on function public.get_kaykha_intel(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.resolve_kaykha_round(p_game_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'app_private', 'pg_temp'
AS $function$
#variable_conflict use_column
declare
  v_game public.kaykha_games%rowtype;
  v_member_count integer; v_order_count integer;
  v_power integer; v_defense integer; v_bonus integer; v_outcomes integer:=0;
  v_defender uuid; v_target_economy integer; v_sanctuary integer; v_loot integer;
  v_forced boolean; v_execution boolean; v_suren_first boolean; v_murshid boolean;
  o record; e record; v_event_id bigint; v_event_body text; v_intel jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id<>(select auth.uid()) then raise exception 'فقط میزبان می‌تواند سپیده‌دم را اجرا کند'; end if;
  if v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'فرمان‌ها هنوز آمادهٔ آشکارسازی نیستند'; end if;
  select count(*) into v_member_count from public.kaykha_members where game_id=p_game_id and not is_ai;
  select count(*) into v_order_count from app_private.kaykha_secret_orders
    where game_id=p_game_id and round_no=v_game.round_no;
  if v_order_count<v_member_count then raise exception 'همهٔ فرماندهان هنوز فرمان مهر نکرده‌اند'; end if;

  -- Shahanshah decrees resolve before any ordinary order.
  for e in
    select * from app_private.kaykha_effect_states
    where game_id=p_game_id and round_no=v_game.round_no and effect_key='family.hakh_surrender'
      and consumed_at is null
    order by created_at,id
  loop
    update public.kaykha_territories
      set owner_member_id=e.source_member_id,strength=greatest(1,least(strength,2)),is_in_mutiny=false,
          illusion_strength=0,revision=revision+1
      where game_id=p_game_id and territory_id=e.target_territory_id and owner_member_id is distinct from e.source_member_id;
    if found then
      perform app_private.record_kaykha_effect(
        p_game_id,v_game.round_no,'family.هخامنشیان',e.source_member_id,e.target_member_id,e.target_territory_id,
        jsonb_build_object('effect','surrender_without_battle')
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'family','فرمان شاهنشاه خوانده شد؛ '||e.target_territory_id||' بی‌آنکه نبردی رخ دهد تسلیم شد.');
      v_outcomes:=v_outcomes+1;
    end if;
    update app_private.kaykha_effect_states set consumed_at=now() where id=e.id;
  end loop;

  for o in
    select so.*,m.house_id from app_private.kaykha_secret_orders so
    join public.kaykha_members m on m.id=so.member_id
    where so.game_id=p_game_id and so.round_no=v_game.round_no
      and so.order_type in ('defend','support','caravan','trade','raid','sabotage','spy','spell','revolt')
    order by so.order_id
  loop
    if o.order_type='defend' then
      if exists(
        select 1 from public.kaykha_territories
        where game_id=p_game_id and territory_id=o.origin_territory_id and defense_locked_round=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'shadow','ترس بر پادگانِ '||o.origin_territory_id||' افتاد؛ فرمان دفاع اجرا نشد.');
      else
        update public.kaykha_territories set strength=least(99,strength+2),revision=revision+1
          where game_id=p_game_id and territory_id=o.origin_territory_id and owner_member_id=o.member_id;
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','پادگان‌های '||o.origin_territory_id||' آماده شدند؛ دیوار دفاعی تقویت شد.');
      end if;
      v_outcomes:=v_outcomes+1;

    elsif o.order_type='support' then
      v_bonus:=case when o.house_id='مهران' then 2 else 1 end;
      update public.kaykha_territories set strength=least(99,strength+v_bonus),revision=revision+1
        where game_id=p_game_id and territory_id=o.target_territory_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'support','پشتیبانی به '||o.target_territory_id||' رسید؛ قدرت آن '||v_bonus||' افزایش یافت.');
      v_outcomes:=v_outcomes+1;

    elsif o.order_type='caravan' then
      if exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.target_territory_id
          and e.effect_key in ('class.hoard_blockade','family.vraz_scorched','class.execution_scorch')
          and e.consumed_at is null and e.round_no<=v_game.round_no and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'market','کاروان به '||o.target_territory_id||' نرسید؛ راه بازار بسته بود.');
      else
        update public.kaykha_territories set economy=least(99,economy+1),revision=revision+1
          where game_id=p_game_id and territory_id=o.target_territory_id;
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'market','کاروان به '||o.target_territory_id||' رسید؛ رونق بازار افزایش یافت.');
      end if;
      v_outcomes:=v_outcomes+1;

    elsif o.order_type='trade' then
      if exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.origin_territory_id
          and e.effect_key in ('family.vraz_scorched','class.execution_scorch')
          and e.consumed_at is null and e.round_no<=v_game.round_no and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'market','دفاتر این شهر سوخته‌اند؛ تجارتِ این راند ثمری نداشت.');
      else
        update public.kaykha_territories set economy=least(99,economy+1),revision=revision+1
          where game_id=p_game_id and territory_id=o.origin_territory_id and owner_member_id=o.member_id;
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'market','سند تجاری در '||o.origin_territory_id||' ثبت شد؛ اقتصاد شهر رونق گرفت.');
      end if;
      v_outcomes:=v_outcomes+1;

    elsif o.order_type in ('raid','sabotage') then
      if exists(
        select 1 from public.kaykha_territories
        where game_id=p_game_id and territory_id=o.target_territory_id and sanctuary_until_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'diplomacy','بستِ '||o.target_territory_id||' برقرار بود؛ دستِ غارت به آن نرسید.');
      elsif exists(
        select 1 from public.kaykha_territories t join public.kaykha_members m on m.id=t.owner_member_id
        where t.game_id=p_game_id and t.territory_id=o.target_territory_id and m.house_id='باوندیان'
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','اقتصاد خودکفای باوندیان، راه غارت و خرابکاری را بست.');
      elsif exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.target_territory_id and e.effect_key='class.counterspy'
          and e.consumed_at is null and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','سایه‌بان، دستِ خرابکار را پیش از رسیدن به بازار شناخت.');
      else
        update public.kaykha_deeds set is_raided=true
        where id=(
          select d.id from public.kaykha_deeds d
          where d.game_id=p_game_id and d.city_id=o.target_territory_id and not d.is_protected and not d.is_raided
            and ((o.order_type='raid' and d.zone_key='gates') or (o.order_type='sabotage' and d.zone_key='guild_alleys'))
          order by d.id limit 1
        );
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'danger',
          case when o.order_type='raid' then 'غبار غارت از گمرکِ '||o.target_territory_id||' برخاست.'
            else 'آتشِ خرابکاری در راستهٔ اصنافِ '||o.target_territory_id||' افتاد.' end
        );
      end if;
      v_outcomes:=v_outcomes+1;

    elsif o.order_type='spy' then
      if exists(
        select 1 from public.kaykha_territories t join public.kaykha_members m on m.id=t.owner_member_id
        where t.game_id=p_game_id and t.territory_id=o.target_territory_id and m.house_id in ('اسپینداد','باوندیان')
      ) or exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.target_territory_id and e.effect_key='class.counterspy'
          and e.consumed_at is null and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','ضدجاسوسیِ شهر هدف شبکه را سوزاند؛ هیچ پرونده‌ای به فرمانده نرسید.');
      else
        select t.owner_member_id,
          jsonb_build_object(
            'territory_id',t.territory_id,
            'owner_member_id',t.owner_member_id,
            'strength',t.strength,
            'economy',t.economy,
            'influence',t.influence,
            'legitimacy',t.legitimacy,
            'poverty',t.poverty,
            'is_in_mutiny',t.is_in_mutiny,
            'sealed_order',coalesce((
              select so.order_type
              from app_private.kaykha_secret_orders so
              where so.game_id=p_game_id and so.member_id=t.owner_member_id
                and so.round_no=v_game.round_no
              order by so.locked_at desc
              limit 1
            ),'نامشخص')
          )
        into v_defender,v_intel
        from public.kaykha_territories t
        where t.game_id=p_game_id and t.territory_id=o.target_territory_id;

        if v_defender is null then
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'warning','جاسوسی انجام نشد؛ شهر هدف در نقشه پیدا نشد.');
        else
          insert into app_private.kaykha_intel(game_id,member_id,round_no,target_territory_id,target_member_id,intel)
          values(p_game_id,o.member_id,v_game.round_no,o.target_territory_id,v_defender,v_intel);
          update public.kaykha_members
          set influence_tokens=least(999,coalesce(influence_tokens,0)+1)
          where id=o.member_id;
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'shadow','جاسوسی از شهر هدف موفق شد؛ پرونده در دفتر خصوصی فرمانده ثبت شد و یک نشان نفوذ به دست آمد.');
        end if;
      end if;
      v_outcomes:=v_outcomes+1;
    elsif o.order_type='revolt' then
      if exists(
        select 1 from public.kaykha_territories t join public.kaykha_members m on m.id=t.owner_member_id
        where t.game_id=p_game_id and t.territory_id=o.target_territory_id and m.house_id in ('کارن','اسپینداد')
      ) or exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.target_territory_id and e.effect_key in ('class.counterspy','defense.revolt')
          and e.consumed_at is null and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','نگهبانان شهر شورش را پیش از شعله‌ور شدن خاموش کردند؛ قدرت و مشروعیت هدف حفظ شد.');
      else
        select owner_member_id into v_defender
        from public.kaykha_territories
        where game_id=p_game_id and territory_id=o.target_territory_id;

        if v_defender is null then
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'warning','شورش انجام نشد؛ شهر هدف در نقشه پیدا نشد.');
        elsif v_defender=o.member_id then
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'warning','شورش روی شهر خودی اثر نکرد؛ هدف این فرمان باید شهر رقیب باشد.');
        else
          update public.kaykha_territories
          set strength=greatest(1,strength-1),
              economy=greatest(0,economy-2),
              legitimacy=greatest(0,legitimacy-10),
              poverty=least(100,poverty+10),
              is_in_mutiny=true,
              mutiny_round=v_game.round_no,
              revision=revision+1
          where game_id=p_game_id and territory_id=o.target_territory_id;

          update public.kaykha_members
          set influence_tokens=least(999,coalesce(influence_tokens,0)+1)
          where id=o.member_id;

          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'warning','شورش در شهر هدف شعله‌ور شد؛ قدرت دفاعی ۱، اقتصاد ۲ و مشروعیت ۱۰ واحد کاهش یافت و یک نشان نفوذ به فرمانده شورش رسید.');
        end if;
      end if;
      v_outcomes:=v_outcomes+1;
    elsif o.order_type='spell' then
      if exists(
        select 1 from public.kaykha_territories t join public.kaykha_members m on m.id=t.owner_member_id
        where t.game_id=p_game_id and t.territory_id=o.target_territory_id and m.house_id in ('اسپینداد','باوندیان')
      ) or exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=o.target_territory_id and e.effect_key='class.counterspy'
          and e.consumed_at is null and e.expires_round>=v_game.round_no
      ) then
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense','نگهبانان پنهان شهر، وهم را پیش از اثر خاموش کردند.');
      else
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'shadow','طلسم در دفتر پنهان ثبت شد و موجی از وهم در شهر هدف افتاد.');
      end if;
      v_outcomes:=v_outcomes+1;
    end if;
  end loop;

  for o in
    select so.*,m.house_id from app_private.kaykha_secret_orders so
    join public.kaykha_members m on m.id=so.member_id
    where so.game_id=p_game_id and so.round_no=v_game.round_no and so.order_type='attack'
    order by so.order_id
  loop
    select owner_member_id,strength+coalesce(illusion_strength,0),economy,sanctuary_until_round
      into v_defender,v_defense,v_target_economy,v_sanctuary
      from public.kaykha_territories where game_id=p_game_id and territory_id=o.target_territory_id;
    if v_sanctuary>=v_game.round_no then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'diplomacy','بستِ '||o.target_territory_id||' برقرار بود؛ حمله بی‌آنکه خون بریزد برگشت.');
      v_outcomes:=v_outcomes+1;
      continue;
    end if;
    if exists(
      select 1 from public.kaykha_contracts c
      where c.game_id=p_game_id and c.contract_type='blood_debt' and c.status='active'
        and c.creator_member_id=v_defender and c.counterparty_member_id=o.member_id
    ) then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'diplomacy','خون‌بهای ثبت‌شده، شمشیر یک فرمانده را پیش از حمله بست.');
      v_outcomes:=v_outcomes+1;
      continue;
    end if;

    select exists(
      select 1 from app_private.kaykha_effect_states e
      where e.game_id=p_game_id and e.effect_key='family.سورن' and e.source_member_id=o.member_id
        and e.consumed_at is null
    ) into v_suren_first;
    select strength+case when o.house_id='سورن' and v_suren_first then 2 else 0 end into v_power
      from public.kaykha_territories
      where game_id=p_game_id and territory_id=o.origin_territory_id and owner_member_id=o.member_id;
    if v_power is null or v_defense is null then continue; end if;

    select exists(
      select 1 from app_private.kaykha_effect_states e
      where e.game_id=p_game_id and e.source_member_id=o.member_id and e.target_territory_id=o.target_territory_id
        and e.effect_key in ('family.vraz_scorched','class.execution_march')
        and e.consumed_at is null and e.round_no<=v_game.round_no and e.expires_round>=v_game.round_no
    ) into v_forced;
    select exists(
      select 1 from app_private.kaykha_effect_states e
      where e.game_id=p_game_id and e.source_member_id=o.member_id and e.target_territory_id=o.target_territory_id
        and e.effect_key='class.execution_march' and e.consumed_at is null and e.expires_round>=v_game.round_no
    ) into v_execution;
    select exists(
      select 1 from app_private.kaykha_effect_states e
      where e.game_id=p_game_id and e.source_member_id=v_defender and e.target_territory_id=o.target_territory_id
        and e.effect_key='class.murshid' and e.consumed_at is null and e.expires_round>=v_game.round_no
    ) into v_murshid;
    if v_murshid then v_defense:=v_defense+2; end if;

    if v_forced or v_power>v_defense then
      update public.kaykha_territories
        set owner_member_id=o.member_id,
          strength=case when v_forced then greatest(1,v_power-v_defense) else greatest(1,v_power-v_defense) end,
          economy=case when v_execution then 0 else economy end,
          is_in_mutiny=false,illusion_strength=0,revision=revision+1
        where game_id=p_game_id and territory_id=o.target_territory_id;
      if not v_execution then
        update public.kaykha_territories set strength=greatest(1,strength-1),revision=revision+1
          where game_id=p_game_id and territory_id=o.origin_territory_id and owner_member_id=o.member_id;
      end if;
      if o.house_id='سورن' then
        select least(20,greatest(1,coalesce(sum(mt.base_income * case d.property_level when 'stall' then 1 when 'merchant_house' then 2 else 3 end),0)))::integer
          into v_loot
          from public.kaykha_deeds d join public.kaykha_market_tiles mt
            on mt.game_id=d.game_id and mt.city_id=d.city_id and mt.position_no=d.position_no
          where d.game_id=p_game_id and d.city_id=o.target_territory_id and not d.is_raided;
        update public.kaykha_members set coins=least(999,coins+v_loot) where id=o.member_id;
        perform app_private.record_kaykha_effect(
          p_game_id,v_game.round_no,'family.سورن',o.member_id,v_defender,o.target_territory_id,
          jsonb_build_object('coins',v_loot,'first_attack',v_suren_first)
        );
      end if;
      if v_execution then
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.execution_scorch',o.member_id,v_defender,o.target_territory_id,
          v_game.round_no+2,'{}'
        );
        update app_private.kaykha_effect_states set consumed_at=now()
          where game_id=p_game_id and source_member_id=o.member_id and target_territory_id=o.target_territory_id
            and effect_key='class.execution_march' and consumed_at is null;
      end if;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'victory',
        o.origin_territory_id||' با قدرت '||v_power||'، '||o.target_territory_id||' را فتح کرد.'||
        case when v_forced then ' این فتح با فرمانی بی‌دفاع قطعی شد.' else '' end||
        case when o.house_id='سورن' then ' سواران سورن '||v_loot||' سکه از سود شهر برداشتند.' else '' end
      );
    else
      if o.house_id<>'اشکانیان' then
        update public.kaykha_territories set strength=greatest(1,strength-1),revision=revision+1
          where game_id=p_game_id and territory_id=o.origin_territory_id and owner_member_id=o.member_id;
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defeat',
          'حمله از '||o.origin_territory_id||' به '||o.target_territory_id||
          ' با قدرت '||v_power||' در برابر دفاع '||v_defense||' متوقف شد.');
      else
        perform app_private.record_kaykha_effect(
          p_game_id,v_game.round_no,'family.اشکانیان',o.member_id,v_defender,o.target_territory_id,
          jsonb_build_object('effect','parthian-return','attack_power',v_power,'defense',v_defense)
        );
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'defense',
          'سواران اشکانی پس از حملهٔ ناموفق به '||o.target_territory_id||' بی‌تلفات بازگشتند.');
      end if;
    end if;

    if o.house_id='سورن' and v_suren_first then
      insert into app_private.kaykha_effect_states(
        game_id,round_no,effect_key,source_member_id,expires_round,payload
      ) values(p_game_id,v_game.round_no,'family.سورن',o.member_id,9999,jsonb_build_object('first_attack_used',true));
    end if;
    v_outcomes:=v_outcomes+1;
  end loop;

  v_outcomes:=v_outcomes+app_private.resolve_kaykha_economy_and_contracts(p_game_id,v_game.round_no);

  -- Labyrinth changes a visible whisper, while the original action remains in private audit.
  for e in
    select * from app_private.kaykha_effect_states
    where game_id=p_game_id and round_no=v_game.round_no and effect_key='class.labyrinth' and consumed_at is null
  loop
    update public.kaykha_whispers w
      set body='[نجوای ناشناس: متن در هزارتوی خبر مخدوش شد.]'
      where w.id=(
        select s.whisper_id from app_private.kaykha_whisper_senders s
        join public.kaykha_whispers x on x.id=s.whisper_id
        where x.game_id=p_game_id and s.sender_member_id=e.target_member_id
        order by x.created_at desc limit 1
      );
    if found then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'shadow','هزارتو، یک نجوا را پیش از رسیدن به گوش دربار تحریف کرد.');
    end if;
    update app_private.kaykha_effect_states set consumed_at=now() where id=e.id;
  end loop;

  for e in
    select * from app_private.kaykha_effect_states
    where game_id=p_game_id and round_no=v_game.round_no and effect_key='class.log_forge' and consumed_at is null
  loop
    select id,body into v_event_id,v_event_body from public.kaykha_events
      where game_id=p_game_id and round_no=v_game.round_no
      order by id asc limit 1;
    if v_event_id is not null then
      update public.kaykha_events
        set tone='shadow',body='یک خط از دفتر وقایع در جوهرِ تحریف‌گر محو و با روایتی مبهم جایگزین شد.'
        where id=v_event_id;
      perform app_private.record_kaykha_effect(
        p_game_id,v_game.round_no,'persona.پرده‌خوان.shadow',e.source_member_id,e.target_member_id,e.target_territory_id,
        jsonb_build_object('event_id',v_event_id,'original_body',v_event_body)
      );
    end if;
    update app_private.kaykha_effect_states set consumed_at=now() where id=e.id;
  end loop;

  update public.kaykha_games
    set phase='negotiation',round_no=round_no+1,updated_at=now()
    where id=p_game_id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,v_game.round_no,'neutral','سپیده‌دم پایان یافت؛ بازار و دربار برای راند بعد گشوده شد.');
  return jsonb_build_object(
    'resolved_round',v_game.round_no,'next_round',v_game.round_no+1,'outcomes',v_outcomes,'next_phase','negotiation'
  );
end;
$function$
