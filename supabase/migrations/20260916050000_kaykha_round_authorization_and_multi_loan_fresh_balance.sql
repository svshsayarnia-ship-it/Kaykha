-- Harden round resolution authorization before any Practice AI mutation.
-- Re-read borrower balance for every due loan so multiple same-round loans cannot use stale coins.

create or replace function public.resolve_kaykha_round(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_game public.kaykha_games%rowtype;
  v_result jsonb;
  v_effect_count integer:=0;
  v_rows integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id<>(select auth.uid()) then raise exception 'فقط میزبان می‌تواند سپیده‌دم را اجرا کند'; end if;
  if v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'فرمان‌ها هنوز آمادهٔ آشکارسازی نیستند'; end if;

  create temp table if not exists kaykha_before_territories(entity_id text primary key,before_state jsonb) on commit drop;
  create temp table if not exists kaykha_before_members(entity_id text primary key,before_state jsonb) on commit drop;
  truncate kaykha_before_territories;
  truncate kaykha_before_members;
  insert into kaykha_before_territories select territory_id,to_jsonb(t) from public.kaykha_territories t where game_id=p_game_id;
  insert into kaykha_before_members select id::text,to_jsonb(m) from public.kaykha_members m where game_id=p_game_id;

  if v_game.is_practice then perform app_private.plan_kaykha_practice_ai(p_game_id,v_game.round_no); end if;
  v_result:=public.resolve_kaykha_round_core(p_game_id);

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,source_order_type,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'territory',t.territory_id,
    case
      when (b.before_state->>'owner_member_id') is distinct from (to_jsonb(t)->>'owner_member_id') then 'ownership_change'
      when coalesce((b.before_state->>'is_in_mutiny')::boolean,false)=false and t.is_in_mutiny then 'revolt'
      when coalesce((b.before_state->>'is_raided')::boolean,false)=false and t.is_raided then 'raid'
      when t.economy<coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_down'
      when t.economy>coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_up'
      when t.strength>coalesce((b.before_state->>'strength')::integer,t.strength) then 'reinforce'
      when t.strength<coalesce((b.before_state->>'strength')::integer,t.strength) then 'strength_loss'
      else 'territory_update' end,
    (select so.order_type from app_private.kaykha_secret_orders so
      where so.game_id=p_game_id and so.round_no=v_game.round_no
        and (so.target_territory_id=t.territory_id or so.origin_territory_id=t.territory_id)
      order by case when so.target_territory_id=t.territory_id then 0 else 1 end,so.locked_at desc limit 1),
    b.before_state,to_jsonb(t),
    jsonb_build_object(
      'owner_before',b.before_state->'owner_member_id','owner_after',to_jsonb(t)->'owner_member_id',
      'strength',t.strength-coalesce((b.before_state->>'strength')::integer,t.strength),
      'economy',t.economy-coalesce((b.before_state->>'economy')::integer,t.economy),
      'influence',t.influence-coalesce((b.before_state->>'influence')::integer,t.influence),
      'legitimacy',t.legitimacy-coalesce((b.before_state->>'legitimacy')::integer,t.legitimacy),
      'poverty',t.poverty-coalesce((b.before_state->>'poverty')::integer,t.poverty),
      'mutiny_before',b.before_state->'is_in_mutiny','mutiny_after',to_jsonb(t)->'is_in_mutiny',
      'raided_before',b.before_state->'is_raided','raided_after',to_jsonb(t)->'is_raided')
  from public.kaykha_territories t join kaykha_before_territories b on b.entity_id=t.territory_id
  where t.game_id=p_game_id and b.before_state is distinct from to_jsonb(t);
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'member',m.id::text,'member_update',b.before_state,to_jsonb(m),
    jsonb_build_object(
      'coins',m.coins-coalesce((b.before_state->>'coins')::integer,m.coins),
      'prestige',m.prestige-coalesce((b.before_state->>'prestige')::integer,m.prestige),
      'influence_tokens',m.influence_tokens-coalesce((b.before_state->>'influence_tokens')::integer,m.influence_tokens),
      'reputation_score',m.reputation_score-coalesce((b.before_state->>'reputation_score')::integer,m.reputation_score),
      'bribe_tokens',m.bribe_tokens-coalesce((b.before_state->>'bribe_tokens')::integer,m.bribe_tokens),
      'suspicion_level',m.suspicion_level-coalesce((b.before_state->>'suspicion_level')::integer,m.suspicion_level))
  from public.kaykha_members m join kaykha_before_members b on b.entity_id=m.id::text
  where m.game_id=p_game_id and b.before_state is distinct from to_jsonb(m);
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,source_order_type,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'order',so.order_id::text,so.order_type,so.order_type,
    jsonb_build_object('origin',so.origin_territory_id,'target',so.target_territory_id),
    jsonb_build_object('actor_member_id',so.member_id,'affected_territory_id',a.territory_id),
    jsonb_build_object(
      'actor_member_id',so.member_id,'origin',so.origin_territory_id,'target',so.target_territory_id,
      'affected_territory_id',a.territory_id,
      'strength',coalesce(a.strength,0)-coalesce((b.before_state->>'strength')::integer,coalesce(a.strength,0)),
      'economy',coalesce(a.economy,0)-coalesce((b.before_state->>'economy')::integer,coalesce(a.economy,0)),
      'legitimacy',coalesce(a.legitimacy,0)-coalesce((b.before_state->>'legitimacy')::integer,coalesce(a.legitimacy,0)),
      'poverty',coalesce(a.poverty,0)-coalesce((b.before_state->>'poverty')::integer,coalesce(a.poverty,0)),
      'owner_before',b.before_state->'owner_member_id','owner_after',to_jsonb(a)->'owner_member_id')
  from app_private.kaykha_secret_orders so
  left join public.kaykha_territories a on a.game_id=so.game_id and a.territory_id=case when so.order_type in ('defend','trade') then so.origin_territory_id else so.target_territory_id end
  left join kaykha_before_territories b on b.entity_id=a.territory_id
  where so.game_id=p_game_id and so.round_no=v_game.round_no
    and so.order_type in ('attack','defend','support','caravan','trade','spy','revolt','raid','sabotage','spell');
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;

  return v_result||jsonb_build_object('effect_events',v_effect_count,'shared_engine',true,'practice',v_game.is_practice,'order_visual_events',v_rows);
end
$$;
revoke all on function public.resolve_kaykha_round(uuid) from public,anon;
grant execute on function public.resolve_kaykha_round(uuid) to authenticated;

create or replace function app_private.resolve_kaykha_loans(p_game_id uuid,p_round integer)
returns integer
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  r record;
  v_total integer;
  v_borrower_coins integer;
  v_territory text;
  v_deed uuid;
  v_actions integer:=0;
begin
  for r in
    select l.*
    from public.kaykha_loans l
    where l.game_id=p_game_id and l.status='active' and l.due_round<=p_round
    order by l.due_round,l.created_at,l.id
    for update of l
  loop
    select coins into v_borrower_coins
    from public.kaykha_members
    where id=r.borrower_member_id
    for update;

    v_total:=r.principal+r.interest_coins;
    if coalesce(v_borrower_coins,0)>=v_total then
      update public.kaykha_members set coins=coins-v_total where id=r.borrower_member_id;
      update public.kaykha_members set coins=least(999,coins+v_total) where id=r.lender_member_id;
      update public.kaykha_loans set status='repaid',resolved_at=now() where id=r.id;
      perform app_private.adjust_kaykha_credit(p_game_id,r.borrower_member_id,5,'automatic_repayment',p_round,jsonb_build_object('loan_id',r.id));
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'economy','سپیده‌دم، وامِ سررسیدشده خودکار پرداخت شد.');
    else
      update public.kaykha_loans set status='defaulted',resolved_at=now() where id=r.id;
      update public.kaykha_members
      set blacklist_until_round=greatest(coalesce(blacklist_until_round,0),p_round+2),credit_limit=greatest(0,credit_limit-10)
      where id=r.borrower_member_id;
      perform app_private.adjust_kaykha_credit(p_game_id,r.borrower_member_id,-20,'loan_default',p_round,jsonb_build_object('loan_id',r.id,'collateral_type',r.collateral_type));

      if r.collateral_type='territory' then
        v_territory:=nullif(r.collateral_ref->>'territory_id','');
        if v_territory is not null then
          update public.kaykha_territories set owner_member_id=r.lender_member_id,revision=revision+1,is_in_mutiny=false
          where game_id=p_game_id and territory_id=v_territory and owner_member_id=r.borrower_member_id;
          if found then update public.kaykha_loans set status='foreclosed' where id=r.id; end if;
        end if;
      elsif r.collateral_type='deed' then
        v_deed:=nullif(r.collateral_ref->>'deed_id','')::uuid;
        if v_deed is not null then
          update public.kaykha_deeds set owner_member_id=r.lender_member_id
          where id=v_deed and game_id=p_game_id and owner_member_id=r.borrower_member_id;
          if found then update public.kaykha_loans set status='foreclosed' where id=r.id; end if;
        end if;
      end if;

      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','وام بی‌پاسخ ماند؛ اعتبار وام‌گیرنده شکست و وثیقه در معرض مصادره قرار گرفت.');
    end if;
    v_actions:=v_actions+1;
  end loop;
  return v_actions;
end
$$;
revoke all on function app_private.resolve_kaykha_loans(uuid,integer) from public,anon,authenticated;