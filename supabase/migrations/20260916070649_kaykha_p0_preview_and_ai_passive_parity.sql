alter function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) rename to get_kaykha_command_preview_legacy_p0;

create function public.get_kaykha_command_preview(
  p_game_id uuid,
  p_order_type text,
  p_origin_territory_id text,
  p_target_territory_id text,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_me uuid;
  v_target_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select id into v_me from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if v_me is null then raise exception 'تو عضو این تالار نیستی'; end if;

  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=p_game_id and territory_id=trim(p_target_territory_id);
  if not found then raise exception 'هدف فرمان روی نقشه وجود ندارد'; end if;

  if p_order_type in ('attack','raid','sabotage') and v_target_owner=v_me then
    raise exception 'فرمان خصمانه را نمی‌توان روی قلمرو خودی پیش‌نمایش کرد';
  end if;
  if p_order_type in ('spy','revolt','spell') and (v_target_owner is null or v_target_owner=v_me) then
    raise exception 'این فرمان باید قلمرو زندهٔ یکی از رقبا را هدف بگیرد';
  end if;
  return public.get_kaykha_command_preview_legacy_p0(
    p_game_id,p_order_type,p_origin_territory_id,p_target_territory_id,p_payload
  );
end;
$function$;

grant execute on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) to authenticated;

create or replace function app_private.apply_kaykha_passive_rules(p_game_id uuid,p_round integer)
returns void
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  r record; v_amount integer; v_contracts integer; v_caravans integer;
begin
  for r in
    select id from public.kaykha_members
    where game_id=p_game_id and house_id='ساسانیان'
  loop
    select count(*) into v_contracts
    from public.kaykha_contracts
    where game_id=p_game_id and status='active'
      and contract_type in ('treaty','joint_venture','blood_debt','vassalage');
    v_amount:=least(20,v_contracts);
    if v_amount>0 then
      update public.kaykha_members set coins=least(999,coins+v_amount) where id=r.id;
      perform app_private.record_kaykha_effect(
        p_game_id,p_round,'family.ساسانیان',r.id,null,null,jsonb_build_object('coins',v_amount,'contracts',v_contracts)
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'economy','خزانهٔ ساسانی از پیمان‌های رسمی، '||v_amount||' سکه مالیات گرفت.');
    end if;
  end loop;

  for r in
    select id from public.kaykha_members
    where game_id=p_game_id and house_id='سامانیان'
  loop
    select count(distinct o.order_id) into v_caravans
    from app_private.kaykha_secret_orders o
    where o.game_id=p_game_id and o.round_no=p_round and o.order_type='caravan' and o.member_id<>r.id
      and exists(
        select 1 from public.kaykha_deeds d
        where d.game_id=o.game_id and d.city_id=o.target_territory_id and d.owner_member_id=r.id
      )
      and not exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.source_member_id=o.member_id and e.effect_key='class.smuggler_convoy'
          and e.consumed_at is null and e.expires_round>=p_round
      );
    if v_caravans>0 then
      v_amount:=least(30,v_caravans*2);
      update public.kaykha_members set coins=least(999,coins+v_amount) where id=r.id;
      perform app_private.record_kaykha_effect(
        p_game_id,p_round,'family.سامانیان',r.id,null,null,jsonb_build_object('coins',v_amount,'taxed_caravans',v_caravans)
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'economy','کاروان‌های گذری در شریان ابریشم، حق عبور سامانیان را پرداختند.');
    end if;
  end loop;

  for r in
    select id from public.kaykha_members
    where game_id=p_game_id and house_id='زیاریان'
  loop
    select count(*) into v_caravans
    from app_private.kaykha_secret_orders o
    join public.kaykha_territories t on t.game_id=o.game_id and t.territory_id=o.target_territory_id
    where o.game_id=p_game_id and o.round_no=p_round and o.order_type='caravan'
      and o.member_id<>r.id and t.owner_member_id=r.id
      and not exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.source_member_id=o.member_id and e.effect_key='class.smuggler_convoy'
          and e.consumed_at is null and e.expires_round>=p_round
      );
    if v_caravans>0 then
      update public.kaykha_members set coins=least(999,coins+v_caravans) where id=r.id;
      perform app_private.record_kaykha_effect(
        p_game_id,p_round,'family.زیاریان',r.id,null,null,jsonb_build_object('coins',v_caravans,'tolls',v_caravans,'rate_percent',10)
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'economy','باج‌گیران البرز از کاروان‌های گذری سهم ده‌درصدی خود را گرفتند.');
    end if;
  end loop;
end;
$function$;
