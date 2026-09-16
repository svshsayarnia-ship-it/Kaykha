create or replace function app_private.start_survival_horde()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $function$
declare v_horde uuid; v_seat smallint; v_start_city text;
begin
 if old.status='lobby' and new.status='active' and new.mode='survival'
   and not exists(select 1 from public.kaykha_members where game_id=new.id and is_ai and house_id='انیران') then
   select gs::smallint into v_seat
   from generate_series(1,16) gs
   where not exists(select 1 from public.kaykha_members m where m.game_id=new.id and m.seat_no=gs)
   order by gs desc limit 1;

   select territory_id into v_start_city
   from public.kaykha_territories
   where game_id=new.id and territory_id='merv'
   limit 1;

   if v_seat is not null and v_start_city is not null then
     insert into public.kaykha_members(game_id,user_id,display_name,house_id,is_ai,ai_difficulty,ai_personality,seat_no,coins,influence_tokens)
     values(new.id,null,'هجوم انیران','انیران',true,'hard','horde',v_seat,0,0)
     returning id into v_horde;

     update public.kaykha_territories
        set owner_member_id=v_horde,strength=6,economy=2,revision=revision+1
      where game_id=new.id and territory_id=v_start_city;

     insert into public.kaykha_events(game_id,round_no,tone,body)
     values(new.id,new.round_no,'danger','هجوم انیران از مرو برخاست؛ این دشمن با کسی پیمان نمی‌بندد.');
   elsif v_start_city is null then
     raise exception 'شهر آغاز هجوم انیران (merv) در نقشه این تالار وجود ندارد';
   end if;
 end if;
 return new;
end;
$function$;

do $patch$
declare
  v_def text;
  v_old text := $old$
        update public.kaykha_deeds set is_raided=true
        where id=(
          select d.id from public.kaykha_deeds d
          where d.game_id=p_game_id and d.city_id=o.target_territory_id and not d.is_protected and not d.is_raided
            and ((o.order_type='raid' and d.zone_key='gates') or (o.order_type='sabotage' and d.zone_key='guild_alleys'))
          order by d.id limit 1
        );
        insert into public.kaykha_events(game_id,round_no,tone,body)
        values(p_game_id,v_game.round_no,'danger',
          case when o.order_type='raid' then 'غبار غارت از گمرکِ '||o.target_territory_id||' برخاست.'
            else 'آتشِ خرابکاری در راستهٔ اصنافِ '||o.target_territory_id||' افتاد.' end
        );
$old$;
  v_new text := $new$
        select owner_member_id into v_defender
        from public.kaykha_territories
        where game_id=p_game_id and territory_id=o.target_territory_id;

        update public.kaykha_deeds set is_raided=true
        where id=(
          select d.id from public.kaykha_deeds d
          where d.game_id=p_game_id and d.city_id=o.target_territory_id and not d.is_protected and not d.is_raided
            and ((o.order_type='raid' and d.zone_key='gates') or (o.order_type='sabotage' and d.zone_key='guild_alleys'))
          order by d.id limit 1
        );

        if found then
          perform app_private.record_kaykha_effect(
            p_game_id,v_game.round_no,'order.'||o.order_type||'.success',o.member_id,v_defender,o.target_territory_id,
            jsonb_build_object('order_id',o.order_id,'outcome','success')
          );
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'danger',
            case when o.order_type='raid' then 'غبار غارت از گمرکِ '||o.target_territory_id||' برخاست.'
              else 'آتشِ خرابکاری در راستهٔ اصنافِ '||o.target_territory_id||' افتاد.' end
          );
        else
          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(p_game_id,v_game.round_no,'warning',
            case when o.order_type='raid' then 'غارت به هدف اقتصادی بی‌پناهی نرسید.'
              else 'خرابکاری هدف اقتصادی بی‌پناهی برای از کار انداختن پیدا نکرد.' end
          );
        end if;
$new$;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='resolve_kaykha_round_core'
  order by p.oid limit 1;

  if position(v_old in v_def)=0 then
    raise exception 'raid/sabotage resolver patch point not found';
  end if;

  v_def := replace(v_def,v_old,v_new);
  execute v_def;
end;
$patch$;

create or replace function app_private.after_invisible_guest_kill()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $function$
declare
  v_traitor uuid;
  v_target_owner uuid;
  v_target_territory text;
  v_contract uuid;
begin
  if old.phase='orders' and new.phase='negotiation' and new.round_no=old.round_no+1
    and new.mode='invisible_guest' then
    select member_id into v_traitor
    from app_private.kaykha_hidden_roles
    where game_id=new.id and role_key='invisible_guest';

    if v_traitor is not null then
      select r.target_member_id,r.target_territory_id
        into v_target_owner,v_target_territory
      from app_private.kaykha_round_effects r
      where r.game_id=new.id
        and r.round_no=old.round_no
        and r.rule_key='order.sabotage.success'
        and r.source_member_id=v_traitor
      order by r.created_at,r.id
      limit 1;

      if v_target_owner is not null then
        select c.id into v_contract
        from public.kaykha_contracts c
        where c.game_id=new.id and c.contract_type='treaty' and c.status='active'
          and (c.creator_member_id=v_target_owner or c.counterparty_member_id=v_target_owner)
        order by c.created_at,c.id limit 1 for update;

        if v_contract is not null then
          update public.kaykha_contracts
             set status='broken',resolved_at=now()
           where id=v_contract;

          perform app_private.record_kaykha_effect(
            new.id,old.round_no,'mode.invisible_guest',v_traitor,v_target_owner,v_target_territory,
            jsonb_build_object('effect','silent_kill','broken_contract_id',v_contract,'requires_successful_sabotage',true)
          );

          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(new.id,old.round_no,'shadow','یک خرابکاری موفق، پیمانی رسمی را بی‌صدا پاره کرد؛ هیچ نامی پای این خنجر نبود.');
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$function$;
