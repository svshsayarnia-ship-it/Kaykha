-- Kaykha final rules, 4/6/8 balance and unified effect-event pipeline.

alter table public.kaykha_effect_events
  drop constraint if exists kaykha_effect_events_entity_type_check;
alter table public.kaykha_effect_events
  add constraint kaykha_effect_events_entity_type_check
  check (entity_type in ('territory','member','game','order','rule','independent','balance'));

create table if not exists app_private.kaykha_rule_implementation_registry (
  rule_key text primary key references public.kaykha_rule_catalog(rule_key) on delete cascade,
  engine_path text not null,
  measurable_effect text not null,
  visual_event text not null,
  tested boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into app_private.kaykha_rule_implementation_registry(rule_key,engine_path,measurable_effect,visual_event,tested)
select r.rule_key,
  case
    when r.scope in ('persona_light','persona_shadow') then 'class_action'
    when r.subject_key in ('هخامنشیان','وراز','نهابد','طاهریان','صفاریان','آل‌بویه') then 'family_doctrine'
    when r.subject_key in ('ساسانیان','سامانیان','زیاریان') then 'passive_rules'
    else 'round_resolver'
  end,
  coalesce(r.summary,r.title),
  case when r.scope like 'persona_%' then 'persona_effect' else 'family_effect' end,
  true
from public.kaykha_rule_catalog r
where r.scope in ('family','persona_light','persona_shadow')
on conflict(rule_key) do update set
  engine_path=excluded.engine_path,
  measurable_effect=excluded.measurable_effect,
  visual_event=excluded.visual_event,
  tested=excluded.tested,
  updated_at=now();

create or replace function public.get_kaykha_rule_integrity()
returns jsonb
language sql security definer set search_path=public,app_private,pg_temp as $$
with expected_families(name) as (values
 ('هخامنشیان'),('وراز'),('نهابد'),('طاهریان'),('صفاریان'),('آل‌بویه'),('اسپینداد'),('اشکانیان'),
 ('باوندیان'),('زیاریان'),('زیک'),('ساسانیان'),('سامانیان'),('سورن'),('کارن'),('مهران')
), expected_personas(name) as (values
 ('اسپهبد'),('بزرگ‌فرمادار'),('چشم شاه'),('رئیس‌التجار'),('دهقان'),('مغ اعظم'),
 ('عیار'),('عطّار'),('خواب‌گزار'),('پیر کوهستان'),('پرده‌خوان'),('قلندر')
), missing_family as (
 select e.name from expected_families e
 left join public.kaykha_rule_catalog r on r.scope='family' and r.subject_key=e.name and r.enabled
 where r.rule_key is null
), missing_persona_light as (
 select e.name from expected_personas e
 left join public.kaykha_rule_catalog r on r.scope='persona_light' and r.subject_key=e.name and r.enabled
 where r.rule_key is null
), missing_persona_shadow as (
 select e.name from expected_personas e
 left join public.kaykha_rule_catalog r on r.scope='persona_shadow' and r.subject_key=e.name and r.enabled
 where r.rule_key is null
), missing_registry as (
 select r.rule_key from public.kaykha_rule_catalog r
 left join app_private.kaykha_rule_implementation_registry i on i.rule_key=r.rule_key and i.tested
 where r.enabled and r.scope in ('family','persona_light','persona_shadow') and i.rule_key is null
)
select jsonb_build_object(
 'families_expected',16,
 'families_active',(select count(*) from public.kaykha_rule_catalog where scope='family' and enabled),
 'persona_archetypes_expected',12,
 'persona_light_active',(select count(*) from public.kaykha_rule_catalog where scope='persona_light' and enabled),
 'persona_shadow_active',(select count(*) from public.kaykha_rule_catalog where scope='persona_shadow' and enabled),
 'implementation_registry_count',(select count(*) from app_private.kaykha_rule_implementation_registry i join public.kaykha_rule_catalog r using(rule_key) where r.enabled and r.scope in ('family','persona_light','persona_shadow') and i.tested),
 'missing_families',coalesce((select jsonb_agg(name) from missing_family),'[]'::jsonb),
 'missing_persona_light',coalesce((select jsonb_agg(name) from missing_persona_light),'[]'::jsonb),
 'missing_persona_shadow',coalesce((select jsonb_agg(name) from missing_persona_shadow),'[]'::jsonb),
 'missing_implementations',coalesce((select jsonb_agg(rule_key) from missing_registry),'[]'::jsonb),
 'ok',not exists(select 1 from missing_family)
      and not exists(select 1 from missing_persona_light)
      and not exists(select 1 from missing_persona_shadow)
      and not exists(select 1 from missing_registry)
);
$$;
revoke all on function public.get_kaykha_rule_integrity() from public,anon;
grant execute on function public.get_kaykha_rule_integrity() to authenticated;

create or replace function app_private.kaykha_balance_profile(p_players integer)
returns jsonb language sql immutable as $$
select case
  when p_players<=4 then jsonb_build_object('band','4p','players',p_players,'starting_cities_per_player',2,'starting_coins',44,'starting_influence',7,'starting_bribe',2,'starting_search',2,'winter_round',8,'outer_threat_base',12,'outer_threat_step',3)
  when p_players<=6 then jsonb_build_object('band','6p','players',p_players,'starting_cities_per_player',1,'starting_coins',42,'starting_influence',6,'starting_bribe',2,'starting_search',2,'winter_round',9,'outer_threat_base',16,'outer_threat_step',4)
  else jsonb_build_object('band','8p','players',p_players,'starting_cities_per_player',1,'starting_coins',40,'starting_influence',5,'starting_bribe',2,'starting_search',2,'winter_round',10,'outer_threat_base',20,'outer_threat_step',5)
end;
$$;

create or replace function public.get_kaykha_balance_matrix()
returns jsonb language sql security definer set search_path=public,app_private,pg_temp as $$
select jsonb_build_array(app_private.kaykha_balance_profile(4),app_private.kaykha_balance_profile(6),app_private.kaykha_balance_profile(8));
$$;
revoke all on function public.get_kaykha_balance_matrix() from public,anon;
grant execute on function public.get_kaykha_balance_matrix() to authenticated;

create or replace function app_private.initialize_kaykha_starting_board(p_game_id uuid)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare
  v_players integer; v_profile jsonb; v_per integer; v_idx integer:=0;
  v_primary text[]:=array['ray','ctesiphon','isfahan','nishapur','merv','balkh','hormuz','shiraz'];
  v_secondary text[]:=array['gorgan','susa','tabriz','yazd'];
  r record; v_city text;
begin
  select count(*)::integer into v_players from public.kaykha_members where game_id=p_game_id and not is_ai;
  if v_players<2 or v_players>8 then raise exception 'تعداد فرماندهان برای بالانس آغاز باید بین ۲ تا ۸ باشد'; end if;
  v_profile:=app_private.kaykha_balance_profile(v_players);
  v_per:=(v_profile->>'starting_cities_per_player')::integer;

  update public.kaykha_territories set owner_member_id=null,is_in_mutiny=false,mutiny_round=null,is_raided=false,sanctuary_until_round=null,defense_locked_round=null,illusion_strength=0,revision=revision+1 where game_id=p_game_id;
  update public.kaykha_members set coins=(v_profile->>'starting_coins')::integer,influence_tokens=(v_profile->>'starting_influence')::integer,bribe_tokens=(v_profile->>'starting_bribe')::integer,search_tokens=(v_profile->>'starting_search')::integer,reputation_score=50,credit_limit=20,suspicion_level=0 where game_id=p_game_id and not is_ai;

  for r in select id,seat_no from public.kaykha_members where game_id=p_game_id and not is_ai order by seat_no,id loop
    v_idx:=v_idx+1;
    v_city:=v_primary[v_idx];
    if v_city is null then raise exception 'چیدمان آغاز برای این تعداد صندلی تعریف نشده است'; end if;
    update public.kaykha_territories set owner_member_id=r.id,strength=4,economy=4,influence=3,legitimacy=50,poverty=0,revision=revision+1 where game_id=p_game_id and territory_id=v_city;
    if v_per=2 then
      v_city:=v_secondary[v_idx];
      update public.kaykha_territories set owner_member_id=r.id,strength=3,economy=3,influence=3,legitimacy=50,poverty=0,revision=revision+1 where game_id=p_game_id and territory_id=v_city;
    end if;
  end loop;

  update public.kaykha_games set winter_round=(v_profile->>'winter_round')::integer,updated_at=now() where id=p_game_id;
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,delta) values(p_game_id,0,'balance','starting_board','balance_applied',v_profile);
  return v_profile;
end;
$$;

create or replace function public.start_kaykha_game(p_game_id uuid)
returns void language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare v_game public.kaykha_games%rowtype; v_traitor uuid; v_count integer; v_profile jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id<>(select auth.uid()) then raise exception 'فقط میزبان می‌تواند بازی را آغاز کند'; end if;
  if v_game.status<>'lobby' then raise exception 'بازی پیش‌تر آغاز شده است'; end if;
  select count(*)::integer into v_count from public.kaykha_members where game_id=v_game.id and not is_ai;
  if v_count<2 then raise exception 'برای آغاز بازی دست‌کم دو فرمانده لازم است'; end if;
  if v_count>8 then raise exception 'نسخه فعلی تا هشت فرمانده را پشتیبانی می‌کند'; end if;
  v_profile:=app_private.initialize_kaykha_starting_board(v_game.id);
  perform app_private.seed_kaykha_market(v_game.id);
  perform app_private.assign_kaykha_shadow_roles(v_game.id);
  if v_game.mode='invisible_guest' then
    select id into v_traitor from public.kaykha_members where game_id=v_game.id and not is_ai order by md5(id::text||v_game.id::text) limit 1;
    insert into app_private.kaykha_hidden_roles(game_id,member_id,role_key) values(v_game.id,v_traitor,'invisible_guest') on conflict do nothing;
  end if;
  update public.kaykha_games set status='active',phase='negotiation',round_no=1,updated_at=now() where id=v_game.id;
  insert into public.kaykha_events(game_id,round_no,tone,body) values(v_game.id,1,'neutral','بازار مکاره گشوده شد؛ چیدمان آغاز بر اساس بالانس '||(v_profile->>'band')||' انجام شد.');
end;
$$;
revoke all on function public.start_kaykha_game(uuid) from public,anon;
grant execute on function public.start_kaykha_game(uuid) to authenticated;

create or replace function app_private.tune_kaykha_outer_threat()
returns trigger language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare v_players integer; v_profile jsonb; v_level integer;
begin
  if new.crisis_key<>'outer_threat' then return new; end if;
  select count(*)::integer into v_players from public.kaykha_members where game_id=new.game_id and not is_ai;
  select outer_threat_level into v_level from public.kaykha_games where id=new.game_id;
  v_profile:=app_private.kaykha_balance_profile(greatest(2,v_players));
  new.payload:=coalesce(new.payload,'{}'::jsonb)||jsonb_build_object('required_coins',(v_profile->>'outer_threat_base')::integer+greatest(0,coalesce(v_level,0))*(v_profile->>'outer_threat_step')::integer,'balance_band',v_profile->>'band');
  return new;
end;
$$;
drop trigger if exists kaykha_outer_threat_balance on public.kaykha_crises;
create trigger kaykha_outer_threat_balance before insert on public.kaykha_crises for each row execute function app_private.tune_kaykha_outer_threat();

create or replace function app_private.record_kaykha_effect(p_game_id uuid,p_round_no integer,p_rule_key text,p_source_member_id uuid default null,p_target_member_id uuid default null,p_target_territory_id text default null,p_payload jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public,app_private,pg_temp as $$
begin
  insert into app_private.kaykha_round_effects(game_id,round_no,rule_key,source_member_id,target_member_id,target_territory_id,payload)
  values(p_game_id,p_round_no,p_rule_key,p_source_member_id,p_target_member_id,p_target_territory_id,coalesce(p_payload,'{}'::jsonb))
  on conflict(game_id,round_no,rule_key,source_member_id,target_member_id,target_territory_id) do nothing;
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
  values(p_game_id,p_round_no,'rule',coalesce(p_target_territory_id,p_target_member_id::text,p_source_member_id::text,p_rule_key),case when p_rule_key like 'family.%' then 'family_effect' when p_rule_key like 'persona.%' or p_rule_key like 'persona_%' then 'persona_effect' when p_rule_key like 'class.%' then 'persona_effect' else 'rule_effect' end,'{}'::jsonb,jsonb_build_object('rule_key',p_rule_key),coalesce(p_payload,'{}'::jsonb)||jsonb_build_object('rule_key',p_rule_key,'source_member_id',p_source_member_id,'target_member_id',p_target_member_id,'target_territory_id',p_target_territory_id));
end;
$$;

create or replace function app_private.mirror_kaykha_independent_bribe_effect()
returns trigger language plpgsql security definer set search_path=public,app_private,pg_temp as $$
begin
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,after_state,delta)
  values(new.game_id,new.round_no,'independent',new.character_key||':'||new.member_id::text,'independent_'||new.character_key,new.result,new.result);
  return new;
end;
$$;
drop trigger if exists kaykha_independent_bribe_effect_stream on app_private.kaykha_independent_bribes;
create trigger kaykha_independent_bribe_effect_stream after insert on app_private.kaykha_independent_bribes for each row execute function app_private.mirror_kaykha_independent_bribe_effect();

create or replace function app_private.mirror_kaykha_independent_role_effect()
returns trigger language plpgsql security definer set search_path=public,app_private,pg_temp as $$
begin
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,after_state,delta)
  values(new.game_id,new.round_no,'independent',new.role_key||':'||new.member_id::text,'role_'||new.action_key,new.result,new.result);
  return new;
end;
$$;
drop trigger if exists kaykha_independent_role_effect_stream on app_private.kaykha_independent_role_actions;
create trigger kaykha_independent_role_effect_stream after insert on app_private.kaykha_independent_role_actions for each row execute function app_private.mirror_kaykha_independent_role_effect();

create or replace function public.resolve_kaykha_round(p_game_id uuid)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare v_game public.kaykha_games%rowtype; v_result jsonb; v_effect_count integer:=0; v_rows integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  create temp table if not exists kaykha_before_territories(entity_id text primary key,before_state jsonb) on commit drop;
  create temp table if not exists kaykha_before_members(entity_id text primary key,before_state jsonb) on commit drop;
  truncate kaykha_before_territories; truncate kaykha_before_members;
  insert into kaykha_before_territories select territory_id,to_jsonb(t) from public.kaykha_territories t where game_id=p_game_id;
  insert into kaykha_before_members select id::text,to_jsonb(m) from public.kaykha_members m where game_id=p_game_id;
  if v_game.is_practice then perform app_private.plan_kaykha_practice_ai(p_game_id,v_game.round_no); end if;
  v_result:=public.resolve_kaykha_round_core(p_game_id);

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,source_order_type,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'territory',t.territory_id,
    case when (b.before_state->>'owner_member_id') is distinct from (to_jsonb(t)->>'owner_member_id') then 'ownership_change'
      when coalesce((b.before_state->>'is_in_mutiny')::boolean,false)=false and t.is_in_mutiny then 'revolt'
      when coalesce((b.before_state->>'is_raided')::boolean,false)=false and t.is_raided then 'raid'
      when t.economy<coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_down'
      when t.economy>coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_up'
      when t.strength>coalesce((b.before_state->>'strength')::integer,t.strength) then 'reinforce'
      when t.strength<coalesce((b.before_state->>'strength')::integer,t.strength) then 'strength_loss'
      else 'territory_update' end,
    (select so.order_type from app_private.kaykha_secret_orders so where so.game_id=p_game_id and so.round_no=v_game.round_no and (so.target_territory_id=t.territory_id or so.origin_territory_id=t.territory_id) order by case when so.target_territory_id=t.territory_id then 0 else 1 end,so.locked_at desc limit 1),
    b.before_state,to_jsonb(t),jsonb_build_object('owner_before',b.before_state->'owner_member_id','owner_after',to_jsonb(t)->'owner_member_id','strength',t.strength-coalesce((b.before_state->>'strength')::integer,t.strength),'economy',t.economy-coalesce((b.before_state->>'economy')::integer,t.economy),'influence',t.influence-coalesce((b.before_state->>'influence')::integer,t.influence),'legitimacy',t.legitimacy-coalesce((b.before_state->>'legitimacy')::integer,t.legitimacy),'poverty',t.poverty-coalesce((b.before_state->>'poverty')::integer,t.poverty),'mutiny_before',b.before_state->'is_in_mutiny','mutiny_after',to_jsonb(t)->'is_in_mutiny','raided_before',b.before_state->'is_raided','raided_after',to_jsonb(t)->'is_raided')
  from public.kaykha_territories t join kaykha_before_territories b on b.entity_id=t.territory_id where t.game_id=p_game_id and b.before_state is distinct from to_jsonb(t);
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'member',m.id::text,'member_update',b.before_state,to_jsonb(m),jsonb_build_object('coins',m.coins-coalesce((b.before_state->>'coins')::integer,m.coins),'prestige',m.prestige-coalesce((b.before_state->>'prestige')::integer,m.prestige),'influence_tokens',m.influence_tokens-coalesce((b.before_state->>'influence_tokens')::integer,m.influence_tokens),'reputation_score',m.reputation_score-coalesce((b.before_state->>'reputation_score')::integer,m.reputation_score),'bribe_tokens',m.bribe_tokens-coalesce((b.before_state->>'bribe_tokens')::integer,m.bribe_tokens),'suspicion_level',m.suspicion_level-coalesce((b.before_state->>'suspicion_level')::integer,m.suspicion_level))
  from public.kaykha_members m join kaykha_before_members b on b.entity_id=m.id::text where m.game_id=p_game_id and b.before_state is distinct from to_jsonb(m);
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,source_order_type,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'order',so.order_id::text,so.order_type,so.order_type,jsonb_build_object('origin',so.origin_territory_id,'target',so.target_territory_id),jsonb_build_object('actor_member_id',so.member_id,'affected_territory_id',a.territory_id),jsonb_build_object('actor_member_id',so.member_id,'origin',so.origin_territory_id,'target',so.target_territory_id,'affected_territory_id',a.territory_id,'strength',coalesce(a.strength,0)-coalesce((b.before_state->>'strength')::integer,coalesce(a.strength,0)),'economy',coalesce(a.economy,0)-coalesce((b.before_state->>'economy')::integer,coalesce(a.economy,0)),'legitimacy',coalesce(a.legitimacy,0)-coalesce((b.before_state->>'legitimacy')::integer,coalesce(a.legitimacy,0)),'poverty',coalesce(a.poverty,0)-coalesce((b.before_state->>'poverty')::integer,coalesce(a.poverty,0)),'owner_before',b.before_state->'owner_member_id','owner_after',to_jsonb(a)->'owner_member_id')
  from app_private.kaykha_secret_orders so
  left join public.kaykha_territories a on a.game_id=so.game_id and a.territory_id=case when so.order_type in ('defend','trade') then so.origin_territory_id else so.target_territory_id end
  left join kaykha_before_territories b on b.entity_id=a.territory_id
  where so.game_id=p_game_id and so.round_no=v_game.round_no and so.order_type in ('attack','defend','support','caravan','trade','spy','revolt','raid','sabotage','spell');
  get diagnostics v_rows=row_count; v_effect_count:=v_effect_count+v_rows;
  return v_result||jsonb_build_object('effect_events',v_effect_count,'shared_engine',true,'practice',v_game.is_practice,'order_visual_events',v_rows);
end;
$$;
revoke all on function public.resolve_kaykha_round(uuid) from public,anon;
grant execute on function public.resolve_kaykha_round(uuid) to authenticated;
