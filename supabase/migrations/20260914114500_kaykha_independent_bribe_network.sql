-- Kaykha independent-character bribery network.
-- Bribes create temporary favor, real bounded gameplay effects, suspicion,
-- catch-up counteroffers, concentration pressure and exposure risk.

create table if not exists app_private.kaykha_independent_character_influence (
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  character_key text not null check (character_key in (
    'banker','logist','whisperer','mintmaster','market_warden','watermaster','chief_scribe','court_mobed','free_borderlord'
  )),
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  favor_score smallint not null default 0 check (favor_score between -100 and 100),
  heat_score smallint not null default 0 check (heat_score between 0 and 100),
  last_bribe_round integer not null default 0 check (last_bribe_round >= 0),
  updated_at timestamptz not null default now(),
  primary key (game_id, character_key, member_id)
);

create table if not exists app_private.kaykha_independent_bribes (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  round_no integer not null check (round_no >= 1),
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  character_key text not null check (character_key in (
    'banker','logist','whisperer','mintmaster','market_warden','watermaster','chief_scribe','court_mobed','free_borderlord'
  )),
  tokens_spent smallint not null check (tokens_spent between 1 and 3),
  target_territory_id text,
  favor_delta smallint not null,
  suspicion_delta smallint not null,
  exposed boolean not null default false,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, round_no, member_id, character_key)
);

create index if not exists kaykha_independent_influence_member_idx
  on app_private.kaykha_independent_character_influence(game_id, member_id, updated_at desc);
create index if not exists kaykha_independent_influence_character_idx
  on app_private.kaykha_independent_character_influence(game_id, character_key, favor_score desc);
create index if not exists kaykha_independent_bribes_round_idx
  on app_private.kaykha_independent_bribes(game_id, round_no, character_key, created_at desc);
create index if not exists kaykha_independent_bribes_member_idx
  on app_private.kaykha_independent_bribes(game_id, member_id, round_no desc);

alter table app_private.kaykha_independent_character_influence enable row level security;
alter table app_private.kaykha_independent_bribes enable row level security;
revoke all on table app_private.kaykha_independent_character_influence from public, anon, authenticated;
revoke all on table app_private.kaykha_independent_bribes from public, anon, authenticated;

create or replace function app_private.kaykha_independent_effective_favor(
  p_favor integer,
  p_last_round integer,
  p_current_round integer
) returns integer
language sql
immutable
set search_path = ''
as $function$
  select greatest(0, least(100,
    coalesce(p_favor,0) - greatest(0, coalesce(p_current_round,0)-coalesce(p_last_round,0))*5
  ));
$function$;
revoke all on function app_private.kaykha_independent_effective_favor(integer,integer,integer)
  from public, anon, authenticated;

create or replace function public.get_kaykha_independent_bribe_state(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_me public.kaykha_members%rowtype;
  v_characters jsonb := '[]'::jsonb;
  v_territories jsonb := '[]'::jsonb;
  v_recent jsonb := '[]'::jsonb;
  c record;
  v_my_favor integer;
  v_leader_id uuid;
  v_leader_name text;
  v_leader_favor integer;
  v_used boolean;
  v_round_heat integer;
  v_my_network integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  select * into v_me from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai limit 1;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  select count(*)::integer into v_my_network
  from app_private.kaykha_independent_character_influence i
  where i.game_id=p_game_id and i.member_id=v_me.id
    and app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no) >= 25;

  for c in
    select * from (values
      ('banker','بانکدار آهنین','اعتبار، وام و بدهی','member',4,'سقف اعتبار را بالا می‌برد؛ نفوذش با گذر راند افت می‌کند.','اعتبار رقیب، فشار بدهی و ضدپیشنهاد'),
      ('logist','ارباب کاروان‌ها','مسیر، اقتصاد و تدارکات','territory',4,'رونق شهر خودی را تقویت و فقر را کم می‌کند.','محاصره، زمین سوخته و ضدپیشنهاد'),
      ('whisperer','فروشندهٔ اسرار','اطلاعات، پرونده و شایعه','member',5,'شبکه جست‌وجو را تقویت می‌کند اما رد اطلاعاتی بیشتری می‌سازد.','ضدجاسوسی، سوءظن و ضدپیشنهاد'),
      ('mintmaster','رئیس ضرابخانه','پول، نقدینگی و اعتبار سکه','member',3,'نقدینگی کوتاه‌مدت می‌دهد؛ رشوه سنگین سریع‌تر حساسیت می‌سازد.','حسابرسی دیوان و تمرکز قدرت'),
      ('market_warden','کلانتر بازار','نظم بازار و امتیاز اصناف','territory',4,'اقتصاد شهر را تقویت می‌کند ولی رانت می‌تواند فشار اجتماعی بسازد.','رقابت بازار و افشای رانت'),
      ('watermaster','میرآب','آب و منابع حیاتی','territory',4,'فقر شهر خودی را کاهش می‌دهد و در رشوه سنگین رونق هم می‌دهد.','رقابت منابع و ضدپیشنهاد'),
      ('chief_scribe','استاد دبیران','اسناد، قرارداد و اعتبار حقوقی','member',3,'اعتبار سیاسی را بالا می‌برد و در نفوذ بالا یک نشان نفوذ می‌دهد.','افشای سند و رقابت دیوانی'),
      ('court_mobed','موبد دربار','مشروعیت و افکار عمومی','territory',2,'مشروعیت شهر را تقویت می‌کند اما فساد این شبکه حساسیت بیشتری دارد.','افشا، بی‌اعتمادی و ضدپیشنهاد'),
      ('free_borderlord','مرزبان آزاد','امنیت مرز و پشتیبانی','territory',4,'قدرت دفاعی شهر را بالا می‌برد؛ حمایت سنگین بخشی از اقتصاد را مصرف می‌کند.','فشار اقتصادی و ضدپیشنهاد')
    ) as x(character_key,title,domain,target_type,appetite,effect,counterplay)
  loop
    select coalesce(app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no),0)
      into v_my_favor
    from app_private.kaykha_independent_character_influence i
    where i.game_id=p_game_id and i.character_key=c.character_key and i.member_id=v_me.id;
    v_my_favor:=coalesce(v_my_favor,0);

    select i.member_id,m.display_name,
      app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)
    into v_leader_id,v_leader_name,v_leader_favor
    from app_private.kaykha_independent_character_influence i
    join public.kaykha_members m on m.id=i.member_id and m.game_id=i.game_id
    where i.game_id=p_game_id and i.character_key=c.character_key
      and app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)>0
    order by app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no) desc,
             i.last_bribe_round desc, i.updated_at desc
    limit 1;

    select exists(select 1 from app_private.kaykha_independent_bribes b
      where b.game_id=p_game_id and b.round_no=v_game.round_no and b.member_id=v_me.id and b.character_key=c.character_key)
      into v_used;
    select coalesce(sum(b.tokens_spent),0)::integer into v_round_heat
    from app_private.kaykha_independent_bribes b
    where b.game_id=p_game_id and b.round_no=v_game.round_no and b.character_key=c.character_key;

    v_characters:=v_characters || jsonb_build_array(jsonb_build_object(
      'key',c.character_key,'title',c.title,'domain',c.domain,'target_type',c.target_type,
      'appetite',c.appetite,'effect',c.effect,'counterplay',c.counterplay,
      'my_favor',v_my_favor,'leader_member_id',v_leader_id,'leader_name',v_leader_name,
      'leader_favor',coalesce(v_leader_favor,0),'i_am_leader',v_leader_id=v_me.id,
      'gap_to_leader',greatest(0,coalesce(v_leader_favor,0)-v_my_favor),
      'used_this_round',v_used,'round_heat',v_round_heat,
      'heat_band',case when v_round_heat>=6 then 'burning' when v_round_heat>=3 then 'hot' when v_round_heat>0 then 'warm' else 'cold' end
    ));
    v_leader_id:=null; v_leader_name:=null; v_leader_favor:=null;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
    'territory_id',t.territory_id,'economy',t.economy,'strength',t.strength,
    'legitimacy',t.legitimacy,'poverty',t.poverty
  ) order by t.territory_id),'[]'::jsonb)
  into v_territories
  from public.kaykha_territories t
  where t.game_id=p_game_id and t.owner_member_id=v_me.id;

  select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]'::jsonb) into v_recent
  from (
    select b.created_at,jsonb_build_object(
      'round_no',b.round_no,'character_key',b.character_key,'tokens_spent',b.tokens_spent,
      'target_territory_id',b.target_territory_id,'favor_delta',b.favor_delta,
      'suspicion_delta',b.suspicion_delta,'exposed',b.exposed,'result',b.result,'created_at',b.created_at
    ) item
    from app_private.kaykha_independent_bribes b
    where b.game_id=p_game_id and b.member_id=v_me.id
    order by b.created_at desc limit 10
  ) x;

  return jsonb_build_object(
    'game_status',v_game.status,'phase',v_game.phase,'round_no',v_game.round_no,
    'can_bribe',v_game.status='active' and v_game.phase in ('negotiation','orders'),
    'resources',jsonb_build_object('bribe_tokens',v_me.bribe_tokens,'suspicion',v_me.suspicion_level,'reputation',v_me.reputation_score),
    'network_concentration',v_my_network,'characters',v_characters,'territories',v_territories,
    'recent_bribes',v_recent,
    'rules',jsonb_build_object(
      'favor_decay_per_round',5,'max_tokens_per_offer',3,'one_offer_per_character_per_round',true,
      'catchup_bonus',2,'concentration_threshold',3,
      'message','نفوذ خریدنی دائمی نیست؛ هر راند افت می‌کند، ضدپیشنهاد جبران دارد و تمرکز شبکه سوءظن می‌سازد.'
    )
  );
end;
$function$;

revoke all on function public.get_kaykha_independent_bribe_state(uuid) from public, anon;
grant execute on function public.get_kaykha_independent_bribe_state(uuid) to authenticated;

create or replace function public.bribe_kaykha_independent_character(
  p_game_id uuid,
  p_character_key text,
  p_tokens integer default 1,
  p_target_territory_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_me public.kaykha_members%rowtype;
  v_title text;
  v_target_type text;
  v_appetite integer;
  v_target public.kaykha_territories%rowtype;
  v_old_favor integer:=0;
  v_old_last integer:=0;
  v_effective integer:=0;
  v_leader_id uuid;
  v_leader_favor integer:=0;
  v_catchup integer:=0;
  v_concentration integer:=0;
  v_concentration_penalty integer:=0;
  v_suspicion_delta integer:=0;
  v_favor_delta integer:=0;
  v_round_heat integer:=0;
  v_exposed boolean:=false;
  v_became_leader boolean:=false;
  v_result jsonb:='{}'::jsonb;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase not in ('negotiation','orders') then
    raise exception 'اکنون زمان معامله با شبکه‌های مستقل نیست';
  end if;
  select * into v_me from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;
  if p_tokens not between 1 and 3 then raise exception 'پیشنهاد رشوه باید بین ۱ تا ۳ مهر باشد'; end if;
  if v_me.bribe_tokens<p_tokens then raise exception 'مهر رشوه کافی نداری'; end if;
  if exists(select 1 from app_private.kaykha_independent_bribes b
    where b.game_id=p_game_id and b.round_no=v_game.round_no and b.member_id=v_me.id and b.character_key=p_character_key) then
    raise exception 'برای این شخصیت در این راند قبلاً پیشنهاد ثبت کرده‌ای';
  end if;

  select x.title,x.target_type,x.appetite into v_title,v_target_type,v_appetite
  from (values
    ('banker','بانکدار آهنین','member',4),('logist','ارباب کاروان‌ها','territory',4),
    ('whisperer','فروشندهٔ اسرار','member',5),('mintmaster','رئیس ضرابخانه','member',3),
    ('market_warden','کلانتر بازار','territory',4),('watermaster','میرآب','territory',4),
    ('chief_scribe','استاد دبیران','member',3),('court_mobed','موبد دربار','territory',2),
    ('free_borderlord','مرزبان آزاد','territory',4)
  ) as x(character_key,title,target_type,appetite)
  where x.character_key=p_character_key;
  if v_title is null then raise exception 'شخصیت مستقل نامعتبر است'; end if;

  if v_target_type='territory' then
    if p_target_territory_id is null then raise exception 'برای این معامله یک شهر خودی انتخاب کن'; end if;
    select * into v_target from public.kaykha_territories
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id for update;
    if not found then raise exception 'هدف باید یکی از شهرهای خودت باشد'; end if;
  end if;

  select i.favor_score,i.last_bribe_round into v_old_favor,v_old_last
  from app_private.kaykha_independent_character_influence i
  where i.game_id=p_game_id and i.character_key=p_character_key and i.member_id=v_me.id for update;
  v_old_favor:=coalesce(v_old_favor,0); v_old_last:=coalesce(v_old_last,0);
  v_effective:=app_private.kaykha_independent_effective_favor(v_old_favor,v_old_last,v_game.round_no);

  select i.member_id,app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)
  into v_leader_id,v_leader_favor
  from app_private.kaykha_independent_character_influence i
  where i.game_id=p_game_id and i.character_key=p_character_key
    and app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)>0
  order by app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no) desc,
           i.last_bribe_round desc,i.updated_at desc limit 1;
  v_leader_favor:=coalesce(v_leader_favor,0);
  if v_leader_id is not null and v_leader_id<>v_me.id and v_effective<v_leader_favor then v_catchup:=2; end if;

  select count(*)::integer into v_concentration
  from app_private.kaykha_independent_character_influence i
  where i.game_id=p_game_id and i.member_id=v_me.id
    and app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)>=25;
  if v_concentration>=3 then v_concentration_penalty:=2; end if;

  v_favor_delta:=greatest(1,p_tokens*v_appetite+v_catchup-v_concentration_penalty);
  v_suspicion_delta:=p_tokens*3
    + case when v_concentration>=3 then 3 else 0 end
    + case when p_character_key='court_mobed' then 2 else 0 end;
  select coalesce(sum(tokens_spent),0)::integer into v_round_heat
  from app_private.kaykha_independent_bribes
  where game_id=p_game_id and round_no=v_game.round_no and character_key=p_character_key;
  v_exposed:=(v_round_heat+p_tokens>=6) or (v_me.suspicion_level+v_suspicion_delta>=85);

  update public.kaykha_members set
    bribe_tokens=bribe_tokens-p_tokens,
    suspicion_level=least(100,suspicion_level+v_suspicion_delta),
    reputation_score=greatest(0,reputation_score-case when v_exposed then p_tokens else 0 end)
  where id=v_me.id;

  insert into app_private.kaykha_independent_character_influence as i(
    game_id,character_key,member_id,favor_score,heat_score,last_bribe_round,updated_at
  ) values(
    p_game_id,p_character_key,v_me.id,least(100,v_effective+v_favor_delta),least(100,p_tokens*8),v_game.round_no,now()
  ) on conflict(game_id,character_key,member_id) do update set
    favor_score=least(100,v_effective+v_favor_delta),
    heat_score=least(100,greatest(0,i.heat_score-5*greatest(0,v_game.round_no-i.last_bribe_round))+p_tokens*8),
    last_bribe_round=v_game.round_no,updated_at=now();

  if p_character_key='banker' then
    update public.kaykha_members set credit_limit=least(999,credit_limit+2*p_tokens) where id=v_me.id;
    v_result:=jsonb_build_object('effect','بانکدار راه اعتبار را باز کرد.','credit_limit_delta',2*p_tokens);
  elsif p_character_key='logist' then
    update public.kaykha_territories set economy=least(99,economy+1),poverty=greatest(0,poverty-p_tokens),revision=revision+1
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id;
    v_result:=jsonb_build_object('effect','مسیرهای شهر نرم‌تر شد.','economy_delta',1,'poverty_delta',-p_tokens,'territory_id',p_target_territory_id);
  elsif p_character_key='whisperer' then
    update public.kaykha_members set search_tokens=least(99,search_tokens+1),prestige=least(999,prestige+case when p_tokens>=2 then 1 else 0 end) where id=v_me.id;
    v_result:=jsonb_build_object('effect','شبکه خبرچین‌ها یک مسیر جست‌وجوی تازه باز کرد.','search_token_delta',1,'prestige_delta',case when p_tokens>=2 then 1 else 0 end);
  elsif p_character_key='mintmaster' then
    update public.kaykha_members set coins=least(999,coins+p_tokens*2) where id=v_me.id;
    v_result:=jsonb_build_object('effect','ضرابخانه نقدینگی کوتاه‌مدت فراهم کرد.','coins_delta',p_tokens*2);
  elsif p_character_key='market_warden' then
    update public.kaykha_territories set economy=least(99,economy+1),poverty=least(100,poverty+case when p_tokens>=2 then 1 else 0 end),revision=revision+1
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id;
    v_result:=jsonb_build_object('effect','کلانتر امتیاز بازار را به نفع تو چرخاند؛ رانت می‌تواند فشار اجتماعی بسازد.','economy_delta',1,'poverty_delta',case when p_tokens>=2 then 1 else 0 end,'territory_id',p_target_territory_id);
  elsif p_character_key='watermaster' then
    update public.kaykha_territories set poverty=greatest(0,poverty-2*p_tokens),economy=least(99,economy+case when p_tokens=3 then 1 else 0 end),revision=revision+1
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id;
    v_result:=jsonb_build_object('effect','سهم آب به شهر تو متمایل شد.','poverty_delta',-2*p_tokens,'economy_delta',case when p_tokens=3 then 1 else 0 end,'territory_id',p_target_territory_id);
  elsif p_character_key='chief_scribe' then
    update public.kaykha_members set reputation_score=least(100,reputation_score+p_tokens),influence_tokens=least(999,influence_tokens+case when p_tokens=3 then 1 else 0 end) where id=v_me.id;
    v_result:=jsonb_build_object('effect','دبیران اسناد تو را معتبرتر ثبت کردند.','reputation_delta',p_tokens,'influence_delta',case when p_tokens=3 then 1 else 0 end);
  elsif p_character_key='court_mobed' then
    update public.kaykha_territories set legitimacy=least(100,legitimacy+2*p_tokens),revision=revision+1
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id;
    v_result:=jsonb_build_object('effect','پشتیبانی آیینی، مشروعیت شهر را بالا برد؛ افشای آن پرهزینه‌تر است.','legitimacy_delta',2*p_tokens,'territory_id',p_target_territory_id);
  elsif p_character_key='free_borderlord' then
    update public.kaykha_territories set strength=least(99,strength+1+(p_tokens/2)),economy=greatest(0,economy-case when p_tokens>=2 then 1 else 0 end),revision=revision+1
    where game_id=p_game_id and territory_id=p_target_territory_id and owner_member_id=v_me.id;
    v_result:=jsonb_build_object('effect','مرزبان نیروی پشتیبان فرستاد؛ حمایت سنگین هزینه اقتصادی دارد.','strength_delta',1+(p_tokens/2),'economy_delta',-case when p_tokens>=2 then 1 else 0 end,'territory_id',p_target_territory_id);
  end if;

  select i.member_id into v_leader_id
  from app_private.kaykha_independent_character_influence i
  where i.game_id=p_game_id and i.character_key=p_character_key
    and app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no)>0
  order by app_private.kaykha_independent_effective_favor(i.favor_score,i.last_bribe_round,v_game.round_no) desc,
           i.last_bribe_round desc,i.updated_at desc limit 1;
  v_became_leader:=v_leader_id=v_me.id;
  if v_became_leader then update public.kaykha_members set prestige=least(999,prestige+1) where id=v_me.id; end if;

  v_result:=v_result || jsonb_build_object(
    'character_key',p_character_key,'character_title',v_title,'tokens_spent',p_tokens,
    'favor_delta',v_favor_delta,'catchup_bonus',v_catchup,'concentration_penalty',v_concentration_penalty,
    'suspicion_delta',v_suspicion_delta,'exposed',v_exposed,'became_leader',v_became_leader,
    'counterplay','نفوذ هر راند ۵ واحد افت می‌کند و رقیبِ عقب‌مانده هنگام ضدپیشنهاد ۲ امتیاز جبران می‌گیرد.'
  );

  insert into app_private.kaykha_independent_bribes(
    game_id,round_no,member_id,character_key,tokens_spent,target_territory_id,
    favor_delta,suspicion_delta,exposed,result
  ) values(
    p_game_id,v_game.round_no,v_me.id,p_character_key,p_tokens,p_target_territory_id,
    v_favor_delta,v_suspicion_delta,v_exposed,v_result
  );

  if v_exposed then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,v_game.round_no,'warning','بوی رشوه از شبکهٔ '||v_title||' به دیوان رسید؛ اعتبار یکی از خاندان‌ها آسیب دید.');
  elsif v_became_leader then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,v_game.round_no,'shadow','توازن نفوذ در محفلِ '||v_title||' تغییر کرد؛ حامی تازه‌ای دست بالا را گرفته است.');
  end if;

  return v_result;
end;
$function$;

revoke all on function public.bribe_kaykha_independent_character(uuid,text,integer,text) from public, anon;
grant execute on function public.bribe_kaykha_independent_character(uuid,text,integer,text) to authenticated;
