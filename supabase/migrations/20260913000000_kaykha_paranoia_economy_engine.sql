-- Kaykha: deterministic paranoia, Baha economy, compensatory balance,
-- blind investigation, weaponized Safteh, and generational inheritance.

alter table public.kaykha_members
  add column if not exists bribe_tokens integer not null default 2,
  add column if not exists search_tokens integer not null default 2,
  add column if not exists suspicion_level smallint not null default 0,
  add column if not exists generation_no integer not null default 1;

do $$ begin
  alter table public.kaykha_members add constraint kaykha_members_bribe_tokens_check check (bribe_tokens between 0 and 99);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.kaykha_members add constraint kaykha_members_search_tokens_check check (search_tokens between 0 and 99);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.kaykha_members add constraint kaykha_members_suspicion_check check (suspicion_level between 0 and 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.kaykha_members add constraint kaykha_members_generation_check check (generation_no between 1 and 99);
exception when duplicate_object then null; end $$;

create table if not exists public.kaykha_house_roles (
  house_id text primary key,
  role_key text not null unique,
  title_fa text not null,
  domain text not null check (domain in ('military','defense','economy','market','politics','espionage','logistics','legitimacy')),
  weights jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.kaykha_house_roles(house_id,role_key,title_fa,domain,weights) values
('هخامنشیان','imperial_mandate','فرمانروای شاهنشاهی','politics','{"politics":1.00,"legitimacy":0.75}'),
('اشکانیان','parthian_return','سوار بازگشت‌ناپذیر','military','{"military":1.00,"logistics":0.65}'),
('ساسانیان','imperial_banker','بانکدار امپراتوری','economy','{"economy":1.00,"politics":0.55}'),
('سورن','war_reaver','غارتگر جنگ','military','{"military":1.00,"economy":0.60}'),
('کارن','mountain_bastion','دژبان کوهستان','defense','{"defense":1.00,"legitimacy":0.65}'),
('مهران','diwan_broker','میانجی دیوان','politics','{"politics":1.00,"defense":0.50}'),
('وراز','scorched_marshal','سالار زمین سوخته','military','{"military":0.85,"logistics":0.80}'),
('اسپینداد','sacred_firewall','نگهبان آتش مقدس','defense','{"defense":0.80,"espionage":0.80}'),
('زیک','invisible_factor','عامل نامرئی بازار','market','{"market":1.00,"espionage":0.55}'),
('نهابد','iron_banker','بانکدار آهنین','economy','{"economy":1.00,"politics":0.55}'),
('طاهریان','silent_extractor','استخراج‌گر خاموش','economy','{"economy":0.80,"espionage":0.75}'),
('صفاریان','rebel_buyer','خریدار شورش','legitimacy','{"legitimacy":0.90,"military":0.65}'),
('سامانیان','silk_artery','نگهبان شریان ابریشم','logistics','{"logistics":1.00,"market":0.60}'),
('آل‌بویه','crown_maker','تاج‌بخش','politics','{"politics":0.90,"military":0.55}'),
('باوندیان','self_sufficient_lord','سالار خودکفا','defense','{"defense":0.85,"economy":0.70}'),
('زیاریان','border_tollmaster','باج‌گیر مرز','market','{"market":0.90,"logistics":0.70}')
on conflict (house_id) do update set role_key=excluded.role_key,title_fa=excluded.title_fa,
 domain=excluded.domain,weights=excluded.weights,updated_at=now();

alter table public.kaykha_house_roles enable row level security;
drop policy if exists kaykha_house_roles_read on public.kaykha_house_roles;
create policy kaykha_house_roles_read on public.kaykha_house_roles for select to authenticated using (true);
revoke all on public.kaykha_house_roles from public, anon;
grant select on public.kaykha_house_roles to authenticated;

create table if not exists app_private.kaykha_counter_orders (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null check (round_no >= 1), member_id uuid not null references public.kaykha_members(id) on delete cascade,
  counter_type text not null check (counter_type in ('track_route','blind_route','checkpoint','counter_intel')),
  territory_id text not null, strength smallint not null check (strength between 1 and 20),
  cost jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique(game_id,round_no,member_id,counter_type,territory_id)
);
create index if not exists kaykha_counter_orders_round_idx on app_private.kaykha_counter_orders(game_id,round_no,territory_id);
alter table app_private.kaykha_counter_orders enable row level security;
revoke all on app_private.kaykha_counter_orders from public,anon,authenticated;

create table if not exists app_private.kaykha_searches (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.kaykha_games(id) on delete cascade,
  investigator_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  submitted_round integer not null check (submitted_round >= 1), window_round integer not null check (window_round >= 1),
  territory_id text not null, action_family text not null check (action_family in ('any','military','espionage','economy','politics')),
  tokens_burned smallint not null check (tokens_burned between 1 and 3), status text not null default 'pending'
    check (status in ('pending','resolved')),
  result_code text, result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), resolved_at timestamptz,
  unique(game_id,investigator_member_id,submitted_round,territory_id,action_family)
);
create index if not exists kaykha_searches_resolve_idx on app_private.kaykha_searches(game_id,window_round,status);
alter table app_private.kaykha_searches enable row level security;
revoke all on app_private.kaykha_searches from public,anon,authenticated;

create table if not exists public.kaykha_compensations (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.kaykha_games(id) on delete cascade,
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  round_no integer not null, lost_domain text not null, granted_domain text not null,
  lost_weight numeric(6,3) not null check (lost_weight > 0), granted_weight numeric(6,3) not null check (granted_weight > 0),
  expires_round integer not null, source_key text not null, created_at timestamptz not null default now()
);
alter table public.kaykha_compensations enable row level security;
drop policy if exists kaykha_compensations_read on public.kaykha_compensations;
create policy kaykha_compensations_read on public.kaykha_compensations for select to authenticated
using (exists(select 1 from public.kaykha_members me where me.game_id=kaykha_compensations.game_id and me.user_id=(select auth.uid())));
revoke all on public.kaykha_compensations from public,anon;
grant select on public.kaykha_compensations to authenticated;

create table if not exists public.kaykha_member_traits (
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  trait_key text not null, generation_no integer not null, potency smallint not null check (potency between 1 and 100),
  locked boolean not null default false, source text not null default 'founder', updated_at timestamptz not null default now(),
  primary key(member_id,trait_key)
);
alter table public.kaykha_member_traits enable row level security;
drop policy if exists kaykha_member_traits_game_read on public.kaykha_member_traits;
create policy kaykha_member_traits_game_read on public.kaykha_member_traits for select to authenticated using (
 exists(select 1 from public.kaykha_members owner join public.kaykha_members me on me.game_id=owner.game_id
 where owner.id=kaykha_member_traits.member_id and me.user_id=(select auth.uid())));
revoke all on public.kaykha_member_traits from public,anon;
grant select on public.kaykha_member_traits to authenticated;

alter table public.kaykha_loans
  add column if not exists current_holder_member_id uuid references public.kaykha_members(id),
  add column if not exists market_price integer,
  add column if not exists leverage_points smallint not null default 0,
  add column if not exists income_share_bps smallint not null default 0;
do $$ begin alter table public.kaykha_loans add constraint kaykha_loans_market_price_check check (market_price is null or market_price between 1 and 999);
exception when duplicate_object then null; end $$;
do $$ begin alter table public.kaykha_loans add constraint kaykha_loans_leverage_check check (leverage_points between 0 and 20);
exception when duplicate_object then null; end $$;
do $$ begin alter table public.kaykha_loans add constraint kaykha_loans_income_share_check check (income_share_bps between 0 and 4000);
exception when duplicate_object then null; end $$;
update public.kaykha_loans set current_holder_member_id=lender_member_id where current_holder_member_id is null;

create or replace function public.quote_kaykha_baha(p_game_id uuid,p_action_type text,p_base_gold integer,p_impact numeric default 1)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare m public.kaykha_members%rowtype; v_income integer; v_power integer; v_gold integer; v_illicit boolean;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into m from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
 if not found then raise exception 'شما عضو این تالار نیستید'; end if;
 if p_base_gold not between 0 and 500 or p_impact not between 0.1 and 5 then raise exception 'پارامتر هزینه نامعتبر است'; end if;
 select coalesce(sum(economy),0)::integer,coalesce(sum(strength+influence),0)::integer into v_income,v_power
 from public.kaykha_territories where game_id=p_game_id and owner_member_id=m.id;
 v_illicit:=p_action_type in ('spy','sabotage','assassination','black_market','mask_chapar');
 v_gold:=ceil(p_base_gold*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12))*p_impact);
 return jsonb_build_object('gold',least(999,v_gold),'credibility',case when v_illicit then ceil(p_impact*2) else 0 end,
  'bribe_tokens',case when p_action_type in ('spy','assassination','mask_chapar') then greatest(1,ceil(p_impact)::int) else 0 end,
  'suspicion',case p_action_type when 'assassination' then 24 when 'black_market' then 13 when 'sabotage' then 16 when 'spy' then 9 else 0 end,
  'formula_revision',1,'income_score',v_income,'power_score',v_power);
end $$;
revoke all on function public.quote_kaykha_baha(uuid,text,integer,numeric) from public,anon;
grant execute on function public.quote_kaykha_baha(uuid,text,integer,numeric) to authenticated;

create or replace function public.commit_kaykha_counter(p_game_id uuid,p_counter_type text,p_territory_id text,p_strength integer default 1)
returns uuid language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare g public.kaykha_games%rowtype; m public.kaykha_members%rowtype; v_id uuid; v_cost integer;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into g from public.kaykha_games where id=p_game_id for update;
 if not found or g.status<>'active' or g.phase not in ('negotiation','orders') then raise exception 'اکنون زمان آماده‌سازی ضدعملیات نیست'; end if;
 select * into m from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
 if not found then raise exception 'شما عضو این تالار نیستید'; end if;
 if p_counter_type not in ('track_route','blind_route','checkpoint','counter_intel') or p_strength not between 1 and 3 then raise exception 'ضدعملیات نامعتبر است'; end if;
 if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_territory_id) then raise exception 'شهر نامعتبر است'; end if;
 v_cost:=p_strength*2;
 if m.influence_tokens<v_cost then raise exception 'نفوذ کافی ندارید'; end if;
 update public.kaykha_members set influence_tokens=influence_tokens-v_cost where id=m.id;
 insert into app_private.kaykha_counter_orders(game_id,round_no,member_id,counter_type,territory_id,strength,cost)
 values(p_game_id,g.round_no,m.id,p_counter_type,p_territory_id,p_strength,jsonb_build_object('influence',v_cost))
 on conflict(game_id,round_no,member_id,counter_type,territory_id) do update set strength=excluded.strength,cost=excluded.cost,created_at=now()
 returning id into v_id; return v_id;
end $$;
revoke all on function public.commit_kaykha_counter(uuid,text,text,integer) from public,anon;
grant execute on function public.commit_kaykha_counter(uuid,text,text,integer) to authenticated;

create or replace function public.submit_kaykha_blind_search(p_game_id uuid,p_territory_id text,p_action_family text default 'any',p_window_round integer default null,p_tokens integer default 1)
returns uuid language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare g public.kaykha_games%rowtype; m public.kaykha_members%rowtype; v_id uuid; v_window integer;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into g from public.kaykha_games where id=p_game_id for update;
 if not found or g.status<>'active' then raise exception 'تالار فعال نیست'; end if;
 select * into m from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
 if not found then raise exception 'شما عضو این تالار نیستید'; end if;
 if p_action_family not in ('any','military','espionage','economy','politics') or p_tokens not between 1 and 3 then raise exception 'دامنهٔ جست‌وجو نامعتبر است'; end if;
 if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_territory_id) then raise exception 'شهر نامعتبر است'; end if;
 v_window:=coalesce(p_window_round,g.round_no);
 if v_window not between greatest(1,g.round_no-1) and g.round_no then raise exception 'فقط راند جاری یا قبلی قابل جست‌وجو است'; end if;
 if m.search_tokens<p_tokens then raise exception 'مهر جست‌وجوی کافی ندارید'; end if;
 update public.kaykha_members set search_tokens=search_tokens-p_tokens where id=m.id;
 insert into app_private.kaykha_searches(game_id,investigator_member_id,submitted_round,window_round,territory_id,action_family,tokens_burned)
 values(p_game_id,m.id,g.round_no,v_window,p_territory_id,p_action_family,p_tokens)
 on conflict(game_id,investigator_member_id,submitted_round,territory_id,action_family) do nothing returning id into v_id;
 if v_id is null then raise exception 'این حدس را در این راند قبلاً جست‌وجو کرده‌اید'; end if;
 return v_id;
end $$;
revoke all on function public.submit_kaykha_blind_search(uuid,text,text,integer,integer) from public,anon;
grant execute on function public.submit_kaykha_blind_search(uuid,text,text,integer,integer) to authenticated;

create or replace function public.get_kaykha_search_results(p_game_id uuid)
returns table(id uuid,submitted_round integer,window_round integer,territory_id text,action_family text,tokens_burned smallint,status text,result_code text,result_payload jsonb,created_at timestamptz,resolved_at timestamptz)
language sql security definer set search_path=public,app_private,pg_temp as $$
 select s.id,s.submitted_round,s.window_round,s.territory_id,s.action_family,s.tokens_burned,s.status,s.result_code,s.result_payload,s.created_at,s.resolved_at
 from app_private.kaykha_searches s join public.kaykha_members m on m.id=s.investigator_member_id
 where s.game_id=p_game_id and m.user_id=(select auth.uid()) order by s.created_at desc limit 30
$$;
revoke all on function public.get_kaykha_search_results(uuid) from public,anon;
grant execute on function public.get_kaykha_search_results(uuid) to authenticated;

create or replace function app_private.resolve_kaykha_searches(p_game_id uuid,p_round integer)
returns integer language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare s record; v_hits integer; v_signal integer; v_cover integer; v_counter integer; v_score integer; v_code text; v_payload jsonb; v_done integer:=0;
begin
 for s in select * from app_private.kaykha_searches where game_id=p_game_id and window_round=p_round and status='pending' order by created_at,id for update
 loop
   select count(*)::integer,
     coalesce(max(case so.order_type when 'attack' then 18 when 'sabotage' then 16 when 'spy' then 14 when 'raid' then 13 else 10 end),0),
     coalesce(max(case when coalesce((so.payload->>'masked')::boolean,false) then 14+coalesce((so.payload->>'bribe_tokens')::integer,0)*6 else 0 end),0)
   into v_hits,v_signal,v_cover
   from app_private.kaykha_secret_orders so
   where so.game_id=p_game_id and so.round_no=p_round
     and (so.origin_territory_id=s.territory_id or so.target_territory_id=s.territory_id)
     and so.member_id<>s.investigator_member_id
     and (s.action_family='any' or
       (s.action_family='military' and so.order_type in ('attack','defend','support','raid','revolt')) or
       (s.action_family='espionage' and so.order_type in ('spy','sabotage','spell')) or
       (s.action_family='economy' and so.order_type in ('trade','caravan','raid')) or
       (s.action_family='politics' and so.order_type in ('support','revolt')));
   select coalesce(sum(strength*case counter_type when 'blind_route' then 7 when 'counter_intel' then 6 else 3 end),0)::integer into v_counter
   from app_private.kaykha_counter_orders where game_id=p_game_id and round_no=p_round and territory_id=s.territory_id
     and member_id<>s.investigator_member_id;
   v_score:=s.tokens_burned*16+v_signal-v_cover-v_counter;
   if v_hits=0 then v_code:='no_actionable_trace'; v_payload=jsonb_build_object('certainty','none','message','هیچ رد قابل اتکایی پیدا نشد؛ این نتیجه ثابت نمی‌کند که اتفاقی نیفتاده است.');
   elsif v_score>=34 then v_code:='strong_trace'; v_payload=jsonb_build_object('certainty','strong','message','رد معناداری در محدودهٔ حدس تو پیدا شد.','family',s.action_family,'round',p_round);
   elsif v_score>=20 then v_code:='weak_trace'; v_payload=jsonb_build_object('certainty','weak','message','نشانه‌ای مبهم پیدا شد؛ برای نسبت‌دادن آن به یک فرمانده کافی نیست.','round',p_round);
   else v_code:='no_actionable_trace'; v_payload=jsonb_build_object('certainty','none','message','جست‌وجو به نتیجهٔ قابل اتکا نرسید.'); end if;
   update app_private.kaykha_searches set status='resolved',result_code=v_code,result_payload=v_payload,resolved_at=now() where id=s.id;
   v_done:=v_done+1;
 end loop; return v_done;
end $$;
revoke all on function app_private.resolve_kaykha_searches(uuid,integer) from public,anon,authenticated;

create or replace function app_private.update_kaykha_paranoia(p_game_id uuid,p_round integer)
returns integer language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare r record; v_delta integer; v_count integer:=0;
begin
 for r in select so.member_id,sum(case so.order_type when 'sabotage' then 16 when 'spy' then 9 when 'raid' then 8 when 'spell' then 11 else 0 end)::integer delta
   from app_private.kaykha_secret_orders so where so.game_id=p_game_id and so.round_no=p_round
   group by so.member_id having sum(case so.order_type when 'sabotage' then 16 when 'spy' then 9 when 'raid' then 8 when 'spell' then 11 else 0 end)>0
 loop
   v_delta:=greatest(1,r.delta-coalesce((select sum(strength*2) from app_private.kaykha_counter_orders c where c.game_id=p_game_id and c.round_no=p_round and c.member_id=r.member_id and c.counter_type='blind_route'),0));
   update public.kaykha_members set suspicion_level=least(100,greatest(0,suspicion_level+v_delta-2)) where id=r.member_id;
   if (select suspicion_level from public.kaykha_members where id=r.member_id)>=85 then
     update public.kaykha_members set reputation_score=greatest(0,reputation_score-8),influence_tokens=greatest(0,influence_tokens-2) where id=r.member_id;
     insert into app_private.kaykha_intel(game_id,member_id,round_no,target_territory_id,target_member_id,intel)
     values(p_game_id,r.member_id,p_round,'دیوان',r.member_id,jsonb_build_object('kind','audit','message','حسابرسی دیوان آغاز شد؛ اعتبار و نفوذ تو کاهش یافت.'));
   end if; v_count:=v_count+1;
 end loop;
 update public.kaykha_members set suspicion_level=greatest(0,suspicion_level-3) where game_id=p_game_id and id not in
  (select member_id from app_private.kaykha_secret_orders where game_id=p_game_id and round_no=p_round and order_type in ('sabotage','spy','raid','spell'));
 return v_count;
end $$;
revoke all on function app_private.update_kaykha_paranoia(uuid,integer) from public,anon,authenticated;

create or replace function app_private.record_kaykha_capability_loss(p_game_id uuid,p_member_id uuid,p_round integer,p_lost_domain text,p_lost_weight numeric,p_source_key text)
returns uuid language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare v_domain text; v_id uuid; v_grant numeric;
begin
 if p_lost_domain not in ('military','defense','economy','market','politics','espionage','logistics','legitimacy') or p_lost_weight<=0 then raise exception 'تعادل جبرانی نامعتبر است'; end if;
 select d into v_domain from (values ('military'),('defense'),('economy'),('market'),('politics'),('espionage'),('logistics'),('legitimacy')) x(d)
 where d<>p_lost_domain order by coalesce((select sum(c.granted_weight) from public.kaykha_compensations c where c.game_id=p_game_id and c.member_id=p_member_id and c.granted_domain=d and c.expires_round>=p_round),0),d limit 1;
 v_grant:=round(p_lost_weight*0.78,3);
 insert into public.kaykha_compensations(game_id,member_id,round_no,lost_domain,granted_domain,lost_weight,granted_weight,expires_round,source_key)
 values(p_game_id,p_member_id,p_round,p_lost_domain,v_domain,p_lost_weight,v_grant,p_round+2,p_source_key) returning id into v_id;
 return v_id;
end $$;
revoke all on function app_private.record_kaykha_capability_loss(uuid,uuid,integer,text,numeric,text) from public,anon,authenticated;

create or replace function public.purchase_kaykha_safteh(p_loan_id uuid)
returns void language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare l public.kaykha_loans%rowtype; buyer public.kaykha_members%rowtype; v_price integer;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into l from public.kaykha_loans where id=p_loan_id for update;
 if not found or l.status<>'defaulted' then raise exception 'این سفته در بازار بدهی عرضه نشده است'; end if;
 select * into buyer from public.kaykha_members where game_id=l.game_id and user_id=(select auth.uid()) and not is_ai for update;
 if not found or buyer.id=l.borrower_member_id then raise exception 'خریدار سفته نامعتبر است'; end if;
 v_price:=coalesce(l.market_price,greatest(1,ceil((l.principal+l.interest_coins)*0.65)::int));
 if buyer.coins<v_price then raise exception 'سکهٔ کافی برای خرید سفته ندارید'; end if;
 update public.kaykha_members set coins=coins-v_price where id=buyer.id;
 update public.kaykha_members set coins=least(999,coins+v_price) where id=coalesce(l.current_holder_member_id,l.lender_member_id);
 update public.kaykha_loans set current_holder_member_id=buyer.id,market_price=v_price,leverage_points=greatest(leverage_points,3),income_share_bps=1000 where id=l.id;
end $$;
revoke all on function public.purchase_kaykha_safteh(uuid) from public,anon;
grant execute on function public.purchase_kaykha_safteh(uuid) to authenticated;

create or replace function public.exercise_kaykha_leverage(p_loan_id uuid,p_leverage_type text)
returns void language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare l public.kaykha_loans%rowtype; h uuid; v_round integer; v_cost integer;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into l from public.kaykha_loans where id=p_loan_id for update;
 if not found or l.status<>'defaulted' then raise exception 'اهرم این سفته فعال نیست'; end if;
 select id into h from public.kaykha_members where id=l.current_holder_member_id and user_id=(select auth.uid()) for update;
 if h is null then raise exception 'فقط دارندهٔ فعلی سفته حق استفاده از اهرم را دارد'; end if;
 v_cost:=case p_leverage_type when 'tax_income' then 1 when 'damage_credibility' then 1 when 'bind_vote' then 2 else 99 end;
 if l.leverage_points<v_cost then raise exception 'امتیاز اهرم کافی نیست'; end if;
 select round_no into v_round from public.kaykha_games where id=l.game_id;
 if p_leverage_type='tax_income' then update public.kaykha_loans set income_share_bps=least(2500,income_share_bps+500) where id=l.id;
 elsif p_leverage_type='damage_credibility' then update public.kaykha_members set reputation_score=greatest(0,reputation_score-6) where id=l.borrower_member_id;
 elsif p_leverage_type='bind_vote' then insert into app_private.kaykha_effect_states(game_id,round_no,effect_key,source_member_id,target_member_id,expires_round,payload)
   values(l.game_id,v_round,'safteh.vote_obligation',h,l.borrower_member_id,v_round+1,jsonb_build_object('loan_id',l.id));
 else raise exception 'نوع اهرم نامعتبر است'; end if;
 update public.kaykha_loans set leverage_points=leverage_points-v_cost where id=l.id;
end $$;
revoke all on function public.exercise_kaykha_leverage(uuid,text) from public,anon;
grant execute on function public.exercise_kaykha_leverage(uuid,text) to authenticated;

create or replace function public.advance_kaykha_generation(p_game_id uuid)
returns jsonb language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare m public.kaykha_members%rowtype; t record; v_new integer; v_shift integer; v_count integer:=0;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 select * into m from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
 if not found then raise exception 'شما عضو این تالار نیستید'; end if;
 v_new:=m.generation_no+1;
 for t in select * from public.kaykha_member_traits where member_id=m.id for update loop
   v_shift:=(get_byte(decode(substr(md5(p_game_id::text||m.id::text||v_new::text||t.trait_key),1,2),'hex'),0)%9)-4;
   update public.kaykha_member_traits set generation_no=v_new,potency=least(100,greatest(1,round(potency*0.82)::int+v_shift)),
    source=case when v_shift>=3 then 'mutation_strengthened' when v_shift<=-3 then 'mutation_decayed' else 'inherited' end,updated_at=now()
   where member_id=m.id and trait_key=t.trait_key; v_count:=v_count+1;
 end loop;
 update public.kaykha_members set generation_no=v_new,suspicion_level=greatest(0,suspicion_level-15),reputation_score=least(100,reputation_score+3) where id=m.id;
 return jsonb_build_object('generation',v_new,'traits_transferred',v_count);
end $$;
revoke all on function public.advance_kaykha_generation(uuid) from public,anon;
grant execute on function public.advance_kaykha_generation(uuid) to authenticated;

create or replace function app_private.kaykha_paranoia_after_round()
returns trigger language plpgsql security definer set search_path=public,app_private,pg_temp as $$
begin
 if old.phase='orders' and new.phase='negotiation' and new.round_no=old.round_no+1 then
   perform app_private.resolve_kaykha_searches(new.id,old.round_no);
   perform app_private.update_kaykha_paranoia(new.id,old.round_no);
   update public.kaykha_members set search_tokens=least(5,search_tokens+1),bribe_tokens=least(8,bribe_tokens+case when new.round_no%2=0 then 1 else 0 end) where game_id=new.id;
 end if; return new;
end $$;
drop trigger if exists kaykha_z_paranoia_after_round on public.kaykha_games;
create trigger kaykha_z_paranoia_after_round after update of phase,round_no on public.kaykha_games
for each row execute function app_private.kaykha_paranoia_after_round();

revoke execute on function app_private.kaykha_paranoia_after_round() from public,anon,authenticated;

