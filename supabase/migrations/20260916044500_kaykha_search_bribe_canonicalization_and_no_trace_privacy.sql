-- Fix two verified search/privacy bugs:
-- 1) detection cover must use the server-authoritative bribe stored in _baha, never raw client payload.
-- 2) no-action and low-score searches must be indistinguishable.
-- Defense in depth: strip raw bribe_tokens from stored order payload.

create or replace function app_private.resolve_kaykha_searches(p_game_id uuid,p_round integer)
returns integer
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  s record;
  v_hits integer;
  v_signal integer;
  v_cover integer;
  v_counter integer;
  v_score integer;
  v_code text;
  v_payload jsonb;
  v_done integer:=0;
begin
  for s in
    select *
    from app_private.kaykha_searches
    where game_id=p_game_id and window_round=p_round and status='pending'
    order by created_at,id
    for update
  loop
    select
      count(*)::integer,
      coalesce(max(case so.order_type
        when 'attack' then 18
        when 'sabotage' then 16
        when 'spy' then 14
        when 'raid' then 13
        else 10 end),0),
      coalesce(max(case
        when coalesce((so.payload->>'masked')::boolean,false)
          then 14 + least(3,greatest(0,coalesce((so.payload->'_baha'->>'bribe_tokens')::integer,0))) * 6
        else 0 end),0)
    into v_hits,v_signal,v_cover
    from app_private.kaykha_secret_orders so
    where so.game_id=p_game_id
      and so.round_no=p_round
      and (so.origin_territory_id=s.territory_id or so.target_territory_id=s.territory_id)
      and so.member_id<>s.investigator_member_id
      and (s.action_family='any' or
        (s.action_family='military' and so.order_type in ('attack','defend','support','raid','revolt')) or
        (s.action_family='espionage' and so.order_type in ('spy','sabotage','spell')) or
        (s.action_family='economy' and so.order_type in ('trade','caravan','raid')) or
        (s.action_family='politics' and so.order_type in ('support','revolt')));

    select coalesce(sum(strength*case counter_type
      when 'blind_route' then 7
      when 'counter_intel' then 6
      else 3 end),0)::integer
    into v_counter
    from app_private.kaykha_counter_orders
    where game_id=p_game_id
      and round_no=p_round
      and territory_id=s.territory_id
      and member_id<>s.investigator_member_id;

    v_score:=s.tokens_burned*16+v_signal-v_cover-v_counter;

    if v_hits=0 or v_score<20 then
      v_code:='no_actionable_trace';
      v_payload:=jsonb_build_object(
        'certainty','none',
        'message','جست‌وجو به نتیجهٔ قابل اتکا نرسید؛ این ثابت نمی‌کند اتفاقی نیفتاده است.'
      );
    elsif v_score>=34 then
      v_code:='strong_trace';
      v_payload:=jsonb_build_object(
        'certainty','strong',
        'message','رد معناداری در محدودهٔ حدس تو پیدا شد.',
        'family',s.action_family,
        'round',p_round
      );
    else
      v_code:='weak_trace';
      v_payload:=jsonb_build_object(
        'certainty','weak',
        'message','نشانه‌ای مبهم پیدا شد؛ برای نسبت‌دادن آن به یک فرمانده کافی نیست.',
        'round',p_round
      );
    end if;

    update app_private.kaykha_searches
    set status='resolved',result_code=v_code,result_payload=v_payload,resolved_at=now()
    where id=s.id;
    v_done:=v_done+1;
  end loop;
  return v_done;
end
$$;
revoke all on function app_private.resolve_kaykha_searches(uuid,integer) from public,anon,authenticated;

create or replace function public.submit_kaykha_order(
  p_game_id uuid,
  p_order_type text,
  p_origin_territory_id text,
  p_target_territory_id text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_game public.kaykha_games%rowtype;
  v_member public.kaykha_members%rowtype;
  v_old app_private.kaykha_secret_orders%rowtype;
  v_order_id uuid;
  v_income integer;
  v_power integer;
  v_base integer;
  v_base_gold integer;
  v_gold integer;
  v_cred integer:=0;
  v_bribe integer:=0;
  v_masked boolean:=false;
  v_old_gold integer:=0;
  v_old_cred integer:=0;
  v_old_bribe integer:=0;
  v_payload jsonb;
  v_family text;
  v_repetition integer:=0;
  v_surcharge numeric:=0;
  v_exposure integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then
    raise exception 'نوع فرمان نامعتبر است';
  end if;

  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'اکنون امکان مهر کردن فرمان نیست'; end if;

  select * into v_member
  from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai
  for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=v_member.id) then
    raise exception 'مبدأ باید یکی از قلمروهای تو باشد';
  end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_target_territory_id) then
    raise exception 'هدف در این نقشه وجود ندارد';
  end if;
  if p_order_type='defend' and exists(
    select 1 from public.kaykha_territories
    where game_id=p_game_id and territory_id=p_origin_territory_id and defense_locked_round=v_game.round_no
  ) then
    raise exception 'وحشت در شهر، فرمان دفاع را برای این راند قفل کرده است';
  end if;

  select * into v_old
  from app_private.kaykha_secret_orders
  where game_id=p_game_id and member_id=v_member.id and round_no=v_game.round_no
  for update;
  if found then
    v_old_gold:=coalesce((v_old.payload->'_baha'->>'gold')::integer,0);
    v_old_cred:=coalesce((v_old.payload->'_baha'->>'credibility')::integer,0);
    v_old_bribe:=coalesce((v_old.payload->'_baha'->>'bribe_tokens')::integer,0);
  end if;

  select coalesce(sum(economy),0)::integer,coalesce(sum(strength+influence),0)::integer
  into v_income,v_power
  from public.kaykha_territories
  where game_id=p_game_id and owner_member_id=v_member.id;

  v_base:=app_private.kaykha_order_base_cost(p_order_type);
  v_base_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);
  v_family:=app_private.kaykha_action_family(p_order_type);
  v_repetition:=app_private.kaykha_strategy_repetition(p_game_id,v_member.id,v_game.round_no,v_family);
  v_surcharge:=app_private.kaykha_repetition_surcharge(v_repetition);
  v_exposure:=app_private.kaykha_repetition_exposure(v_repetition);
  v_gold:=least(999,ceil(v_base_gold*(1+v_surcharge))::integer);

  if p_order_type in ('spy','sabotage','raid','spell') then
    v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end;
  end if;

  v_masked:=case
    when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'masked')='boolean' then (p_payload->>'masked')::boolean
    else false
  end;
  if v_masked and p_order_type in ('spy','sabotage','raid') then
    v_bribe:=least(3,greatest(1,coalesce((p_payload->>'bribe_tokens')::integer,1)));
  end if;

  if v_member.coins+v_old_gold<v_gold then raise exception 'خزانه برای بهای این فرمان کافی نیست'; end if;
  if v_member.reputation_score+v_old_cred<v_cred then raise exception 'اعتبار سیاسی برای این فرمان کافی نیست'; end if;
  if v_member.bribe_tokens+v_old_bribe<v_bribe then raise exception 'مهر رشوه برای پوشاندن چاپار کافی نیست'; end if;

  update public.kaykha_members
  set coins=coins+v_old_gold-v_gold,
      reputation_score=least(100,reputation_score+v_old_cred)-v_cred,
      bribe_tokens=bribe_tokens+v_old_bribe-v_bribe
  where id=v_member.id;

  -- Only _baha.bribe_tokens is authoritative; never persist the raw client key.
  v_payload:=(coalesce(p_payload,'{}'::jsonb)-'_baha'-'_flow_v2'-'bribe_tokens')
    || jsonb_build_object(
      '_baha',jsonb_build_object(
        'gold',v_gold,
        'credibility',v_cred,
        'bribe_tokens',v_bribe,
        'revision',4
      ),
      '_flow_v2',jsonb_build_object(
        'family',v_family,
        'recent_same_family',v_repetition,
        'surcharge_pct',round(v_surcharge*100),
        'exposure_bonus',v_exposure,
        'revision',4
      )
    );

  insert into app_private.kaykha_secret_orders(
    game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload
  ) values(
    p_game_id,v_member.id,v_game.round_no,p_order_type,p_origin_territory_id,p_target_territory_id,v_payload
  )
  on conflict(game_id,member_id,round_no) do update set
    order_type=excluded.order_type,
    origin_territory_id=excluded.origin_territory_id,
    target_territory_id=excluded.target_territory_id,
    payload=excluded.payload,
    locked_at=now()
  returning order_id into v_order_id;

  return v_order_id;
end
$$;
revoke all on function public.submit_kaykha_order(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.submit_kaykha_order(uuid,text,text,text,jsonb) to authenticated;