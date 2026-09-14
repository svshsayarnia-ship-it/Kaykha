-- Kaykha independent role engine: server-authoritative, one role action per round,
-- bounded state mutations, private memory, and no current sealed-order leakage.

create table if not exists app_private.kaykha_independent_role_actions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null check (round_no >= 1),
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  role_key text not null check (role_key in ('banker','logist','whisperer')),
  action_key text not null check (action_key in ('underwrite','margin_call','secure_route','reroute_supply','buy_dossier','seed_rumor')),
  target_member_id uuid references public.kaykha_members(id) on delete set null,
  target_territory_id text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, round_no, member_id)
);

create index if not exists kaykha_independent_role_actions_member_idx
  on app_private.kaykha_independent_role_actions(game_id, member_id, round_no desc);
create index if not exists kaykha_independent_role_actions_target_idx
  on app_private.kaykha_independent_role_actions(game_id, target_member_id, round_no desc)
  where target_member_id is not null;

alter table app_private.kaykha_independent_role_actions enable row level security;
revoke all on table app_private.kaykha_independent_role_actions from public, anon, authenticated;

create table if not exists app_private.kaykha_independent_role_relations (
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  actor_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  target_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  trust_score smallint not null default 0 check (trust_score between -100 and 100),
  pressure_score smallint not null default 0 check (pressure_score between 0 and 100),
  leverage_score smallint not null default 0 check (leverage_score between 0 and 100),
  last_action_round integer not null default 0 check (last_action_round >= 0),
  updated_at timestamptz not null default now(),
  primary key (game_id, actor_member_id, target_member_id),
  check (actor_member_id <> target_member_id)
);

create index if not exists kaykha_independent_role_relations_target_idx
  on app_private.kaykha_independent_role_relations(game_id, target_member_id);

alter table app_private.kaykha_independent_role_relations enable row level security;
revoke all on table app_private.kaykha_independent_role_relations from public, anon, authenticated;

create or replace function app_private.adjust_kaykha_independent_relation(
  p_game_id uuid,
  p_actor_member_id uuid,
  p_target_member_id uuid,
  p_trust_delta integer,
  p_pressure_delta integer,
  p_leverage_delta integer,
  p_round_no integer
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_target_member_id is null or p_target_member_id = p_actor_member_id then
    return;
  end if;

  if not exists (
    select 1 from public.kaykha_members a
    join public.kaykha_members t on t.game_id = a.game_id
    where a.id = p_actor_member_id
      and t.id = p_target_member_id
      and a.game_id = p_game_id
  ) then
    raise exception 'رابطه فقط بین اعضای همین تالار قابل ثبت است';
  end if;

  insert into app_private.kaykha_independent_role_relations as r(
    game_id, actor_member_id, target_member_id,
    trust_score, pressure_score, leverage_score, last_action_round, updated_at
  ) values (
    p_game_id, p_actor_member_id, p_target_member_id,
    greatest(-100, least(100, p_trust_delta)),
    greatest(0, least(100, p_pressure_delta)),
    greatest(0, least(100, p_leverage_delta)),
    greatest(0, p_round_no), now()
  )
  on conflict (game_id, actor_member_id, target_member_id) do update
    set trust_score = greatest(-100, least(100, r.trust_score + excluded.trust_score)),
        pressure_score = greatest(0, least(100, r.pressure_score + excluded.pressure_score)),
        leverage_score = greatest(0, least(100, r.leverage_score + excluded.leverage_score)),
        last_action_round = greatest(r.last_action_round, excluded.last_action_round),
        updated_at = now();
end;
$function$;

revoke all on function app_private.adjust_kaykha_independent_relation(uuid,uuid,uuid,integer,integer,integer,integer)
  from public, anon, authenticated;

create or replace function public.get_kaykha_independent_role_state(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_me public.kaykha_members%rowtype;
  v_role text;
  v_used boolean := false;
  v_actions jsonb := '[]'::jsonb;
  v_members jsonb := '[]'::jsonb;
  v_territories jsonb := '[]'::jsonb;
  v_relations jsonb := '[]'::jsonb;
  v_recent jsonb := '[]'::jsonb;
  v_recommended text;
begin
  if (select auth.uid()) is null then
    raise exception 'ورود به بازی لازم است';
  end if;

  select * into v_game
  from public.kaykha_games
  where id = p_game_id;
  if not found then raise exception 'تالار پیدا نشد'; end if;

  select * into v_me
  from public.kaykha_members
  where game_id = p_game_id
    and user_id = (select auth.uid())
    and not is_ai
  limit 1;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  select s.role_key into v_role
  from app_private.kaykha_shadow_roles s
  where s.game_id = p_game_id and s.member_id = v_me.id;

  if v_role is null then
    return jsonb_build_object(
      'assigned', false,
      'game_status', v_game.status,
      'phase', v_game.phase,
      'round_no', v_game.round_no,
      'message', case when v_game.status='lobby'
        then 'نقش مستقل هنگام آغاز بازی واگذار می‌شود.'
        else 'در این تالار نقش مستقل به تو واگذار نشده است.' end
    );
  end if;

  select exists(
    select 1 from app_private.kaykha_independent_role_actions a
    where a.game_id=p_game_id and a.round_no=v_game.round_no and a.member_id=v_me.id
  ) into v_used;

  v_actions := case v_role
    when 'banker' then jsonb_build_array(
      jsonb_build_object('key','underwrite','title','ضمانت اعتباری','target','member','phase','negotiation','cost',jsonb_build_object('coins',2),'effect','اعتبار یک فرمانده را بالا می‌بری؛ روی سقف وام و اعتبار او اثر واقعی دارد.'),
      jsonb_build_object('key','margin_call','title','فشار بدهی','target','member','phase','negotiation','cost',jsonb_build_object('influence',1),'effect','فقط روی فرمانده‌ای با بدهی فعال؛ اعتبار او متناسب با بدهی تحت فشار می‌رود.')
    )
    when 'logist' then jsonb_build_array(
      jsonb_build_object('key','secure_route','title','تضمین مسیر','target','territory','phase','negotiation|orders','cost',jsonb_build_object('coins',2),'effect','رونق و مشروعیت مسیر را بالا می‌بری و فقر را کم می‌کنی؛ مسیر سوخته یا محاصره‌شده پذیرفته نمی‌شود.'),
      jsonb_build_object('key','reroute_supply','title','تغییر مسیر تدارکات','target','territory','phase','negotiation|orders','cost',jsonb_build_object('influence',1),'effect','در شهر خودی یک واحد اقتصاد را به یک واحد قدرت نظامی تبدیل می‌کنی؛ معامله‌ای بدون خلق منبع تازه.')
    )
    else jsonb_build_array(
      jsonb_build_object('key','buy_dossier','title','خرید پرونده','target','member','phase','negotiation|orders','cost',jsonb_build_object('coins',1,'bribe_tokens',1),'effect','یک پرونده خصوصی بر پایه بدهی، اعتبار، شهر کلیدی و رفتار راند قبلی می‌گیری؛ فرمان مهرشده فعلی هرگز افشا نمی‌شود.'),
      jsonb_build_object('key','seed_rumor','title','کاشت شایعه','target','territory','phase','negotiation|orders','cost',jsonb_build_object('influence',1,'bribe_tokens',1),'effect','مشروعیت شهر رقیب را با شدت وابسته به وضعیت همان شهر فرسوده می‌کنی؛ بست فعال آن را خنثی می‌کند.')
    )
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id', t.id,
    'display_name', t.display_name,
    'reputation_score', t.reputation_score,
    'credit_limit', t.credit_limit,
    'active_debt', coalesce((
      select sum(l.principal + l.interest_coins)::integer
      from public.kaykha_loans l
      where l.game_id=p_game_id and l.borrower_member_id=t.id and l.status='active'
    ),0),
    'controlled_cities', (
      select count(*)::integer from public.kaykha_territories x
      where x.game_id=p_game_id and x.owner_member_id=t.id
    )
  ) order by t.seat_no nulls last, t.display_name), '[]'::jsonb)
  into v_members
  from public.kaykha_members t
  where t.game_id=p_game_id and not t.is_ai and t.id<>v_me.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'territory_id', t.territory_id,
    'owner_member_id', t.owner_member_id,
    'owner_name', coalesce((select m.display_name from public.kaykha_members m where m.id=t.owner_member_id),'بی‌طرف'),
    'is_mine', t.owner_member_id=v_me.id,
    'strength', t.strength,
    'economy', t.economy,
    'legitimacy', t.legitimacy,
    'poverty', t.poverty,
    'is_in_mutiny', t.is_in_mutiny
  ) order by t.territory_id), '[]'::jsonb)
  into v_territories
  from public.kaykha_territories t
  where t.game_id=p_game_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'target_member_id', r.target_member_id,
    'target_name', tm.display_name,
    'trust', r.trust_score,
    'pressure', r.pressure_score,
    'leverage', r.leverage_score,
    'last_action_round', r.last_action_round
  ) order by r.updated_at desc), '[]'::jsonb)
  into v_relations
  from app_private.kaykha_independent_role_relations r
  join public.kaykha_members tm on tm.id=r.target_member_id
  where r.game_id=p_game_id and r.actor_member_id=v_me.id;

  select coalesce(jsonb_agg(x.row_data order by x.created_at desc), '[]'::jsonb)
  into v_recent
  from (
    select a.created_at,
      jsonb_build_object(
        'round_no',a.round_no,
        'action_key',a.action_key,
        'target_member_id',a.target_member_id,
        'target_territory_id',a.target_territory_id,
        'result',a.result,
        'created_at',a.created_at
      ) as row_data
    from app_private.kaykha_independent_role_actions a
    where a.game_id=p_game_id and a.member_id=v_me.id
    order by a.created_at desc
    limit 8
  ) x;

  v_recommended := case v_role
    when 'banker' then case when exists(
      select 1 from public.kaykha_loans l
      where l.game_id=p_game_id and l.status='active' and l.borrower_member_id<>v_me.id
    ) then 'margin_call' else 'underwrite' end
    when 'logist' then case when exists(
      select 1 from public.kaykha_territories t
      where t.game_id=p_game_id and t.owner_member_id=v_me.id and (t.poverty>=20 or t.economy<=2)
    ) then 'secure_route' else 'reroute_supply' end
    else case when exists(
      select 1 from public.kaykha_territories t
      where t.game_id=p_game_id and t.owner_member_id is distinct from v_me.id and t.owner_member_id is not null and t.legitimacy<45
    ) then 'seed_rumor' else 'buy_dossier' end
  end;

  return jsonb_build_object(
    'assigned', true,
    'role_key', v_role,
    'title', case v_role when 'banker' then 'بانکدار آهنین' when 'logist' then 'ارباب کاروان‌ها' else 'فروشندهٔ اسرار' end,
    'round_no', v_game.round_no,
    'phase', v_game.phase,
    'game_status', v_game.status,
    'used_this_round', v_used,
    'can_act', v_game.status='active' and v_game.phase in ('negotiation','orders') and not v_used,
    'recommended_action', v_recommended,
    'resources', jsonb_build_object(
      'coins',v_me.coins,'influence',v_me.influence_tokens,'bribe_tokens',v_me.bribe_tokens,
      'search_tokens',v_me.search_tokens,'prestige',v_me.prestige
    ),
    'actions', v_actions,
    'members', v_members,
    'territories', v_territories,
    'relations', v_relations,
    'recent_actions', v_recent,
    'privacy_notice','هیچ اکشن نقش مستقل، فرمان مهرشدهٔ راند جاری یا نقش سایهٔ فرمانده دیگری را افشا نمی‌کند.'
  );
end;
$function$;

revoke all on function public.get_kaykha_independent_role_state(uuid) from public, anon;
grant execute on function public.get_kaykha_independent_role_state(uuid) to authenticated;

create or replace function public.use_kaykha_independent_role_action(
  p_game_id uuid,
  p_action_key text,
  p_target_member_id uuid default null,
  p_target_territory_id text default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_me public.kaykha_members%rowtype;
  v_target public.kaykha_members%rowtype;
  v_role text;
  v_action_id uuid;
  v_result jsonb := '{}'::jsonb;
  v_active_debt integer := 0;
  v_pressure integer := 0;
  v_owner uuid;
  v_economy integer;
  v_strength integer;
  v_legitimacy integer;
  v_poverty integer;
  v_mutiny boolean;
  v_key_territory text;
  v_recent_order text;
  v_recent_family text;
  v_suspicion_band text;
  v_rumor_strength integer;
  v_blocked boolean := false;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;

  select * into v_game
  from public.kaykha_games
  where id=p_game_id;
  if not found or v_game.status<>'active' then raise exception 'تالار فعال نیست'; end if;
  if v_game.phase not in ('negotiation','orders') then raise exception 'نقش مستقل فقط در مذاکره یا ثبت فرمان فعال است'; end if;

  select * into v_me
  from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai
  for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  select s.role_key into v_role
  from app_private.kaykha_shadow_roles s
  where s.game_id=p_game_id and s.member_id=v_me.id;
  if v_role is null then raise exception 'نقش مستقلی به تو واگذار نشده است'; end if;

  if exists(
    select 1 from app_private.kaykha_independent_role_actions a
    where a.game_id=p_game_id and a.round_no=v_game.round_no and a.member_id=v_me.id
  ) then
    raise exception 'قدرت نقش مستقل در این راند قبلاً مصرف شده است';
  end if;

  if (v_role='banker' and p_action_key not in ('underwrite','margin_call'))
    or (v_role='logist' and p_action_key not in ('secure_route','reroute_supply'))
    or (v_role='whisperer' and p_action_key not in ('buy_dossier','seed_rumor')) then
    raise exception 'این اکشن متعلق به نقش مستقل تو نیست';
  end if;

  if v_role='banker' then
    if v_game.phase<>'negotiation' then raise exception 'بانکدار فقط در فاز مذاکره دفتر اعتبار را تغییر می‌دهد'; end if;
    if p_target_member_id is null or p_target_member_id=v_me.id then raise exception 'یک فرمانده دیگر را انتخاب کن'; end if;
    select * into v_target
    from public.kaykha_members
    where id=p_target_member_id and game_id=p_game_id and not is_ai
    for update;
    if not found then raise exception 'فرمانده هدف در این تالار نیست'; end if;

    if p_action_key='underwrite' then
      if v_me.coins<2 then raise exception 'برای ضمانت اعتباری ۲ سکه لازم است'; end if;
      update public.kaykha_members
      set coins=coins-2, prestige=least(999,prestige+1)
      where id=v_me.id;
      update public.kaykha_members
      set reputation_score=least(100,reputation_score+2),
          credit_limit=least(200,credit_limit+6)
      where id=v_target.id;
      insert into public.kaykha_credit_ledger(game_id,member_id,delta,reason,round_no,metadata)
      values(p_game_id,v_target.id,2,'independent.banker.underwrite',v_game.round_no,
        jsonb_build_object('credit_limit_bonus',6,'source','shadow_role'));
      perform app_private.adjust_kaykha_independent_relation(p_game_id,v_me.id,v_target.id,8,0,6,v_game.round_no);
      v_result:=jsonb_build_object(
        'effect','ضمانت ثبت شد؛ اعتبار و سقف وام فرمانده هدف بالا رفت و یک اعتبار سیاسی برای تو ثبت شد.',
        'target_name',v_target.display_name,'reputation_delta',2,'credit_limit_delta',6,'prestige_delta',1,'coins_cost',2
      );
    else
      select coalesce(sum(l.principal+l.interest_coins),0)::integer into v_active_debt
      from public.kaykha_loans l
      where l.game_id=p_game_id and l.borrower_member_id=v_target.id and l.status='active';
      if v_active_debt<=0 then raise exception 'این فرمانده بدهی فعال ندارد؛ فشار بدهی روی او معنی ندارد'; end if;
      if v_me.influence_tokens<1 then raise exception 'برای فشار بدهی یک نشان نفوذ لازم است'; end if;
      v_pressure:=least(5,3+(v_active_debt/40));
      update public.kaykha_members
      set influence_tokens=influence_tokens-1, prestige=least(999,prestige+1)
      where id=v_me.id;
      update public.kaykha_members
      set reputation_score=greatest(0,reputation_score-v_pressure),
          credit_limit=greatest(0,credit_limit-v_pressure)
      where id=v_target.id;
      insert into public.kaykha_credit_ledger(game_id,member_id,delta,reason,round_no,metadata)
      values(p_game_id,v_target.id,-v_pressure,'independent.banker.margin_call',v_game.round_no,
        jsonb_build_object('active_debt',v_active_debt,'source','shadow_role'));
      perform app_private.adjust_kaykha_independent_relation(p_game_id,v_me.id,v_target.id,-6,8,6,v_game.round_no);
      v_result:=jsonb_build_object(
        'effect','فشار بدهی اعمال شد؛ چون بدهی فعال وجود داشت، اعتبار فرمانده هدف کاهش یافت.',
        'target_name',v_target.display_name,'active_debt',v_active_debt,'reputation_delta',-v_pressure,
        'credit_limit_delta',-v_pressure,'prestige_delta',1,'influence_cost',1
      );
    end if;

  elsif v_role='logist' then
    if p_target_territory_id is null then raise exception 'یک شهر را به‌عنوان مسیر انتخاب کن'; end if;
    select t.owner_member_id,t.economy,t.strength,t.legitimacy,t.poverty,t.is_in_mutiny
      into v_owner,v_economy,v_strength,v_legitimacy,v_poverty,v_mutiny
    from public.kaykha_territories t
    where t.game_id=p_game_id and t.territory_id=p_target_territory_id
    for update;
    if not found then raise exception 'شهر هدف در این نقشه نیست'; end if;

    if p_action_key='secure_route' then
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.target_territory_id=p_target_territory_id
          and e.effect_key in ('class.hoard_blockade','family.vraz_scorched','class.execution_scorch')
          and e.consumed_at is null and e.round_no<=v_game.round_no and e.expires_round>=v_game.round_no
      ) into v_blocked;
      if v_blocked then raise exception 'این مسیر سوخته یا مسدود است؛ اول مانع را برطرف کن'; end if;
      if v_me.coins<2 then raise exception 'برای تضمین مسیر ۲ سکه لازم است'; end if;
      update public.kaykha_members
      set coins=coins-2, prestige=least(999,prestige+1)
      where id=v_me.id;
      update public.kaykha_territories
      set economy=least(99,economy+1),
          poverty=greatest(0,poverty-3),
          legitimacy=least(100,legitimacy+1),
          revision=revision+1
      where game_id=p_game_id and territory_id=p_target_territory_id;
      if v_owner is not null and v_owner<>v_me.id then
        perform app_private.adjust_kaykha_independent_relation(p_game_id,v_me.id,v_owner,5,0,3,v_game.round_no);
      end if;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'market','یک شبکهٔ کاروانی مسیر '||p_target_territory_id||' را امن کرد؛ بازار یک درجه رونق گرفت و فشار فقر کمتر شد.');
      v_result:=jsonb_build_object(
        'effect','مسیر امن شد؛ اقتصاد +۱، فقر −۳ و مشروعیت +۱.',
        'territory_id',p_target_territory_id,'economy_delta',1,'poverty_delta',-3,'legitimacy_delta',1,
        'prestige_delta',1,'coins_cost',2
      );
    else
      if v_owner is distinct from v_me.id then raise exception 'تغییر مسیر تدارکات فقط در شهر خودت ممکن است'; end if;
      if v_economy<2 then raise exception 'اقتصاد این شهر برای تبدیل به تدارکات نظامی کافی نیست'; end if;
      if v_me.influence_tokens<1 then raise exception 'برای تغییر مسیر یک نشان نفوذ لازم است'; end if;
      update public.kaykha_members set influence_tokens=influence_tokens-1 where id=v_me.id;
      update public.kaykha_territories
      set economy=economy-1,
          strength=least(99,strength+1),
          poverty=least(100,poverty+1),
          revision=revision+1
      where game_id=p_game_id and territory_id=p_target_territory_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'support','تدارکات '||p_target_territory_id||' تغییر مسیر داد؛ بخشی از توان بازار به پادگان منتقل شد.');
      v_result:=jsonb_build_object(
        'effect','تدارکات جابه‌جا شد؛ اقتصاد −۱، قدرت +۱ و فقر +۱. هیچ منبع تازه‌ای خلق نشد.',
        'territory_id',p_target_territory_id,'economy_delta',-1,'strength_delta',1,'poverty_delta',1,'influence_cost',1
      );
    end if;

  else
    if p_action_key='buy_dossier' then
      if p_target_member_id is null or p_target_member_id=v_me.id then raise exception 'یک فرمانده دیگر را برای پرونده انتخاب کن'; end if;
      select * into v_target
      from public.kaykha_members
      where id=p_target_member_id and game_id=p_game_id and not is_ai;
      if not found then raise exception 'فرمانده هدف در این تالار نیست'; end if;
      if v_me.coins<1 or v_me.bribe_tokens<1 then raise exception 'برای خرید پرونده ۱ سکه و ۱ مهر رشوه لازم است'; end if;

      select t.territory_id into v_key_territory
      from public.kaykha_territories t
      where t.game_id=p_game_id and t.owner_member_id=v_target.id
      order by (t.economy+t.strength+t.influence) desc, t.territory_id
      limit 1;
      select coalesce(sum(l.principal+l.interest_coins),0)::integer into v_active_debt
      from public.kaykha_loans l
      where l.game_id=p_game_id and l.borrower_member_id=v_target.id and l.status='active';
      select so.order_type into v_recent_order
      from app_private.kaykha_secret_orders so
      where so.game_id=p_game_id and so.member_id=v_target.id and so.round_no<v_game.round_no
      order by so.round_no desc, so.locked_at desc
      limit 1;
      v_recent_family:=case
        when v_recent_order in ('attack','defend','support','raid') then 'military'
        when v_recent_order in ('spy','sabotage','spell') then 'espionage'
        when v_recent_order in ('trade','caravan') then 'economy'
        when v_recent_order='revolt' then 'politics'
        when v_recent_order is null then 'unknown'
        else 'utility' end;
      v_suspicion_band:=case
        when v_target.suspicion_level<30 then 'low'
        when v_target.suspicion_level<60 then 'rising'
        when v_target.suspicion_level<85 then 'high'
        else 'audit_risk' end;

      update public.kaykha_members
      set coins=coins-1, bribe_tokens=bribe_tokens-1,
          search_tokens=least(99,search_tokens+1), prestige=least(999,prestige+1)
      where id=v_me.id;
      perform app_private.adjust_kaykha_independent_relation(p_game_id,v_me.id,v_target.id,-2,2,8,v_game.round_no);

      v_result:=jsonb_build_object(
        'effect','پرونده خریداری شد و یک مهر جست‌وجو به شبکه‌ات اضافه شد. اطلاعات فقط از وضعیت پایدار و رفتار راندهای گذشته ساخته شده است.',
        'target_name',v_target.display_name,'search_token_delta',1,'prestige_delta',1,'coins_cost',1,'bribe_tokens_cost',1,
        'intelligence',jsonb_build_object(
          'source','whisperer_dossier','member_id',v_target.id,
          'city_count',(select count(*)::integer from public.kaykha_territories t where t.game_id=p_game_id and t.owner_member_id=v_target.id),
          'active_debt',v_active_debt,'reputation_score',v_target.reputation_score,'credit_limit',v_target.credit_limit,
          'suspicion_band',v_suspicion_band,'recent_behavior_family',v_recent_family,
          'key_territory',coalesce((
            select jsonb_build_object('territory_id',t.territory_id,'strength',t.strength,'economy',t.economy,'legitimacy',t.legitimacy,'poverty',t.poverty)
            from public.kaykha_territories t
            where t.game_id=p_game_id and t.territory_id=v_key_territory
          ),'{}'::jsonb),
          'current_sealed_order','hidden'
        )
      );
      insert into app_private.kaykha_intel(game_id,member_id,round_no,target_territory_id,target_member_id,intel)
      values(p_game_id,v_me.id,v_game.round_no,coalesce(v_key_territory,'unknown'),v_target.id,v_result->'intelligence');
    else
      if p_target_territory_id is null then raise exception 'یک شهر رقیب را برای شایعه انتخاب کن'; end if;
      select t.owner_member_id,t.economy,t.strength,t.legitimacy,t.poverty,t.is_in_mutiny
        into v_owner,v_economy,v_strength,v_legitimacy,v_poverty,v_mutiny
      from public.kaykha_territories t
      where t.game_id=p_game_id and t.territory_id=p_target_territory_id
      for update;
      if not found then raise exception 'شهر هدف در این نقشه نیست'; end if;
      if v_owner is null or v_owner=v_me.id then raise exception 'شایعه باید روی شهر یک رقیب زنده اجرا شود'; end if;
      if coalesce((select t.sanctuary_until_round from public.kaykha_territories t where t.game_id=p_game_id and t.territory_id=p_target_territory_id),0)>=v_game.round_no then
        raise exception 'بست شهر فعال است؛ شایعه در این راند نفوذ نمی‌کند';
      end if;
      if v_me.influence_tokens<1 or v_me.bribe_tokens<1 then raise exception 'برای کاشت شایعه ۱ نفوذ و ۱ مهر رشوه لازم است'; end if;
      v_rumor_strength:=case when v_legitimacy>=70 then 2 when v_legitimacy>=35 then 3 else 4 end + case when v_mutiny then 1 else 0 end;
      v_rumor_strength:=least(5,v_rumor_strength);
      update public.kaykha_members
      set influence_tokens=influence_tokens-1, bribe_tokens=bribe_tokens-1, prestige=least(999,prestige+1)
      where id=v_me.id;
      update public.kaykha_territories
      set legitimacy=greatest(0,legitimacy-v_rumor_strength),
          poverty=least(100,poverty+ceil(v_rumor_strength/2.0)::integer),
          revision=revision+1
      where game_id=p_game_id and territory_id=p_target_territory_id;
      perform app_private.adjust_kaykha_independent_relation(p_game_id,v_me.id,v_owner,-6,6,4,v_game.round_no);
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,v_game.round_no,'shadow','شایعه‌ای بی‌نام در '||p_target_territory_id||' پیچید؛ مشروعیت شهر فرسوده شد، اما هویت منبع آشکار نشد.');
      v_result:=jsonb_build_object(
        'effect','شایعه جا افتاد؛ مشروعیت شهر به اندازه '||v_rumor_strength||' کم شد و فشار فقر کمی بالا رفت.',
        'territory_id',p_target_territory_id,'legitimacy_delta',-v_rumor_strength,
        'poverty_delta',ceil(v_rumor_strength/2.0)::integer,'prestige_delta',1,'influence_cost',1,'bribe_tokens_cost',1
      );
    end if;
  end if;

  insert into app_private.kaykha_independent_role_actions(
    game_id,round_no,member_id,role_key,action_key,target_member_id,target_territory_id,payload,result
  ) values (
    p_game_id,v_game.round_no,v_me.id,v_role,p_action_key,p_target_member_id,p_target_territory_id,coalesce(p_payload,'{}'::jsonb),v_result
  ) returning id into v_action_id;

  return v_result || jsonb_build_object('action_id',v_action_id,'role_key',v_role,'action_key',p_action_key,'round_no',v_game.round_no);
exception
  when unique_violation then
    raise exception 'قدرت نقش مستقل در این راند قبلاً مصرف شده است';
end;
$function$;

revoke all on function public.use_kaykha_independent_role_action(uuid,text,uuid,text,jsonb) from public, anon;
grant execute on function public.use_kaykha_independent_role_action(uuid,text,uuid,text,jsonb) to authenticated;
