-- Kaykha shared game engine foundation.
-- Practice and Online use the same authoritative order submission and round resolver.

alter table public.kaykha_games
  add column if not exists is_practice boolean not null default false,
  add column if not exists practice_difficulty text;

alter table public.kaykha_games drop constraint if exists kaykha_games_practice_difficulty_check;
alter table public.kaykha_games add constraint kaykha_games_practice_difficulty_check
  check (practice_difficulty is null or practice_difficulty in ('easy','hard','mastermind'));

create table if not exists public.kaykha_effect_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null,
  entity_type text not null check (entity_type in ('territory','member','game')),
  entity_id text not null,
  effect_kind text not null,
  source_order_type text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kaykha_effect_events_game_round_idx
  on public.kaykha_effect_events(game_id,round_no,created_at);

alter table public.kaykha_effect_events enable row level security;
drop policy if exists "members can read effect events" on public.kaykha_effect_events;
create policy "members can read effect events" on public.kaykha_effect_events
for select to authenticated
using (exists (
  select 1 from public.kaykha_members m
  where m.game_id=kaykha_effect_events.game_id and m.user_id=(select auth.uid())
));
revoke all on table public.kaykha_effect_events from anon;
grant select on table public.kaykha_effect_events to authenticated;

create or replace function app_private.kaykha_order_base_cost(p_order_type text)
returns integer language sql immutable set search_path='' as $$
  select case p_order_type
    when 'attack' then 8 when 'defend' then 4 when 'support' then 5 when 'spy' then 6
    when 'revolt' then 10 when 'caravan' then 3 when 'trade' then 3 when 'raid' then 7
    when 'sabotage' then 8 when 'spell' then 7 else 5 end;
$$;

create or replace function public.get_kaykha_action_manifest()
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'attack',jsonb_build_object('base_cost',8,'credibility_cost',0,'effect','مقایسه قدرت مبدأ با دفاع هدف؛ در پیروزی مالکیت شهر تغییر می‌کند.','counterplay','دفاع، بست، قرارداد خون، افزایش قدرت و اثرهای ضدحمله.','risk','شکست می‌تواند سپاه مبدأ را فرسوده کند.','visual','ownership_flip'),
    'defend',jsonb_build_object('base_cost',4,'credibility_cost',0,'effect','قدرت پادگان شهر خودی افزایش می‌یابد.','counterplay','قفل دفاع و اثرهای ترس می‌توانند آن را خنثی کنند.','risk','فرصت اقدام تهاجمی همان راند از دست می‌رود.','visual','fortify'),
    'support',jsonb_build_object('base_cost',5,'credibility_cost',0,'effect','قدرت شهر هدف افزایش می‌یابد و خاندان مهران پاداش بیشتری می‌گیرد.','counterplay','فشار همزمان، محاصره یا تغییر مالکیت می‌تواند ارزش پشتیبانی را کم کند.','risk','منابع به جبهه‌ای منتقل می‌شود که ممکن است هدف بعدی حریف نباشد.','visual','reinforcement'),
    'caravan',jsonb_build_object('base_cost',3,'credibility_cost',0,'effect','اقتصاد شهر هدف با رسیدن کاروان افزایش می‌یابد.','counterplay','محاصره بازار، زمین سوخته و خرابکاری مسیر.','risk','مسیر می‌تواند بسته شود و فرمان بدون سود بماند.','visual','caravan_arrival'),
    'trade',jsonb_build_object('base_cost',3,'credibility_cost',0,'effect','اقتصاد شهر مبدأ و درآمد تجاری را تقویت می‌کند.','counterplay','زمین سوخته، اختلال بازار و فشار قراردادها.','risk','در شهر مختل‌شده ممکن است بدون اثر بماند.','visual','economy_up'),
    'spy',jsonb_build_object('base_cost',6,'credibility_cost',2,'effect','پرونده خصوصی از قدرت، اقتصاد، مشروعیت و فرمان هدف ثبت می‌کند.','counterplay','ضدجاسوسی، اسپینداد، باوندیان و سایه‌بان.','risk','اعتبار سیاسی مصرف می‌شود و شبکه ممکن است بسوزد.','visual','intel_reveal'),
    'revolt',jsonb_build_object('base_cost',10,'credibility_cost',0,'effect','قدرت، اقتصاد و مشروعیت هدف را کاهش داده و شهر را وارد آشوب می‌کند.','counterplay','کارن، اسپینداد و اثرهای ضدشورش.','risk','گران است و روی شهر محافظت‌شده بی‌اثر می‌شود.','visual','revolt'),
    'raid',jsonb_build_object('base_cost',7,'credibility_cost',1,'effect','یکی از دارایی‌های آسیب‌پذیر هدف را غارت و جریان اقتصادی را مختل می‌کند.','counterplay','بست، باوندیان، حفاظت سند و ضدجاسوسی.','risk','اعتبار سیاسی مصرف می‌شود و هدف نامناسب ممکن است غنیمتی نداشته باشد.','visual','raid'),
    'sabotage',jsonb_build_object('base_cost',8,'credibility_cost',3,'effect','زیرساخت و سند اقتصادی هدف را از کار می‌اندازد.','counterplay','ضدجاسوسی، بست، باوندیان و حفاظت سند.','risk','بالاترین هزینه اعتبار سیاسی میان فرمان‌های پنهان را دارد.','visual','sabotage')
  );
$$;
revoke all on function public.get_kaykha_action_manifest() from public;
grant execute on function public.get_kaykha_action_manifest() to anon,authenticated;

create or replace function public.submit_kaykha_order(
  p_game_id uuid,p_order_type text,p_origin_territory_id text,p_target_territory_id text,
  p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare
  v_game public.kaykha_games%rowtype; v_member public.kaykha_members%rowtype;
  v_old app_private.kaykha_secret_orders%rowtype; v_order_id uuid;
  v_income integer; v_power integer; v_base integer; v_base_gold integer; v_gold integer;
  v_cred integer:=0; v_bribe integer:=0; v_masked boolean:=false;
  v_old_gold integer:=0; v_old_cred integer:=0; v_old_bribe integer:=0;
  v_payload jsonb; v_family text; v_repetition integer:=0; v_surcharge numeric:=0; v_exposure integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then raise exception 'نوع فرمان نامعتبر است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'اکنون امکان مهر کردن فرمان نیست'; end if;
  select * into v_member from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=v_member.id) then raise exception 'مبدأ باید یکی از قلمروهای تو باشد'; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_target_territory_id) then raise exception 'هدف در این نقشه وجود ندارد'; end if;
  if p_order_type='defend' and exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and defense_locked_round=v_game.round_no) then raise exception 'وحشت در شهر، فرمان دفاع را برای این راند قفل کرده است'; end if;
  select * into v_old from app_private.kaykha_secret_orders where game_id=p_game_id and member_id=v_member.id and round_no=v_game.round_no for update;
  if found then
    v_old_gold:=coalesce((v_old.payload->'_baha'->>'gold')::integer,0);
    v_old_cred:=coalesce((v_old.payload->'_baha'->>'credibility')::integer,0);
    v_old_bribe:=coalesce((v_old.payload->'_baha'->>'bribe_tokens')::integer,0);
  end if;
  select coalesce(sum(economy),0)::integer,coalesce(sum(strength+influence),0)::integer
    into v_income,v_power from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_member.id;
  v_base:=app_private.kaykha_order_base_cost(p_order_type);
  v_base_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);
  v_family:=app_private.kaykha_action_family(p_order_type);
  v_repetition:=app_private.kaykha_strategy_repetition(p_game_id,v_member.id,v_game.round_no,v_family);
  v_surcharge:=app_private.kaykha_repetition_surcharge(v_repetition);
  v_exposure:=app_private.kaykha_repetition_exposure(v_repetition);
  v_gold:=least(999,ceil(v_base_gold*(1+v_surcharge))::integer);
  if p_order_type in ('spy','sabotage','raid','spell') then v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end; end if;
  v_masked:=case when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'masked')='boolean' then (p_payload->>'masked')::boolean else false end;
  if v_masked and p_order_type in ('spy','sabotage','raid') then v_bribe:=least(3,greatest(1,coalesce((p_payload->>'bribe_tokens')::integer,1))); end if;
  if v_member.coins+v_old_gold<v_gold then raise exception 'خزانه برای بهای این فرمان کافی نیست'; end if;
  if v_member.reputation_score+v_old_cred<v_cred then raise exception 'اعتبار سیاسی برای این فرمان کافی نیست'; end if;
  if v_member.bribe_tokens+v_old_bribe<v_bribe then raise exception 'مهر رشوه برای پوشاندن چاپار کافی نیست'; end if;
  update public.kaykha_members set coins=coins+v_old_gold-v_gold,reputation_score=least(100,reputation_score+v_old_cred)-v_cred,bribe_tokens=bribe_tokens+v_old_bribe-v_bribe where id=v_member.id;
  v_payload:=(coalesce(p_payload,'{}'::jsonb)-'_baha'-'_flow_v2')||jsonb_build_object(
    '_baha',jsonb_build_object('gold',v_gold,'credibility',v_cred,'bribe_tokens',v_bribe,'revision',3),
    '_flow_v2',jsonb_build_object('family',v_family,'recent_same_family',v_repetition,'surcharge_pct',round(v_surcharge*100),'exposure_bonus',v_exposure,'revision',3));
  insert into app_private.kaykha_secret_orders(game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload)
  values(p_game_id,v_member.id,v_game.round_no,p_order_type,p_origin_territory_id,p_target_territory_id,v_payload)
  on conflict(game_id,member_id,round_no) do update set order_type=excluded.order_type,origin_territory_id=excluded.origin_territory_id,target_territory_id=excluded.target_territory_id,payload=excluded.payload,locked_at=now()
  returning order_id into v_order_id;
  return v_order_id;
end $$;

DO $$
begin
  if to_regprocedure('public.resolve_kaykha_round_core(uuid)') is null
     and to_regprocedure('public.resolve_kaykha_round(uuid)') is not null then
    alter function public.resolve_kaykha_round(uuid) rename to resolve_kaykha_round_core;
  end if;
end $$;
revoke all on function public.resolve_kaykha_round_core(uuid) from public,anon,authenticated;

create or replace function app_private.submit_kaykha_ai_order(
  p_game_id uuid,p_member_id uuid,p_round integer,p_order_type text,p_origin text,p_target text
) returns uuid language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare
  v_member public.kaykha_members%rowtype; v_order_id uuid; v_income integer; v_power integer;
  v_base integer; v_base_gold integer; v_gold integer; v_cred integer:=0; v_family text;
  v_repetition integer:=0; v_surcharge numeric:=0; v_payload jsonb;
begin
  select * into v_member from public.kaykha_members where id=p_member_id and game_id=p_game_id and is_ai for update;
  if not found then return null; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage') then return null; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin and owner_member_id=p_member_id) then return null; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_target) then return null; end if;
  select coalesce(sum(economy),0)::integer,coalesce(sum(strength+influence),0)::integer into v_income,v_power from public.kaykha_territories where game_id=p_game_id and owner_member_id=p_member_id;
  v_base:=app_private.kaykha_order_base_cost(p_order_type);
  v_base_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);
  v_family:=app_private.kaykha_action_family(p_order_type);
  v_repetition:=app_private.kaykha_strategy_repetition(p_game_id,p_member_id,p_round,v_family);
  v_surcharge:=app_private.kaykha_repetition_surcharge(v_repetition);
  v_gold:=least(999,ceil(v_base_gold*(1+v_surcharge))::integer);
  if p_order_type in ('spy','sabotage','raid') then v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end; end if;
  if v_member.coins<v_gold or v_member.reputation_score<v_cred then p_order_type:='defend';p_target:=p_origin;v_gold:=least(v_member.coins,4);v_cred:=0;end if;
  update public.kaykha_members set coins=greatest(0,coins-v_gold),reputation_score=greatest(0,reputation_score-v_cred) where id=p_member_id;
  v_payload:=jsonb_build_object('_baha',jsonb_build_object('gold',v_gold,'credibility',v_cred,'bribe_tokens',0,'revision',3,'ai',true),'_flow_v2',jsonb_build_object('family',app_private.kaykha_action_family(p_order_type),'recent_same_family',v_repetition,'revision',3,'ai',true));
  insert into app_private.kaykha_secret_orders(game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload)
  values(p_game_id,p_member_id,p_round,p_order_type,p_origin,p_target,v_payload)
  on conflict(game_id,member_id,round_no) do update set order_type=excluded.order_type,origin_territory_id=excluded.origin_territory_id,target_territory_id=excluded.target_territory_id,payload=excluded.payload,locked_at=now()
  returning order_id into v_order_id;
  return v_order_id;
end $$;

create or replace function app_private.plan_kaykha_practice_ai(p_game_id uuid,p_round integer)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare
  v_game public.kaykha_games%rowtype; v_ai public.kaykha_members%rowtype; v_human uuid; v_diff text;
  v_history integer:=1; v_likely text; v_action text; v_origin text; v_target text;
  v_ai_strong text; v_ai_strong_power integer; v_ai_weak text; v_human_weak text; v_human_weak_power integer;
  v_human_strong text; v_human_low_legit text; v_low_legit integer; v_hot_ai text; v_r numeric;
begin
  select * into v_game from public.kaykha_games where id=p_game_id and is_practice for update;
  if not found then return '{}'::jsonb; end if;
  select * into v_ai from public.kaykha_members where game_id=p_game_id and is_ai order by seat_no limit 1;
  if not found then return '{}'::jsonb; end if;
  if exists(select 1 from app_private.kaykha_secret_orders where game_id=p_game_id and member_id=v_ai.id and round_no=p_round) then return jsonb_build_object('already_planned',true); end if;
  select id into v_human from public.kaykha_members where game_id=p_game_id and not is_ai order by seat_no limit 1;
  if v_human is null then return '{}'::jsonb; end if;
  v_diff:=coalesce(v_game.practice_difficulty,v_ai.ai_difficulty,'easy');
  v_history:=case v_diff when 'mastermind' then 6 when 'hard' then 3 else 1 end;
  select q.order_type into v_likely from (
    select so.order_type from app_private.kaykha_secret_orders so
    where so.game_id=p_game_id and so.member_id=v_human and so.round_no<p_round
    order by so.round_no desc,so.locked_at desc limit v_history
  ) q group by q.order_type order by count(*) desc,q.order_type limit 1;
  select territory_id,strength into v_ai_strong,v_ai_strong_power from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_ai.id order by strength desc,economy desc limit 1;
  select territory_id into v_ai_weak from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_ai.id order by strength,economy limit 1;
  select territory_id,strength into v_human_weak,v_human_weak_power from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_human order by strength,legitimacy limit 1;
  select territory_id into v_human_strong from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_human order by strength desc,economy desc limit 1;
  select territory_id,legitimacy into v_human_low_legit,v_low_legit from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_human order by legitimacy,strength limit 1;
  select so.target_territory_id into v_hot_ai from app_private.kaykha_secret_orders so
  join public.kaykha_territories t on t.game_id=so.game_id and t.territory_id=so.target_territory_id and t.owner_member_id=v_ai.id
  where so.game_id=p_game_id and so.member_id=v_human and so.round_no<p_round group by so.target_territory_id order by count(*) desc,max(so.round_no) desc limit 1;
  if v_ai_strong is null or v_human_weak is null then return '{}'::jsonb; end if;
  v_r:=random();
  if v_diff='easy' then
    if v_r<.48 then v_action:='attack';v_origin:=v_ai_strong;v_target:=v_human_weak;
    elsif v_r<.76 then v_action:='defend';v_origin:=coalesce(v_ai_weak,v_ai_strong);v_target:=v_origin;
    else v_action:='support';v_origin:=v_ai_strong;v_target:=coalesce(v_ai_weak,v_ai_strong);end if;
  elsif v_diff='hard' then
    if v_likely='attack' and v_hot_ai is not null then v_action:='defend';v_origin:=v_hot_ai;v_target:=v_hot_ai;
    elsif coalesce(v_ai_strong_power,0)>coalesce(v_human_weak_power,0)+1 then v_action:='attack';v_origin:=v_ai_strong;v_target:=v_human_weak;
    elsif v_likely in ('defend','support','trade','caravan') then v_action:='sabotage';v_origin:=v_ai_strong;v_target:=coalesce(v_human_strong,v_human_weak);
    elsif v_r<.55 then v_action:='spy';v_origin:=v_ai_strong;v_target:=coalesce(v_human_strong,v_human_weak);
    else v_action:='raid';v_origin:=v_ai_strong;v_target:=coalesce(v_human_strong,v_human_weak);end if;
  else
    if v_likely='attack' and v_hot_ai is not null then v_action:='defend';v_origin:=v_hot_ai;v_target:=v_hot_ai;
    elsif coalesce(v_low_legit,100)<=45 or v_likely in ('defend','support') then v_action:='revolt';v_origin:=v_ai_strong;v_target:=coalesce(v_human_low_legit,v_human_weak);
    elsif coalesce(v_ai_strong_power,0)>coalesce(v_human_weak_power,0)+1 then v_action:='attack';v_origin:=v_ai_strong;v_target:=v_human_weak;
    elsif v_likely in ('spy','sabotage','raid') then v_action:='attack';v_origin:=v_ai_strong;v_target:=v_human_weak;
    else v_action:='sabotage';v_origin:=v_ai_strong;v_target:=coalesce(v_human_strong,v_human_weak);end if;
  end if;
  perform app_private.submit_kaykha_ai_order(p_game_id,v_ai.id,p_round,v_action,v_origin,v_target);
  insert into public.kaykha_events(game_id,round_no,tone,body) values(p_game_id,p_round,'shadow','حریف هوش مصنوعی فرمان خود را مهر کرد.');
  return jsonb_build_object('difficulty',v_diff,'action',v_action,'origin',v_origin,'target',v_target,'history_depth',v_history);
end $$;

create or replace function public.create_kaykha_practice_game(
  p_display_name text default 'فرمانده',p_house_id text default 'هخامنشیان',
  p_persona_key text default 'اسپهبد · پاسدار',p_difficulty text default 'easy'
) returns table(game_id uuid,game_code text,ai_member_id uuid)
language plpgsql security definer set search_path=public,app_private,pg_temp as $$
#variable_conflict use_column
declare v_game_id uuid;v_code text;v_human uuid;v_ai uuid;v_ai_house text;v_attempt integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_difficulty not in ('easy','hard','mastermind') then raise exception 'سطح هوش مصنوعی نامعتبر است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then p_display_name:='فرمانده'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then p_house_id:='هخامنشیان'; end if;
  update public.kaykha_games g set status='finished',updated_at=now() where g.host_user_id=(select auth.uid()) and g.is_practice and g.status='active';
  loop
    v_attempt:=v_attempt+1;v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
      insert into public.kaykha_games(code,host_user_id,status,total_seats,phase,round_no,mode,is_practice,practice_difficulty)
      values(v_code,(select auth.uid()),'active',4,'orders',1,'hegemony',true,p_difficulty) returning id into v_game_id;exit;
    exception when unique_violation then if v_attempt>=8 then raise;end if;end;
  end loop;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,is_ai,persona_key,seat_no)
  values(v_game_id,(select auth.uid()),trim(p_display_name),trim(p_house_id),false,trim(coalesce(p_persona_key,'اسپهبد · پاسدار')),1) returning id into v_human;
  v_ai_house:=case when trim(p_house_id)='ساسانیان' then 'اشکانیان' else 'ساسانیان' end;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,is_ai,ai_difficulty,ai_personality,persona_key,seat_no)
  values(v_game_id,null,'دربار هوش مصنوعی',v_ai_house,true,p_difficulty,case p_difficulty when 'easy' then 'reactive' when 'hard' then 'adaptive' else 'mastermind' end,case p_difficulty when 'mastermind' then 'خواب‌گزار · بیدارگر' else 'اسپهبد · پاسدار' end,2) returning id into v_ai;
  delete from public.kaykha_territories t where t.game_id=v_game_id;
  insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence) values
    (v_game_id,'ray',v_human,5,4,3),(v_game_id,'gorgan',v_human,3,3,4),(v_game_id,'isfahan',v_ai,4,4,3),(v_game_id,'nishapur',v_ai,3,5,3),(v_game_id,'hegmataneh',v_ai,4,3,2),(v_game_id,'merv',v_ai,2,5,3),(v_game_id,'ctesiphon',v_ai,5,5,4),(v_game_id,'alamut',v_ai,4,2,4),(v_game_id,'susa',v_ai,3,4,3),(v_game_id,'shiraz',v_ai,4,5,3),(v_game_id,'zaranj',v_ai,3,3,2),(v_game_id,'balkh',null,3,4,2),(v_game_id,'yazd',null,2,3,3),(v_game_id,'tabriz',null,3,4,3),(v_game_id,'hormuz',null,2,5,2),(v_game_id,'bam',null,2,3,2);
  perform app_private.seed_kaykha_market(v_game_id);
  insert into public.kaykha_events(game_id,round_no,tone,body) values(v_game_id,1,'neutral','تمرین با حریف هوش مصنوعی آغاز شد؛ تمام فرمان‌ها از موتور مشترک آنلاین حل می‌شوند.');
  return query select v_game_id,v_code,v_ai;
end $$;

create or replace function public.set_kaykha_practice_difficulty(p_game_id uuid,p_difficulty text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_difficulty not in ('easy','hard','mastermind') then raise exception 'سطح هوش مصنوعی نامعتبر است'; end if;
  update public.kaykha_games set practice_difficulty=p_difficulty,updated_at=now() where id=p_game_id and host_user_id=(select auth.uid()) and is_practice and status='active';
  if not found then raise exception 'تمرین فعال پیدا نشد'; end if;
  update public.kaykha_members set ai_difficulty=p_difficulty,ai_personality=case p_difficulty when 'easy' then 'reactive' when 'hard' then 'adaptive' else 'mastermind' end where game_id=p_game_id and is_ai;
end $$;

create or replace function public.resolve_kaykha_round(p_game_id uuid)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare v_game public.kaykha_games%rowtype;v_result jsonb;v_effect_count integer:=0;v_rows integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  create temp table if not exists kaykha_before_territories(entity_id text primary key,before_state jsonb) on commit drop;
  create temp table if not exists kaykha_before_members(entity_id text primary key,before_state jsonb) on commit drop;
  truncate kaykha_before_territories;truncate kaykha_before_members;
  insert into kaykha_before_territories select territory_id,to_jsonb(t) from public.kaykha_territories t where game_id=p_game_id;
  insert into kaykha_before_members select id::text,to_jsonb(m) from public.kaykha_members m where game_id=p_game_id;
  if v_game.is_practice then perform app_private.plan_kaykha_practice_ai(p_game_id,v_game.round_no);end if;
  v_result:=public.resolve_kaykha_round_core(p_game_id);
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,source_order_type,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'territory',t.territory_id,
    case when (b.before_state->>'owner_member_id') is distinct from (to_jsonb(t)->>'owner_member_id') then 'ownership_change'
      when coalesce((b.before_state->>'is_in_mutiny')::boolean,false)=false and t.is_in_mutiny then 'revolt'
      when coalesce((b.before_state->>'is_raided')::boolean,false)=false and t.is_raided then 'raid'
      when t.economy<coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_down'
      when t.economy>coalesce((b.before_state->>'economy')::integer,t.economy) then 'economy_up'
      when t.strength>coalesce((b.before_state->>'strength')::integer,t.strength) then 'reinforce'
      when t.strength<coalesce((b.before_state->>'strength')::integer,t.strength) then 'strength_loss' else 'territory_update' end,
    (select so.order_type from app_private.kaykha_secret_orders so where so.game_id=p_game_id and so.round_no=v_game.round_no and (so.target_territory_id=t.territory_id or so.origin_territory_id=t.territory_id) order by case when so.target_territory_id=t.territory_id then 0 else 1 end,so.locked_at desc limit 1),
    b.before_state,to_jsonb(t),jsonb_build_object('owner_before',b.before_state->'owner_member_id','owner_after',to_jsonb(t)->'owner_member_id','strength',t.strength-coalesce((b.before_state->>'strength')::integer,t.strength),'economy',t.economy-coalesce((b.before_state->>'economy')::integer,t.economy),'influence',t.influence-coalesce((b.before_state->>'influence')::integer,t.influence),'legitimacy',t.legitimacy-coalesce((b.before_state->>'legitimacy')::integer,t.legitimacy),'poverty',t.poverty-coalesce((b.before_state->>'poverty')::integer,t.poverty),'mutiny_before',b.before_state->'is_in_mutiny','mutiny_after',to_jsonb(t)->'is_in_mutiny','raided_before',b.before_state->'is_raided','raided_after',to_jsonb(t)->'is_raided')
  from public.kaykha_territories t join kaykha_before_territories b on b.entity_id=t.territory_id where t.game_id=p_game_id and b.before_state is distinct from to_jsonb(t);
  get diagnostics v_rows=row_count;v_effect_count:=v_effect_count+v_rows;
  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,before_state,after_state,delta)
  select p_game_id,v_game.round_no,'member',m.id::text,'member_update',b.before_state,to_jsonb(m),jsonb_build_object('coins',m.coins-coalesce((b.before_state->>'coins')::integer,m.coins),'prestige',m.prestige-coalesce((b.before_state->>'prestige')::integer,m.prestige),'influence_tokens',m.influence_tokens-coalesce((b.before_state->>'influence_tokens')::integer,m.influence_tokens),'reputation_score',m.reputation_score-coalesce((b.before_state->>'reputation_score')::integer,m.reputation_score),'bribe_tokens',m.bribe_tokens-coalesce((b.before_state->>'bribe_tokens')::integer,m.bribe_tokens),'suspicion_level',m.suspicion_level-coalesce((b.before_state->>'suspicion_level')::integer,m.suspicion_level))
  from public.kaykha_members m join kaykha_before_members b on b.entity_id=m.id::text where m.game_id=p_game_id and b.before_state is distinct from to_jsonb(m);
  get diagnostics v_rows=row_count;v_effect_count:=v_effect_count+v_rows;
  return v_result||jsonb_build_object('effect_events',v_effect_count,'shared_engine',true,'practice',v_game.is_practice);
end $$;

revoke all on function public.create_kaykha_practice_game(text,text,text,text) from public,anon;
revoke all on function public.set_kaykha_practice_difficulty(uuid,text) from public,anon;
revoke all on function public.resolve_kaykha_round(uuid) from public,anon;
grant execute on function public.create_kaykha_practice_game(text,text,text,text) to authenticated;
grant execute on function public.set_kaykha_practice_difficulty(uuid,text) to authenticated;
grant execute on function public.resolve_kaykha_round(uuid) to authenticated;

DO $$
begin
  begin alter publication supabase_realtime add table public.kaykha_games; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_territories; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_events; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_effect_events; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_contracts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.kaykha_loans; exception when duplicate_object then null; end;
end $$;