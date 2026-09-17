-- Practice AI Planner V2
-- Easy remains readable/random. Hard uses one-ply expected utility.
-- Mastermind adds counter-risk and strategic two-ply scoring.
-- Fairness invariant: the AI never reads the human order from the current round.
-- Legality invariant: AI candidates obey the same progressive round unlocks as humans.

create or replace function app_private.plan_kaykha_practice_ai(p_game_id uuid,p_round integer)
returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_ai public.kaykha_members%rowtype;
  v_human uuid;
  v_diff text;
  v_history integer;
  v_likely text;
  v_hot_ai text;
  v_action text;
  v_origin text;
  v_target text;
  v_score numeric;
  v_candidates integer:=0;
begin
  select * into v_game
  from public.kaykha_games
  where id=p_game_id and is_practice
  for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then
    return jsonb_build_object('skipped',true,'reason','practice_not_in_orders');
  end if;

  select * into v_ai
  from public.kaykha_members
  where game_id=p_game_id and is_ai
  order by seat_no,id
  limit 1;
  if not found then return jsonb_build_object('skipped',true,'reason','ai_missing'); end if;

  if exists(
    select 1 from app_private.kaykha_secret_orders
    where game_id=p_game_id and member_id=v_ai.id and round_no=p_round
  ) then
    return jsonb_build_object('already_planned',true);
  end if;

  select id into v_human
  from public.kaykha_members
  where game_id=p_game_id and not is_ai
  order by seat_no,id
  limit 1;
  if v_human is null then return jsonb_build_object('skipped',true,'reason','human_missing'); end if;

  -- Do not plan until the human has committed this round. We only use the fact
  -- that a current order exists; its type/route/payload is never selected below.
  if not exists(
    select 1
    from app_private.kaykha_secret_orders so
    where so.game_id=p_game_id and so.member_id=v_human and so.round_no=p_round
  ) then
    return jsonb_build_object('waiting_for_human',true);
  end if;

  v_diff:=coalesce(v_game.practice_difficulty,v_ai.ai_difficulty,'easy');
  v_history:=case v_diff when 'mastermind' then 6 when 'hard' then 3 else 1 end;

  -- Historical tendency only: strict < current round protects hidden-current-order fairness.
  select q.order_type into v_likely
  from (
    select so.order_type
    from app_private.kaykha_secret_orders so
    where so.game_id=p_game_id and so.member_id=v_human and so.round_no<p_round
    order by so.round_no desc,so.locked_at desc
    limit v_history
  ) q
  group by q.order_type
  order by count(*) desc,q.order_type
  limit 1;

  -- AI city most often targeted historically by the human.
  select so.target_territory_id into v_hot_ai
  from app_private.kaykha_secret_orders so
  join public.kaykha_territories t
    on t.game_id=so.game_id and t.territory_id=so.target_territory_id and t.owner_member_id=v_ai.id
  where so.game_id=p_game_id and so.member_id=v_human and so.round_no<p_round
  group by so.target_territory_id
  order by count(*) desc,max(so.round_no) desc
  limit 1;

  create temporary table if not exists kaykha_ai_candidates(
    action text not null,
    origin_id text not null,
    target_id text not null,
    base_score numeric not null,
    counter_risk numeric not null default 0,
    strategic_bonus numeric not null default 0,
    final_score numeric not null default 0,
    rationale text not null
  ) on commit drop;
  truncate kaykha_ai_candidates;

  -- ATTACK: consider every non-owned city, including valuable neutral expansion.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'attack',o.territory_id,t.territory_id,
         28 + (o.strength-t.strength)*11 + t.economy*3 + t.influence*2
            + case when t.owner_member_id=v_human then 8 else 3 end,
         greatest(0,t.strength-o.strength)*8,
         case when t.owner_member_id=v_human and t.legitimacy<45 then 8 else 0 end,
         'expand_or_capture'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.territory_id<>o.territory_id
  where o.game_id=p_game_id and o.owner_member_id=v_ai.id
    and t.owner_member_id is distinct from v_ai.id;

  -- DEFEND: especially reward historically pressured AI cities.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'defend',t.territory_id,t.territory_id,
         24 + greatest(0,6-t.strength)*5
            + case when t.territory_id=v_hot_ai then 30 else 0 end,
         0,
         case when v_likely='attack' then 22 else 0 end,
         'protect_pressure_point'
  from public.kaykha_territories t
  where t.game_id=p_game_id and t.owner_member_id=v_ai.id;

  -- SUPPORT: reinforce the weakest AI city from the strongest AI city.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'support',o.territory_id,t.territory_id,
         18 + greatest(0,o.strength-t.strength)*4 + case when t.territory_id=v_hot_ai then 14 else 0 end,
         2,
         case when v_likely='attack' then 10 else 0 end,
         'reinforce_weak_flank'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_ai.id
  where o.game_id=p_game_id and o.owner_member_id=v_ai.id and o.territory_id<>t.territory_id;

  -- TRADE: preserve economy when direct conflict is unattractive.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'trade',t.territory_id,t.territory_id,
         14 + t.economy*4,
         case when t.territory_id=v_hot_ai then 8 else 2 end,
         case when v_likely in ('defend','support') then 5 else 0 end,
         'compound_economy'
  from public.kaykha_territories t
  where t.game_id=p_game_id and t.owner_member_id=v_ai.id;

  -- CARAVAN unlocks at round 2, matching the authoritative progressive guard.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'caravan',o.territory_id,t.territory_id,
         16 + greatest(0,5-t.economy)*4,
         3,
         case when v_likely in ('raid','sabotage') then -4 else 4 end,
         'repair_economy'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_ai.id
  where p_round>=2 and o.game_id=p_game_id and o.owner_member_id=v_ai.id;

  -- Covert actions target only live human territory; never neutral/self.
  -- SPY unlocks at round 2.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'spy',o.territory_id,t.territory_id,
         18 + t.strength*2 + t.economy*2 + t.influence,
         4,
         case when v_likely in ('attack','sabotage','raid') then 9 else 3 end,
         'collect_intelligence'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_human
  where p_round>=2 and o.game_id=p_game_id and o.owner_member_id=v_ai.id;

  -- REVOLT, RAID and SABOTAGE unlock at round 4.
  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'revolt',o.territory_id,t.territory_id,
         20 + greatest(0,60-t.legitimacy)*1.2 + t.economy,
         case when t.legitimacy>60 then 12 else 4 end,
         case when t.legitimacy<=45 then 18 else 0 end,
         'attack_legitimacy'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_human
  where p_round>=4 and o.game_id=p_game_id and o.owner_member_id=v_ai.id;

  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'raid',o.territory_id,t.territory_id,
         19 + t.economy*5 + t.influence,
         7,
         case when v_likely in ('trade','caravan') then 13 else 2 end,
         'hit_visible_wealth'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_human
  where p_round>=4 and o.game_id=p_game_id and o.owner_member_id=v_ai.id;

  insert into kaykha_ai_candidates(action,origin_id,target_id,base_score,counter_risk,strategic_bonus,rationale)
  select 'sabotage',o.territory_id,t.territory_id,
         21 + t.economy*5 + t.strength,
         10,
         case when v_likely in ('defend','support','trade','caravan') then 16 else 3 end,
         'deny_infrastructure'
  from public.kaykha_territories o
  join public.kaykha_territories t on t.game_id=o.game_id and t.owner_member_id=v_human
  where p_round>=4 and o.game_id=p_game_id and o.owner_member_id=v_ai.id;

  select count(*) into v_candidates from kaykha_ai_candidates;
  if v_candidates=0 then return jsonb_build_object('skipped',true,'reason','no_legal_candidates'); end if;

  -- Difficulty model.
  if v_diff='easy' then
    -- Intentionally noisy and readable. Restrict to basic actions to teach the loop.
    delete from kaykha_ai_candidates where action not in ('attack','defend','support','trade');
    select action,origin_id,target_id,base_score
      into v_action,v_origin,v_target,v_score
    from kaykha_ai_candidates
    order by random()
    limit 1;
  elsif v_diff='hard' then
    -- One-ply expected utility: value now minus immediate counter-risk, with tiny
    -- deterministic noise so equally-good boards do not always look scripted.
    update kaykha_ai_candidates c
    set final_score=c.base_score-c.counter_risk+c.strategic_bonus
      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3;
    select action,origin_id,target_id,final_score
      into v_action,v_origin,v_target,v_score
    from kaykha_ai_candidates
    order by final_score desc,action,origin_id,target_id
    limit 1;
  else
    -- Mastermind: approximate two-ply planning. It values the first move, then
    -- discounts positions that expose the likely human counter on the next ply.
    update kaykha_ai_candidates c
    set final_score=(c.base_score*1.15)-c.counter_risk+c.strategic_bonus
      + case
          when v_likely='attack' and c.action in ('defend','support') then 20
          when v_likely in ('trade','caravan') and c.action in ('raid','sabotage') then 18
          when v_likely in ('defend','support') and c.action in ('revolt','sabotage') then 14
          when v_likely in ('spy','raid','sabotage') and c.action='attack' then 12
          else 0
        end
      + case
          when c.action='attack' then greatest(-12,least(18,(select coalesce(o.strength,0)-coalesce(t.strength,0)
            from public.kaykha_territories o,public.kaykha_territories t
            where o.game_id=p_game_id and o.territory_id=c.origin_id and t.game_id=p_game_id and t.territory_id=c.target_id)))
          when c.action='revolt' then 8
          when c.action='sabotage' then 6
          else 0
        end
      + mod(abs(hashtext('mastermind:'||p_game_id::text||':'||p_round::text||':'||c.action||':'||c.target_id)::bigint),5)-2;

    -- Avoid a dominant repeated family when another candidate is close enough.
    update kaykha_ai_candidates c
    set final_score=final_score-
      least(20,5*app_private.kaykha_strategy_repetition(p_game_id,v_ai.id,p_round,app_private.kaykha_action_family(c.action)));

    select action,origin_id,target_id,final_score
      into v_action,v_origin,v_target,v_score
    from kaykha_ai_candidates
    order by final_score desc,action,origin_id,target_id
    limit 1;
  end if;

  if v_action is null or v_origin is null or v_target is null then
    return jsonb_build_object('skipped',true,'reason','planner_empty_after_filters');
  end if;

  perform app_private.submit_kaykha_ai_order(p_game_id,v_ai.id,p_round,v_action,v_origin,v_target);

  -- Public event intentionally does not reveal AI action or route before dawn.
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,p_round,'shadow','حریف هوش مصنوعی فرمان خود را مهر کرد.');

  return jsonb_build_object(
    'planner','v2',
    'difficulty',v_diff,
    'action',v_action,
    'origin',v_origin,
    'target',v_target,
    'score',round(coalesce(v_score,0),2),
    'history_depth',v_history,
    'historical_likely_action',v_likely,
    'candidate_count',v_candidates,
    'fairness','current_human_order_not_read'
  );
end;
$function$;

revoke all on function app_private.plan_kaykha_practice_ai(uuid,integer) from public,anon,authenticated;
