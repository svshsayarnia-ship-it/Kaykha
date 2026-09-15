-- Fix variable/alias ambiguity in the crisis resolver that could abort dawn resolution.
create or replace function app_private.advance_kaykha_crises(p_game_id uuid, p_round integer)
returns integer
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
#variable_conflict use_column
declare
  v_game public.kaykha_games%rowtype; v_crisis_id uuid; v_key text; v_resource text;
  v_target text; v_required integer; v_idx integer; v_actions integer:=0;
  c record; t record; e record;
begin
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' then return 0; end if;

  for c in
    select kc.* from public.kaykha_crises kc
    where kc.game_id=p_game_id and kc.status='active' and kc.crisis_key='market_crash' and kc.round_no<p_round
    for update
  loop
    for t in
      select value->>'city_id' as city_id,(value->>'position_no')::smallint as position_no,(value->>'base_income')::smallint as base_income
      from jsonb_array_elements(coalesce(c.payload->'tiles','[]'::jsonb))
    loop
      update public.kaykha_market_tiles mt set base_income=t.base_income
      where mt.game_id=p_game_id and mt.city_id=t.city_id and mt.position_no=t.position_no;
    end loop;
    update public.kaykha_crises kc set status='resolved',resolved_at=now() where kc.id=c.id;
    v_actions:=v_actions+1;
  end loop;

  update public.kaykha_territories target
  set is_in_mutiny=true,mutiny_round=p_round,poverty=least(100,target.poverty+12),
      legitimacy=greatest(0,target.legitimacy-10),economy=greatest(0,target.economy-1),revision=target.revision+1
  where target.game_id=p_game_id and not target.is_in_mutiny and exists(
    select 1 from public.kaykha_territories source
    join app_private.kaykha_city_neighbors n on n.territory_id=source.territory_id and n.neighbor_id=target.territory_id
    where source.game_id=p_game_id and source.is_in_mutiny and source.mutiny_round=p_round-1
  );
  if found then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'danger','شورش دهقانان از شهر همسایه گذشت و به شهر دیگری سرایت کرد.');
    v_actions:=v_actions+1;
  end if;

  update public.kaykha_territories kt
  set owner_member_id=null,strength=greatest(1,kt.strength-1),economy=greatest(0,kt.economy-1),
      legitimacy=greatest(0,kt.legitimacy-20),revision=kt.revision+1
  where kt.game_id=p_game_id and kt.is_in_mutiny and kt.mutiny_round<p_round and kt.owner_member_id is not null;
  if found then
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(p_game_id,p_round,'danger','شورشِ بی‌پاسخ، کنترل یک شهر را از خاندان گرفت.');
    v_actions:=v_actions+1;
  end if;

  update public.kaykha_territories kt
  set poverty=least(100,kt.poverty+greatest(0,kt.zone_tax::integer)+case when kt.economy<=2 then 5 else 0 end),
      legitimacy=greatest(0,kt.legitimacy-greatest(0,kt.zone_tax::integer-1)+case when kt.economy>=5 and kt.zone_tax=0 then 2 else 0 end)
  where kt.game_id=p_game_id and kt.owner_member_id is not null;
  v_actions:=v_actions+1;

  for e in
    select kc.*,
      coalesce((select sum(dp.amount) from public.kaykha_defense_pledges dp
        where dp.game_id=kc.game_id and dp.round_no=kc.round_no and dp.status='pledged'),0)::integer as pledged
    from public.kaykha_crises kc
    where kc.game_id=p_game_id and kc.status='active' and kc.crisis_key='outer_threat' and kc.round_no<p_round
    for update
  loop
    v_required:=coalesce((e.payload->>'required_coins')::integer,12);
    if e.pledged>=v_required then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'defense','بودجهٔ دفاعی کامل شد؛ تهدید بیرونی پشت مرزها متوقف ماند.');
      update public.kaykha_crises kc set status='resolved',resolved_at=now() where kc.id=e.id;
    else
      select territory_id into v_target from public.kaykha_territories kt
      where kt.game_id=p_game_id and kt.territory_id in ('merv','balkh','nishapur','ctesiphon','hormuz')
      order by kt.legitimacy,kt.economy,kt.territory_id limit 1;
      update public.kaykha_territories kt
      set strength=greatest(1,kt.strength-2),economy=greatest(0,kt.economy-1),
          legitimacy=greatest(0,kt.legitimacy-12),revision=kt.revision+1
      where kt.game_id=p_game_id and kt.territory_id=v_target;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','بودجهٔ دفاعی ناکافی بود؛ تهدید بیرونی به مرزهای امپراتوری ضربه زد.');
      update public.kaykha_crises kc set status='failed',resolved_at=now() where kc.id=e.id;
    end if;
    update public.kaykha_defense_pledges dp set status='consumed'
    where dp.game_id=p_game_id and dp.round_no=e.round_no and dp.status='pledged';
    v_actions:=v_actions+1;
  end loop;

  if p_round>=3 and not exists(select 1 from public.kaykha_crises kc where kc.game_id=p_game_id and kc.round_no=p_round) then
    v_idx:=1+mod(abs(hashtext(p_game_id::text||':'||p_round::text)),3);
    if p_round>=6 and mod(p_round,3)=0 then v_key:='outer_threat';
    elsif v_idx=1 then v_key:='market_crash';
    elsif v_idx=2 then v_key:='peasant_rebellion';
    else v_key:='market_crash'; end if;

    if v_key='market_crash' then
      v_idx:=1+mod(abs(hashtext(p_game_id::text||':resource:'||p_round::text)),5);
      v_resource:=(array['silk','copper','carpet','herbs','armor'])[v_idx];
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      select p_game_id,p_round,'market_crash',2,
        jsonb_build_object('resource_key',v_resource,'tiles',coalesce(jsonb_agg(jsonb_build_object('city_id',mt.city_id,'position_no',mt.position_no,'base_income',mt.base_income)),'[]'::jsonb))
      from public.kaykha_market_tiles mt where mt.game_id=p_game_id and mt.resource_key=v_resource
      returning id into v_crisis_id;
      update public.kaykha_market_tiles mt set base_income=0 where mt.game_id=p_game_id and mt.resource_key=v_resource;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'market','سقوط بازار: ارزش یک کالای کلیدی در سراسر امپراتوری برای یک راند به صفر رسید.');
    elsif v_key='peasant_rebellion' then
      select territory_id into v_target from public.kaykha_territories kt
      where kt.game_id=p_game_id and kt.owner_member_id is not null
      order by (kt.poverty+case when kt.economy<=2 then 25 else 0 end) desc,kt.legitimacy,kt.territory_id limit 1 for update;
      update public.kaykha_territories kt set is_in_mutiny=true,mutiny_round=p_round,
        poverty=least(100,kt.poverty+25),legitimacy=greatest(0,kt.legitimacy-18),revision=kt.revision+1
      where kt.game_id=p_game_id and kt.territory_id=v_target;
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      values(p_game_id,p_round,'peasant_rebellion',3,jsonb_build_object('target_territory_id',v_target)) returning id into v_crisis_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','شورش دهقانان آغاز شد؛ اگر سرکوب نشود، در سپیده‌دم بعدی سرایت می‌کند.');
    else
      v_required:=12+greatest(0,v_game.outer_threat_level)*4;
      insert into public.kaykha_crises(game_id,round_no,crisis_key,severity,payload)
      values(p_game_id,p_round,'outer_threat',greatest(2,least(5,v_game.outer_threat_level+2)),jsonb_build_object('required_coins',v_required)) returning id into v_crisis_id;
      update public.kaykha_games kg set outer_threat_level=least(5,kg.outer_threat_level+1),updated_at=now() where kg.id=p_game_id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(p_game_id,p_round,'danger','تهدید انیران از مرز برخاست؛ دیوان باید بودجهٔ دفاعی را تأمین کند.');
    end if;
    v_actions:=v_actions+1;
  end if;
  return v_actions;
end $$;