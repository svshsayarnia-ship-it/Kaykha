-- Kaykha Phase 5C: Winter Age composite-hegemony endgame
-- Applied to production before committing this migration for repository parity.

alter table public.kaykha_games
  drop constraint if exists kaykha_games_mode_check;

alter table public.kaykha_games
  add constraint kaykha_games_mode_check
  check (mode = any (array[
    'hegemony'::text,
    'dynasty'::text,
    'survival'::text,
    'silk_road'::text,
    'invisible_guest'::text,
    'winter_hegemony'::text
  ]));

create or replace function app_private.kaykha_compute_hegemony_scores(p_game_id uuid)
returns table(
  member_id uuid,
  display_name text,
  military_score integer,
  treasury_score integer,
  external_wealth_score integer,
  blood_contract_score integer,
  legitimacy_score integer,
  total_score integer
)
language sql
security definer
set search_path to 'public', 'app_private', 'pg_temp'
as $function$
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
   order by 8 desc, m.id;
$function$;

create or replace function public.get_kaykha_hegemony_scores(p_game_id uuid)
returns table(
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
set search_path to 'public', 'app_private', 'pg_temp'
as $function$
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if not exists (
    select 1 from public.kaykha_members
     where game_id=p_game_id and user_id=(select auth.uid())
  ) then raise exception 'شما عضو این تالار نیستید'; end if;

  return query
  select * from app_private.kaykha_compute_hegemony_scores(p_game_id);
end;
$function$;

create or replace function app_private.evaluate_kaykha_mode(p_game_id uuid, p_round integer)
returns void
language plpgsql
security definer
set search_path to 'public', 'app_private', 'pg_temp'
as $function$
declare
  v_game public.kaykha_games%rowtype; v_winner uuid; v_name text; v_pair record; v_traitor uuid;
  v_horde uuid; v_horde_cities integer; v_human_cities integer; v_score record;
begin
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' then return; end if;

  if v_game.mode='hegemony' then
    select owner_member_id into v_winner
      from public.kaykha_territories
      where game_id=p_game_id and owner_member_id is not null
      group by owner_member_id having count(*)>=4
      order by count(*) desc,owner_member_id limit 1;
    if v_winner is not null then
      select display_name into v_name from public.kaykha_members where id=v_winner;
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory','بحران جانشینی پایان یافت؛ '||v_name||' چهار شهر را زیر یک درفش آورد.');
    end if;

  elsif v_game.mode='dynasty' then
    select c.creator_member_id,c.counterparty_member_id into v_pair
      from public.kaykha_contracts c
      where c.game_id=p_game_id and c.contract_type='treaty' and c.status='active'
        and (select count(*) from public.kaykha_territories t
          where t.game_id=p_game_id and t.owner_member_id in(c.creator_member_id,c.counterparty_member_id))>=4
      order by c.created_at,c.id limit 1;
    if v_pair.creator_member_id is not null then
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory','خون و پیمان وفا کرد؛ دو خاندانِ هم‌پیمان به پیروزی مشترک رسیدند.');
    end if;

  elsif v_game.mode='silk_road' then
    select id,display_name into v_winner,v_name
      from public.kaykha_members where game_id=p_game_id and not is_ai and coins>=120
      order by coins desc,id limit 1;
    if v_winner is not null then
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory',v_name||' با تسلط بر شریان ابریشم، رئیس‌التجار اعظم شد.');
    end if;

  elsif v_game.mode='survival' then
    select id into v_horde from public.kaykha_members
      where game_id=p_game_id and is_ai and house_id='انیران';
    select count(*) into v_horde_cities from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_horde;
    select count(*) into v_human_cities from public.kaykha_territories t
      join public.kaykha_members m on m.id=t.owner_member_id
      where t.game_id=p_game_id and not m.is_ai;
    if coalesce(v_horde_cities,0)>=4 or coalesce(v_human_cities,0)=0 then
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','انیران چهار شهر را بلعید؛ مرزها در تاریکی فرو رفتند.');
    elsif p_round>=8 and not exists(
      select 1 from public.kaykha_territories t
      join public.kaykha_members m on m.id=t.owner_member_id
      where t.game_id=p_game_id and not m.is_ai and t.is_in_mutiny
    ) then
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory','هجوم انیران فروریخت؛ بازماندگان مرز را تا سپیده‌دم هشتم نگه داشتند.');
    end if;

  elsif v_game.mode='invisible_guest' then
    select member_id into v_traitor from app_private.kaykha_hidden_roles
      where game_id=p_game_id and role_key='invisible_guest';
    if v_traitor is not null and (select count(*) from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_traitor)>=4 then
      select display_name into v_name from public.kaykha_members where id=v_traitor;
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'shadow','مهمان ناخوانده نقابش را برداشت؛ '||v_name||' با قتل خاموشِ پیمان‌ها پیروز شد.');
    elsif v_traitor is not null and not exists(
      select 1 from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_traitor
    ) then
      update public.kaykha_games set status='finished',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'victory','قلمرو مهمان ناخوانده فرو ریخت؛ دیگر خاندان‌ها پیش از تاریکی او را متوقف کردند.');
    end if;

  elsif v_game.mode='winter_hegemony' and p_round >= coalesce(v_game.winter_round,8) then
    select s.* into v_score
      from app_private.kaykha_compute_hegemony_scores(p_game_id) s
      order by s.total_score desc, s.military_score desc, s.legitimacy_score desc, s.member_id
      limit 1;
    if v_score.member_id is not null then
      update public.kaykha_games set status='finished',phase='resolution',updated_at=now() where id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(
        p_game_id,
        p_round,
        'victory',
        format(
          'عصر زمستان فرا رسید؛ %s با هژمونی ترکیبی %s امتیازی برنده شد (نظامی %s، خزانه %s، ثروت بیرونی %s، پیمان‌های خون %s، مشروعیت %s).',
          v_score.display_name,
          v_score.total_score,
          v_score.military_score,
          v_score.treasury_score,
          v_score.external_wealth_score,
          v_score.blood_contract_score,
          v_score.legitimacy_score
        )
      );
    end if;
  end if;
end;
$function$;

create or replace function public.create_kaykha_game(
  p_display_name text,
  p_house_id text,
  p_total_seats integer default 6,
  p_mode text default 'hegemony'
)
returns table(game_id uuid, game_code text)
language plpgsql
security definer
set search_path to 'public', 'app_private', 'pg_temp'
as $function$
declare v_game_id uuid; v_code text; v_member_id uuid; v_attempt integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then raise exception 'نام فرمانده باید بین ۲ تا ۳۲ کاراکتر باشد'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then raise exception 'خاندان نامعتبر است'; end if;
  if p_total_seats not between 4 and 6 then raise exception 'نقشهٔ فعلی برای چهار تا شش فرمانده طراحی شده است'; end if;
  if p_mode not in ('hegemony','dynasty','survival','silk_road','invisible_guest','winter_hegemony') then raise exception 'حالت بازی نامعتبر است'; end if;
  loop
    v_attempt:=v_attempt+1;
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
      insert into public.kaykha_games(code,host_user_id,total_seats,mode)
      values(v_code,(select auth.uid()),p_total_seats,p_mode) returning id into v_game_id;
      exit;
    exception when unique_violation then
      if v_attempt>=8 then raise; end if;
    end;
  end loop;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,seat_no)
  values(v_game_id,(select auth.uid()),trim(p_display_name),trim(p_house_id),1)
  returning id into v_member_id;
  insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence)
  values
    (v_game_id,'ray',v_member_id,5,4,3),
    (v_game_id,'ctesiphon',null,4,5,3),
    (v_game_id,'isfahan',null,4,4,3),
    (v_game_id,'hegmataneh',null,4,3,2),
    (v_game_id,'nishapur',null,3,5,3),
    (v_game_id,'merv',null,2,5,3),
    (v_game_id,'balkh',null,3,4,3),
    (v_game_id,'yazd',null,3,4,3),
    (v_game_id,'alamut',null,4,3,3),
    (v_game_id,'gorgan',v_member_id,3,3,4),
    (v_game_id,'tabriz',null,4,4,3),
    (v_game_id,'susa',null,3,4,3),
    (v_game_id,'hormuz',null,3,5,4),
    (v_game_id,'shiraz',null,4,4,3),
    (v_game_id,'bam',null,3,3,3),
    (v_game_id,'zaranj',null,3,4,3);
  perform app_private.seed_kaykha_market(v_game_id);
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game_id,0,'neutral','تالار برپا شد؛ بازار و دربار منتظر خاندان‌هاست.');
  return query select v_game_id,v_code;
end;
$function$;

insert into public.kaykha_rule_catalog(
  rule_key,scope,subject_key,title,summary,timing,effect_spec,enabled,revision
)
values(
  'mode.winter_hegemony',
  'mode',
  'winter_hegemony',
  'عصر زمستان',
  'بازی در راند زمستان با هژمونی ترکیبی پایان می‌یابد؛ شمشیر، خزانه، نفوذ بیرونی، پیمان‌های خون و مشروعیت با هم سنجیده می‌شوند.',
  'resolution',
  jsonb_build_object(
    'winter_round', 8,
    'score_components', jsonb_build_array('military','treasury','external_wealth','blood_contracts','legitimacy'),
    'tie_break', jsonb_build_array('military','legitimacy','member_id')
  ),
  true,
  1
)
on conflict (rule_key) do update set
  title=excluded.title,
  summary=excluded.summary,
  timing=excluded.timing,
  effect_spec=excluded.effect_spec,
  enabled=excluded.enabled,
  revision=excluded.revision,
  updated_at=now();
