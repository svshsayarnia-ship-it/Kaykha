create or replace function app_private.kaykha_validate_secret_order_route()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_origin_owner uuid;
  v_target_owner uuid;
begin
  select owner_member_id into v_origin_owner
  from public.kaykha_territories
  where game_id=new.game_id and territory_id=new.origin_territory_id;
  if not found or v_origin_owner is distinct from new.member_id then
    raise exception 'مبدأ فرمان باید قلمرو واقعی همان فرمانده باشد';
  end if;

  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=new.game_id and territory_id=new.target_territory_id;
  if not found then raise exception 'هدف فرمان روی نقشه وجود ندارد'; end if;

  if new.order_type in ('attack','raid','sabotage') and v_target_owner=new.member_id then
    raise exception 'فرمان خصمانه را نمی‌توان روی قلمرو خودی مهر کرد';
  end if;
  if new.order_type in ('spy','revolt','spell') and (v_target_owner is null or v_target_owner=new.member_id) then
    raise exception 'این فرمان باید قلمرو زندهٔ یکی از رقبا را هدف بگیرد';
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_validate_secret_order_route on app_private.kaykha_secret_orders;
create trigger kaykha_validate_secret_order_route
before insert or update of order_type,origin_territory_id,target_territory_id,member_id
on app_private.kaykha_secret_orders
for each row execute function app_private.kaykha_validate_secret_order_route();

create or replace function public.create_kaykha_practice_game(
  p_display_name text default 'فرمانده',
  p_house_id text default 'هخامنشیان',
  p_persona_key text default 'اسپهبد · پاسدار',
  p_difficulty text default 'easy'
) returns table(game_id uuid,game_code text,ai_member_id uuid)
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
#variable_conflict use_column
declare
  v_game_id uuid; v_code text; v_human uuid; v_ai uuid; v_ai_house text; v_attempt integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_difficulty not in ('easy','hard','mastermind') then raise exception 'سطح هوش مصنوعی نامعتبر است'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 32 then p_display_name:='فرمانده'; end if;
  if char_length(trim(coalesce(p_house_id,''))) not between 2 and 64 then p_house_id:='هخامنشیان'; end if;

  update public.kaykha_games g set status='finished',updated_at=now()
  where g.host_user_id=(select auth.uid()) and g.is_practice and g.status='active';

  loop
    v_attempt:=v_attempt+1;
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
      insert into public.kaykha_games(code,host_user_id,status,total_seats,phase,round_no,mode,is_practice,practice_difficulty,winter_round)
      values(v_code,(select auth.uid()),'active',4,'orders',1,'hegemony',true,p_difficulty,8)
      returning id into v_game_id;
      exit;
    exception when unique_violation then if v_attempt>=8 then raise; end if; end;
  end loop;

  insert into public.kaykha_members(game_id,user_id,display_name,house_id,is_ai,persona_key,seat_no)
  values(v_game_id,(select auth.uid()),trim(p_display_name),trim(p_house_id),false,trim(coalesce(p_persona_key,'اسپهبد · پاسدار')),1)
  returning id into v_human;

  v_ai_house:=case when trim(p_house_id)='ساسانیان' then 'اشکانیان' else 'ساسانیان' end;
  insert into public.kaykha_members(game_id,user_id,display_name,house_id,is_ai,ai_difficulty,ai_personality,persona_key,seat_no)
  values(v_game_id,null,'دربار هوش مصنوعی',v_ai_house,true,p_difficulty,
    case p_difficulty when 'easy' then 'reactive' when 'hard' then 'adaptive' else 'mastermind' end,
    case p_difficulty when 'mastermind' then 'خواب‌گزار · بیدارگر' else 'اسپهبد · پاسدار' end,2)
  returning id into v_ai;

  update public.kaykha_members
  set coins=44,influence_tokens=7,bribe_tokens=2,search_tokens=2,
      reputation_score=50,credit_limit=20,suspicion_level=0
  where game_id=v_game_id;

  delete from public.kaykha_territories t where t.game_id=v_game_id;
  insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence) values
    (v_game_id,'ray',v_human,5,4,3),(v_game_id,'gorgan',v_human,3,3,4),
    (v_game_id,'isfahan',v_ai,5,4,3),(v_game_id,'nishapur',v_ai,3,3,4),
    (v_game_id,'ctesiphon',null,4,5,3),(v_game_id,'hegmataneh',null,4,3,2),
    (v_game_id,'merv',null,2,5,3),(v_game_id,'balkh',null,3,4,3),
    (v_game_id,'yazd',null,3,4,3),(v_game_id,'alamut',null,4,3,3),
    (v_game_id,'tabriz',null,4,4,3),(v_game_id,'susa',null,3,4,3),
    (v_game_id,'hormuz',null,3,5,4),(v_game_id,'shiraz',null,4,4,3),
    (v_game_id,'bam',null,3,3,3),(v_game_id,'zaranj',null,3,4,3);

  perform app_private.seed_kaykha_market(v_game_id);
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(v_game_id,1,'neutral','تمرین متقارن آغاز شد؛ هر دو طرف با دو شهر و منابع پایهٔ یکسان از همان موتور آنلاین استفاده می‌کنند.');
  return query select v_game_id,v_code,v_ai;
end;
$function$;

grant execute on function public.create_kaykha_practice_game(text,text,text,text) to authenticated;

alter function app_private.plan_kaykha_practice_ai(uuid,integer) rename to plan_kaykha_practice_ai_legacy_p0;
create function app_private.plan_kaykha_practice_ai(p_game_id uuid,p_round integer)
returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  if not exists(
    select 1
    from app_private.kaykha_secret_orders so
    join public.kaykha_members m on m.id=so.member_id
    where so.game_id=p_game_id and so.round_no=p_round and not m.is_ai
  ) then
    return jsonb_build_object('waiting_for_human',true);
  end if;
  return app_private.plan_kaykha_practice_ai_legacy_p0(p_game_id,p_round);
end;
$function$;

create or replace function app_private.kaykha_seed_suren_first_attack_on_start()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  if old.status='lobby' and new.status='active' then
    insert into app_private.kaykha_effect_states(game_id,round_no,effect_key,source_member_id,expires_round,payload)
    select new.id,new.round_no,'family.سورن',m.id,9999,jsonb_build_object('first_attack_ready',true)
    from public.kaykha_members m
    where m.game_id=new.id and m.house_id='سورن'
      and not exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=new.id and e.source_member_id=m.id and e.effect_key='family.سورن'
      );
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_seed_suren_first_attack_on_start on public.kaykha_games;
create trigger kaykha_seed_suren_first_attack_on_start
after update of status on public.kaykha_games
for each row execute function app_private.kaykha_seed_suren_first_attack_on_start();

create or replace function app_private.kaykha_seed_suren_first_attack_on_member()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  if new.house_id='سورن' and exists(select 1 from public.kaykha_games g where g.id=new.game_id and g.status='active') then
    insert into app_private.kaykha_effect_states(game_id,round_no,effect_key,source_member_id,expires_round,payload)
    select new.game_id,g.round_no,'family.سورن',new.id,9999,jsonb_build_object('first_attack_ready',true)
    from public.kaykha_games g where g.id=new.game_id
    on conflict do nothing;
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_seed_suren_first_attack_on_member on public.kaykha_members;
create trigger kaykha_seed_suren_first_attack_on_member
after insert or update of house_id on public.kaykha_members
for each row execute function app_private.kaykha_seed_suren_first_attack_on_member();

create or replace function app_private.kaykha_consume_suren_first_attack()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  if new.effect_key='family.سورن' and coalesce((new.payload->>'first_attack_used')::boolean,false) then
    update app_private.kaykha_effect_states
    set consumed_at=coalesce(consumed_at,now())
    where game_id=new.game_id and source_member_id=new.source_member_id
      and effect_key='family.سورن' and consumed_at is null;
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_consume_suren_first_attack on app_private.kaykha_effect_states;
create trigger kaykha_consume_suren_first_attack
after insert on app_private.kaykha_effect_states
for each row execute function app_private.kaykha_consume_suren_first_attack();

insert into app_private.kaykha_effect_states(game_id,round_no,effect_key,source_member_id,expires_round,payload)
select g.id,g.round_no,'family.سورن',m.id,9999,jsonb_build_object('first_attack_ready',true,'migration_seed',true)
from public.kaykha_games g
join public.kaykha_members m on m.game_id=g.id and m.house_id='سورن'
where g.status='active'
  and not exists(
    select 1 from app_private.kaykha_effect_states e
    where e.game_id=g.id and e.source_member_id=m.id and e.effect_key='family.سورن'
  );
