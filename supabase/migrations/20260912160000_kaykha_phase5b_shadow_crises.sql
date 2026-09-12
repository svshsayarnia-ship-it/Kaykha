
-- Kaykha Phase 5B: shadow-role activation and dynamic escalation.
-- Additive only. Existing mode rules and round resolution remain intact.

alter table public.kaykha_games
  add column if not exists outer_threat_level smallint not null default 0,
  add column if not exists winter_round integer not null default 8;

alter table public.kaykha_games
  drop constraint if exists kaykha_games_outer_threat_level_check,
  drop constraint if exists kaykha_games_winter_round_check;

alter table public.kaykha_games
  add constraint kaykha_games_outer_threat_level_check check (outer_threat_level between 0 and 5),
  add constraint kaykha_games_winter_round_check check (winter_round between 4 and 30);

alter table public.kaykha_territories
  add column if not exists legitimacy smallint not null default 50,
  add column if not exists poverty smallint not null default 0;

alter table public.kaykha_territories
  drop constraint if exists kaykha_territories_legitimacy_check,
  drop constraint if exists kaykha_territories_poverty_check;

alter table public.kaykha_territories
  add constraint kaykha_territories_legitimacy_check check (legitimacy between 0 and 100),
  add constraint kaykha_territories_poverty_check check (poverty between 0 and 100);

create table if not exists public.kaykha_crises (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null check (round_no >= 1),
  crisis_key text not null check (crisis_key in ('market_crash','peasant_rebellion','outer_threat')),
  severity smallint not null default 1 check (severity between 1 and 5),
  status text not null default 'active' check (status in ('active','resolved','failed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (game_id, round_no)
);

create index if not exists kaykha_crises_game_status_idx
  on public.kaykha_crises(game_id, status, round_no desc);

alter table public.kaykha_crises enable row level security;
drop policy if exists "game members read kaykha crises" on public.kaykha_crises;
create policy "game members read kaykha crises"
  on public.kaykha_crises for select to authenticated
  using (exists (
    select 1 from public.kaykha_members m
     where m.game_id = kaykha_crises.game_id
       and m.user_id = (select auth.uid())
  ));
revoke insert, update, delete on public.kaykha_crises from anon, authenticated;
grant select on public.kaykha_crises to authenticated;

create table if not exists public.kaykha_defense_pledges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null check (round_no >= 1),
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  amount integer not null check (amount between 1 and 200),
  status text not null default 'pledged' check (status in ('pledged','consumed','refunded')),
  created_at timestamptz not null default now(),
  unique (game_id, round_no, member_id)
);

create index if not exists kaykha_defense_pledges_game_round_idx
  on public.kaykha_defense_pledges(game_id, round_no, status);

alter table public.kaykha_defense_pledges enable row level security;
drop policy if exists "game members read defense pledges" on public.kaykha_defense_pledges;
create policy "game members read defense pledges"
  on public.kaykha_defense_pledges for select to authenticated
  using (exists (
    select 1 from public.kaykha_members m
     where m.game_id = kaykha_defense_pledges.game_id
       and m.user_id = (select auth.uid())
  ));
revoke insert, update, delete on public.kaykha_defense_pledges from anon, authenticated;
grant select on public.kaykha_defense_pledges to authenticated;

create table if not exists app_private.kaykha_city_neighbors (
  territory_id text not null,
  neighbor_id text not null,
  primary key (territory_id, neighbor_id),
  check (territory_id <> neighbor_id)
);

insert into app_private.kaykha_city_neighbors(territory_id, neighbor_id) values
  ('ray','ctesiphon'),('ctesiphon','ray'),
  ('ray','isfahan'),('isfahan','ray'),
  ('ray','gorgan'),('gorgan','ray'),
  ('ray','alamut'),('alamut','ray'),
  ('ctesiphon','susa'),('susa','ctesiphon'),
  ('ctesiphon','hormuz'),('hormuz','ctesiphon'),
  ('ctesiphon','isfahan'),('isfahan','ctesiphon'),
  ('isfahan','hegmataneh'),('hegmataneh','isfahan'),
  ('isfahan','shiraz'),('shiraz','isfahan'),
  ('isfahan','yazd'),('yazd','isfahan'),
  ('hegmataneh','tabriz'),('tabriz','hegmataneh'),
  ('hegmataneh','alamut'),('alamut','hegmataneh'),
  ('nishapur','merv'),('merv','nishapur'),
  ('nishapur','balkh'),('balkh','nishapur'),
  ('nishapur','yazd'),('yazd','nishapur'),
  ('merv','balkh'),('balkh','merv'),
  ('merv','zaranj'),('zaranj','merv'),
  ('balkh','zaranj'),('zaranj','balkh'),
  ('yazd','bam'),('bam','yazd'),
  ('yazd','shiraz'),('shiraz','yazd'),
  ('shiraz','bam'),('bam','shiraz'),
  ('hormuz','bam'),('bam','hormuz'),
  ('susa','shiraz'),('shiraz','susa'),
  ('susa','hormuz'),('hormuz','susa')
on conflict do nothing;

create index if not exists kaykha_city_neighbors_neighbor_idx
  on app_private.kaykha_city_neighbors(neighbor_id);
alter table app_private.kaykha_city_neighbors enable row level security;
revoke all on app_private.kaykha_city_neighbors from anon, authenticated;

create or replace function app_private.assign_kaykha_shadow_roles(p_game_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_count integer;
begin
  with eligible as (
    select m.id,
           row_number() over (order by md5(m.id::text || p_game_id::text), m.id) as position_no
      from public.kaykha_members m
     where m.game_id = p_game_id and not m.is_ai
       and not exists (
         select 1 from app_private.kaykha_shadow_roles s
          where s.game_id = p_game_id and s.member_id = m.id
       )
  ),
  roles(position_no, role_key) as (
    values (1,'banker'),(2,'logist'),(3,'whisperer')
  )
  insert into app_private.kaykha_shadow_roles(game_id, member_id, role_key)
  select p_game_id, e.id, r.role_key
    from eligible e
    join roles r on r.position_no = e.position_no
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create or replace function public.start_kaykha_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_traitor uuid;
  r record;
  v_city text;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if v_game.host_user_id<>(select auth.uid()) then raise exception 'فقط میزبان می‌تواند بازی را آغاز کند'; end if;
  if v_game.status<>'lobby' then raise exception 'بازی پیش‌تر آغاز شده است'; end if;
  if (select count(*) from public.kaykha_members m where m.game_id=v_game.id and not m.is_ai)<2 then raise exception 'برای آغاز بازی دست‌کم دو فرمانده لازم است'; end if;
  if (select count(*) from public.kaykha_members m where m.game_id=v_game.id and not m.is_ai)>6 then raise exception 'نقشهٔ فعلی بیش از شش فرمانده را پشتیبانی نمی‌کند'; end if;

  for r in
    select m.id,m.seat_no
      from public.kaykha_members m
     where m.game_id=v_game.id and not m.is_ai
       and not exists(select 1 from public.kaykha_territories t where t.game_id=v_game.id and t.owner_member_id=m.id)
     order by m.seat_no,m.id
  loop
    select t.territory_id into v_city
      from public.kaykha_territories t
     where t.game_id=v_game.id and t.owner_member_id is null
     order by case t.territory_id
       when 'ctesiphon' then 1 when 'isfahan' then 2 when 'hegmataneh' then 3 when 'nishapur' then 4
       when 'merv' then 5 when 'balkh' then 6 when 'yazd' then 7 when 'alamut' then 8 when 'tabriz' then 9
       when 'susa' then 10 when 'hormuz' then 11 when 'shiraz' then 12 when 'bam' then 13 when 'zaranj' then 14
       else 99 end, t.territory_id
     limit 1 for update;
    if v_city is null then raise exception 'برای یکی از فرماندهان قلمرو آغازین باقی نمانده است'; end if;
    update public.kaykha_territories
       set owner_member_id=r.id,
           strength=greatest(3,strength),
           economy=greatest(3,economy),
           legitimacy=greatest(40,legitimacy),
           revision=revision+1
     where game_id=v_game.id and territory_id=v_city;
  end loop;

  perform app_private.seed_kaykha_market(v_game.id);
  perform app_private.assign_kaykha_shadow_roles(v_game.id);

  if v_game.mode='invisible_guest' then
    select id into v_traitor
      from public.kaykha_members
     where game_id=v_game.id and not is_ai
     order by md5(id::text||v_game.id::text) limit 1;
    insert into app_private.kaykha_hidden_roles(game_id,member_id,role_key)
    values(v_game.id,v_traitor,'invisible_guest') on conflict do nothing;
  end if;

  update public.kaykha_games
     set status='active',phase='negotiation',round_no=1,updated_at=now()
   where id=v_game.id;

  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game.id,1,'neutral',
    case when v_game.mode='invisible_guest'
      then 'بازار مکاره گشوده شد؛ یک مهمان ناخوانده در میان پیمان‌ها نفس می‌کشد.'
      else 'بازار مکاره گشوده شد؛ هر فرمانده قلمرو آغازین خود را گرفت؛ زمان مذاکره، سند و پیمان است.'
    end);
end;
$function$;

create or replace function public.get_kaykha_market(p_game_id uuid, p_city_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_member_id uuid;
  v_is_whisperer boolean := false;
  v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select id into v_member_id
    from public.kaykha_members
   where game_id=p_game_id and user_id=(select auth.uid());
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;

  select exists(
    select 1 from app_private.kaykha_shadow_roles
     where game_id=p_game_id and member_id=v_member_id and role_key='whisperer'
  ) into v_is_whisperer;

  select jsonb_build_object(
    'tiles',coalesce((select jsonb_agg(jsonb_build_object(
      'position_no',mt.position_no,'resource_key',mt.resource_key,'zone_key',mt.zone_key,
      'visibility',mt.visibility,'base_income',mt.base_income,
      'deed',case when d.id is null then null else jsonb_build_object(
        'property_level',d.property_level,
        'owner_member_id',case when d.visibility='secret' and d.owner_member_id<>v_member_id and not v_is_whisperer then null else d.owner_member_id end,
        'owner_share',case when d.visibility='secret' and d.owner_member_id<>v_member_id and not v_is_whisperer then null else d.owner_share end,
        'is_protected',d.is_protected,'is_raided',d.is_raided
      ) end
    ) order by mt.position_no)
    from public.kaykha_market_tiles mt
    left join public.kaykha_deeds d on d.game_id=mt.game_id and d.city_id=mt.city_id and d.position_no=mt.position_no
    where mt.game_id=p_game_id and mt.city_id=trim(p_city_id)),'[]'::jsonb),
    'contracts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'contract_type',c.contract_type,'contract_level',c.contract_level,'status',c.status,
      'due_round',c.due_round,'terms',c.terms,'creator_member_id',c.creator_member_id,
      'counterparty_member_id',c.counterparty_member_id
    ) order by c.created_at desc)
    from public.kaykha_contracts c
    where c.game_id=p_game_id and c.status in ('open','active','defaulted')),'[]'::jsonb),
    'bounties',coalesce((select jsonb_agg(jsonb_build_object(
      'id',b.id,'bounty_type',b.bounty_type,'target_territory_id',b.target_territory_id,
      'reward_coins',b.reward_coins,'status',b.status,'claimant_member_id',b.claimant_member_id
    ) order by b.created_at desc)
    from public.kaykha_bounties b where b.game_id=p_game_id and b.status in ('open','claimed')),'[]'::jsonb),
    'whispers',coalesce((select jsonb_agg(jsonb_build_object(
      'id',w.id,'body',w.body,'recipient_member_id',w.recipient_member_id,'created_at',w.created_at
    ) order by w.created_at desc)
    from public.kaykha_whispers w
    where w.game_id=p_game_id and (w.recipient_member_id is null or w.recipient_member_id=v_member_id)
    limit 12),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$function$;

create or replace function public.get_kaykha_crisis(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if not exists (
    select 1 from public.kaykha_members
     where game_id=p_game_id and user_id=(select auth.uid())
  ) then raise exception 'شما عضو این تالار نیستید'; end if;

  select jsonb_build_object(
    'current', (
      select to_jsonb(c) from public.kaykha_crises c
       where c.game_id=p_game_id and c.status='active'
       order by c.round_no desc limit 1
    ),
    'history', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.round_no desc)
        from public.kaykha_crises c
       where c.game_id=p_game_id
    ), '[]'::jsonb),
    'outer_threat_level', (
      select g.outer_threat_level from public.kaykha_games g where g.id=p_game_id
    )
  ) into v_result;
  return v_result;
end;
$function$;

create or replace function public.get_kaykha_hegemony_scores(p_game_id uuid)
returns table (
  member_id uuid,
  display_name text,
  military_score integer,
  treasury_score integer,
  external_wealth_score integer,
  blood_contract_score integer,
  legitimacy_score integer,
  total_score integer
)
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if not exists (
    select 1 from public.kaykha_members
     where game_id=p_game_id and user_id=(select auth.uid())
  ) then raise exception 'شما عضو این تالار نیستید'; end if;

  return query
  select m.id,
         m.display_name,
         (
           coalesce((select sum(t.strength * 4) from public.kaykha_territories t
             where t.game_id=p_game_id and t.owner_member_id=m.id),0)
           + coalesce((select count(*) * 5 from public.kaykha_territories t
             where t.game_id=p_game_id and t.owner_member_id=m.id),0)
         )::integer,
         coalesce(m.coins,0)::integer,
         coalesce((select sum(mt.base_income * case d.property_level when 'stall' then 1 when 'merchant_house' then 2 else 3 end)
             from public.kaykha_deeds d
             join public.kaykha_market_tiles mt on mt.game_id=d.game_id and mt.city_id=d.city_id and mt.position_no=d.position_no
             left join public.kaykha_territories host on host.game_id=d.game_id and host.territory_id=d.city_id
            where d.game_id=p_game_id and d.owner_member_id=m.id and host.owner_member_id is distinct from m.id),0)::integer,
         coalesce((select count(*) * 6 from public.kaykha_contracts c
            where c.game_id=p_game_id and c.status in ('active','fulfilled') and c.contract_level='blood'
              and (c.creator_member_id=m.id or c.counterparty_member_id=m.id)),0)::integer,
         coalesce((select sum(t.legitimacy) from public.kaykha_territories t
            where t.game_id=p_game_id and t.owner_member_id=m.id),0)::integer,
         (
           coalesce((select sum(t.strength * 4) + count(*) * 5 from public.kaykha_territories t
             where t.game_id=p_game_id and t.owner_member_id=m.id),0)
           + coalesce(m.coins,0)
           + coalesce((select sum(mt.base_income * case d.property_level when 'stall' then 1 when 'merchant_house' then 2 else 3 end)
               from public.kaykha_deeds d
               join public.kaykha_market_tiles mt on mt.game_id=d.game_id and mt.city_id=d.city_id and mt.position_no=d.position_no
               left join public.kaykha_territories host on host.game_id=d.game_id and host.territory_id=d.city_id
              where d.game_id=p_game_id and d.owner_member_id=m.id and host.owner_member_id is distinct from m.id),0)
           + coalesce((select count(*) * 6 from public.kaykha_contracts c
              where c.game_id=p_game_id and c.status in ('active','fulfilled') and c.contract_level='blood'
                and (c.creator_member_id=m.id or c.counterparty_member_id=m.id)),0)
           + coalesce((select sum(t.legitimacy) from public.kaykha_territories t
              where t.game_id=p_game_id and t.owner_member_id=m.id),0)
         )::integer
    from public.kaykha_members m
   where m.game_id=p_game_id
   order by total_score desc, m.id;
end;
$function$;

create or replace function public.pledge_kaykha_defense(
  p_game_id uuid,
  p_amount integer
) returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_member_id uuid;
  v_crisis_id uuid;
  v_pledge_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'negotiation' then
    raise exception 'تعهد دفاعی فقط در فاز مذاکره ممکن است';
  end if;
  if p_amount not between 1 and 200 then raise exception 'مبلغ تعهد دفاعی نامعتبر است'; end if;

  select id into v_member_id from public.kaykha_members
   where game_id=p_game_id and user_id=(select auth.uid()) for update;
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;

  select id into v_crisis_id from public.kaykha_crises
   where game_id=p_game_id and round_no=v_game.round_no
     and crisis_key='outer_threat' and status='active'
   for update;
  if v_crisis_id is null then raise exception 'در این راند تهدید بیرونی فعالی وجود ندارد'; end if;

  update public.kaykha_members set coins=coins-p_amount
   where id=v_member_id and coins>=p_amount;
  if not found then raise exception 'سکهٔ کافی برای تعهد دفاعی ندارید'; end if;

  insert into public.kaykha_defense_pledges(game_id,round_no,member_id,amount)
  values(p_game_id,v_game.round_no,v_member_id,p_amount)
  on conflict (game_id,round_no,member_id)
  do update set amount=public.kaykha_defense_pledges.amount+excluded.amount
  returning id into v_pledge_id;

  return v_pledge_id;
end;
$function$;

create or replace function app_private.advance_kaykha_crises(p_game_id uuid, p_round integer)
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_crisis_id uuid;
  v_key text;
  v_resource text;
  v_target text;
  v_required integer;
  v_pledged integer;
  v_idx integer;
  v_actions integer := 0;
  r record;
begin
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' then return 0; end if;

  -- Repair and close one-round market shocks.
  for r in
    select * from public.kaykha_crises
     where game_id=p_game_id and status='active' and crisis_key='market_crash' and round_no<p_round
     for update
  loop
    for r in
      select value->>'city_id' as city_id,
             (value->>'position_no')::smallint as position_no,
             (value->>'base_income')::smallint as base_income
        from jsonb_array_elements(coalesce(r.payload->'tiles','[]'::jsonb))
    loop
      update public.kaykha_market_tiles
         set base_income=r.base_income
       where game_id=p_game_id and city_id=r.city_id and position_no=r.position_no;
    end loop;
    update public.kaykha_crises set status='resolved',resolved_at=now() where id=r.id;
    v_actions:=v_actions+1;
  end loop;

  -- A mutiny spreads one neighbor per round and removes control if it survives.
  update public.kaykha_territories target
     set is_in_mutiny=true,
         mutiny_round=p_round,
         poverty=least(100,target.poverty+12),
         legitimacy=greatest(0,target.legitimacy-10),
         economy=greatest(0,target.economy-1),
         revision=target.revision+1
    where target.game_id=p_game_id
      and not target.is_in_mutiny
      and exists (
        select 1
          from public.kaykha_territories source
          join app_private.kaykha_city_neighbors n
            on n.territory_id=source.territory_id and n.neighbor_id=target.territory_id
         where source.game_id=p_game_id and source.is_in_mutiny and source.mutiny_round=p_round-1
      );
  if found then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'danger','شورش دهقانان از شهر همسایه گذشت و به شهر دیگری سرایت کرد.');
    v_actions:=v_actions+1;
  end if;

  update public.kaykha_territories
     set owner_member_id=null,
         strength=greatest(1,strength-1),
         economy=greatest(0,economy-1),
         legitimacy=greatest(0,legitimacy-20),
         revision=revision+1
   where game_id=p_game_id and is_in_mutiny and mutiny_round<p_round and owner_member_id is not null;
  if found then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'danger','شورشِ بی‌پاسخ، کنترل یک شهر را از خاندان گرفت.');
    v_actions:=v_actions+1;
  end if;

  -- Tax pressure changes poverty and legitimacy every dawn.
  update public.kaykha_territories
     set poverty=least(100,poverty+greatest(0,zone_tax::integer)+case when economy<=2 then 5 else 0 end),
         legitimacy=greatest(0,legitimacy-greatest(0,zone_tax::integer-1)+case when economy>=5 and zone_tax=0 then 2 else 0 end)
   where game_id=p_game_id and owner_member_id is not null;
  v_actions:=v_actions+1;

  -- Resolve the previous outer threat after the negotiation window closes.
  for r in
    select c.*,
           coalesce((select sum(p.amount) from public.kaykha_defense_pledges p
             where p.game_id=c.game_id and p.round_no=c.round_no and p.status='pledged'),0)::integer as pledged
      from public.kaykha_crises c
     where c.game_id=p_game_id and c.status='active' and c.crisis_key='outer_threat' and c.round_no<p_round
     for update
  loop
    v_required:=coalesce((r.payload->>'required_coins')::integer,12);
    if r.pledged>=v_required then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'defense','بودجهٔ دفاعی کامل شد؛ تهدید بیرونی پشت مرزها متوقف ماند.');
      update public.kaykha_crises set status='resolved',resolved_at=now() where id=r.id;
    else
      select territory_id into v_target
        from public.kaykha_territories
       where game_id=p_game_id and territory_id in ('merv','balkh','nishapur','ctesiphon','hormuz')
       order by legitimacy asc,economy asc,territory_id limit 1;
      update public.kaykha_territories
         set strength=greatest(1,strength-2),
             economy=greatest(0,economy-1),
             legitimacy=greatest(0,legitimacy-12),
             revision=revision+1
       where game_id=p_game_id and territory_id=v_target;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','بودجهٔ دفاعی ناکافی بود؛ تهدید بیرونی به مرزهای امپراتوری ضربه زد.');
      update public.kaykha_crises set status='failed',resolved_at=now() where id=r.id;
    end if;
    update public.kaykha_defense_pledges set status='consumed'
     where game_id=p_game_id and round_no=r.round_no and status='pledged';
    v_actions:=v_actions+1;
  end loop;

  -- Every third round a new crisis is born; round six always opens the outer threat.
  if p_round>=3 and not exists (
    select 1 from public.kaykha_crises where game_id=p_game_id and round_no=p_round
  ) then
    v_idx:=1+mod(abs(hashtext(p_game_id::text||':'||p_round::text)),3);
    if p_round>=6 and mod(p_round,3)=0 then
      v_key:='outer_threat';
    elsif v_idx=1 then
      v_key:='market_crash';
    elsif v_idx=2 then
      v_key:='peasant_rebellion';
    else
      v_key:='market_crash';
    end if;

    if v_key='market_crash' then
      v_idx:=1+mod(abs(hashtext(p_game_id::text||':resource:'||p_round::text)),5);
      v_resource:=(array['silk','copper','carpet','herbs','armor'])[v_idx];
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      select p_game_id,p_round,'market_crash',2,
        jsonb_build_object('resource_key',v_resource,'tiles',
          coalesce(jsonb_agg(jsonb_build_object(
            'city_id',mt.city_id,'position_no',mt.position_no,'base_income',mt.base_income
          )),'[]'::jsonb))
        from public.kaykha_market_tiles mt
       where mt.game_id=p_game_id and mt.resource_key=v_resource
      returning id into v_crisis_id;

      update public.kaykha_market_tiles
         set base_income=0
       where game_id=p_game_id and resource_key=v_resource;

      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'market','سقوط بازار: ارزش یک کالای کلیدی در سراسر امپراتوری برای یک راند به صفر رسید.');
    elsif v_key='peasant_rebellion' then
      select territory_id into v_target
        from public.kaykha_territories
       where game_id=p_game_id and owner_member_id is not null
       order by (poverty + case when economy<=2 then 25 else 0 end) desc,
                legitimacy asc, territory_id limit 1 for update;
      update public.kaykha_territories
         set is_in_mutiny=true,mutiny_round=p_round,
             poverty=least(100,poverty+25),
             legitimacy=greatest(0,legitimacy-18),
             revision=revision+1
       where game_id=p_game_id and territory_id=v_target;
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      values(p_game_id,p_round,'peasant_rebellion',3,jsonb_build_object('target_territory_id',v_target))
      returning id into v_crisis_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','شورش دهقانان آغاز شد؛ اگر سرکوب نشود، در سپیده‌دم بعدی سرایت می‌کند.');
    else
      v_required:=12+greatest(0,v_game.outer_threat_level)*4;
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      values(p_game_id,p_round,'outer_threat',greatest(2,least(5,v_game.outer_threat_level+2)),
             jsonb_build_object('required_coins',v_required))
      returning id into v_crisis_id;
      update public.kaykha_games
         set outer_threat_level=least(5,outer_threat_level+1),updated_at=now()
       where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','تهدید انیران از مرز برخاست؛ دیوان باید بودجهٔ دفاعی را تأمین کند.');
    end if;
    v_actions:=v_actions+1;
  end if;

  return v_actions;
end;
$function$;

create or replace function app_private.kaykha_after_round_resolution()
returns trigger
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  if old.phase = 'orders' and new.phase = 'negotiation' and new.round_no = old.round_no + 1 then
    perform app_private.resolve_kaykha_loans(old.id, old.round_no);
    perform app_private.enforce_kaykha_blood_contracts(old.id, old.round_no);
    perform app_private.advance_kaykha_crises(new.id, new.round_no);
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_interdependency_after_round on public.kaykha_games;
create trigger kaykha_interdependency_after_round
after update of phase, round_no on public.kaykha_games
for each row execute function app_private.kaykha_after_round_resolution();revoke execute on function public.get_kaykha_crisis(uuid) from public, anon;
revoke execute on function public.get_kaykha_hegemony_scores(uuid) from public, anon;
revoke execute on function public.pledge_kaykha_defense(uuid,integer) from public, anon;
grant execute on function public.get_kaykha_crisis(uuid) to authenticated;
grant execute on function public.get_kaykha_hegemony_scores(uuid) to authenticated;
grant execute on function public.pledge_kaykha_defense(uuid,integer) to authenticated;
