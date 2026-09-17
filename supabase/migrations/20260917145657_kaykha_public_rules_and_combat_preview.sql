-- Phase 1 rules clarity.
-- Exposes only public/own information. Hidden defender effects remain hidden.

create or replace function public.get_kaykha_command_preview(
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
  v_house text;
  v_target_owner uuid;
  v_preview jsonb;
  v_attack integer;
  v_visible_defense integer;
  v_suren_first boolean:=false;
  v_failure_attrition integer:=1;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;

  select id,house_id into v_me,v_house
  from public.kaykha_members
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

  v_preview:=public.get_kaykha_command_preview_legacy_p0(
    p_game_id,p_order_type,p_origin_territory_id,p_target_territory_id,p_payload
  );

  if p_order_type='attack' then
    select strength into v_attack
    from public.kaykha_territories
    where game_id=p_game_id and territory_id=trim(p_origin_territory_id) and owner_member_id=v_me;
    if v_attack is null then raise exception 'مبدأ باید یکی از قلمروهای تو باشد'; end if;

    -- Deliberately use only public base strength for the defender. illusion_strength,
    -- Murshid and other hidden defender effects must not leak through preview.
    select strength into v_visible_defense
    from public.kaykha_territories
    where game_id=p_game_id and territory_id=trim(p_target_territory_id);

    if v_house='سورن' then
      select exists(
        select 1 from app_private.kaykha_effect_states e
        where e.game_id=p_game_id and e.effect_key='family.سورن' and e.source_member_id=v_me
          and e.consumed_at is null and coalesce((e.payload->>'first_attack_ready')::boolean,true)
      ) into v_suren_first;
      if v_suren_first then v_attack:=v_attack+2; end if;
    end if;

    if v_house='اشکانیان' then v_failure_attrition:=0; end if;

    v_preview:=v_preview||jsonb_build_object(
      'combat',jsonb_build_object(
        'model','deterministic_visible_snapshot',
        'visible_attack_power',v_attack,
        'visible_defense_power',v_visible_defense,
        'visible_conquest_estimate_pct',case when v_attack>v_visible_defense then 100 else 0 end,
        'success_rule','در نبرد عادی، قدرت حمله باید از دفاع بیشتر باشد؛ برابری برای فتح کافی نیست.',
        'normal_failure_attrition',v_failure_attrition,
        'attrition_rule',case when v_house='اشکانیان'
          then 'در شکست عادی، اشکانیان از نبرد بی‌تلفات بازمی‌گردند.'
          else 'در حملهٔ عادی، مبدأ پس از درگیری ۱ قدرت از دست می‌دهد؛ برخی اثرهای ویژه می‌توانند این قاعده را تغییر دهند.' end,
        'simultaneous_tie_rule','اگر چند حمله هم‌زمان از دفاع عبور کنند، حاشیهٔ قدرت بیشتر برنده است؛ سپس نوبت ابتکار چرخشی تعیین‌کننده می‌شود.',
        'hidden_modifiers_notice','این درصد فقط بر اساس اطلاعات آشکار است. وهم، مرشد، بست، پیمان خون و اثرهای پنهان مدافع عمداً افشا نمی‌شوند.'
      )
    );
  end if;

  return v_preview;
end;
$function$;

grant execute on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) to authenticated;

create or replace function public.get_kaykha_public_rules(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  if not exists(
    select 1 from public.kaykha_members
    where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai
  ) then raise exception 'تو عضو این تالار نیستی'; end if;

  return jsonb_build_object(
    'rules_version','2026.09.17-r1',
    'round',jsonb_build_object(
      'number',v_game.round_no,
      'phase',v_game.phase,
      'timing_mode','event_driven',
      'fixed_duration_seconds',null,
      'dawn_condition','سپیده‌دم تایمر ثابت ندارد؛ وقتی فرمان‌های لازم مهر شده باشند، میزبان/موتور Shared Resolver راند را حل می‌کند.'
    ),
    'winter',jsonb_build_object(
      'mode',v_game.mode,
      'end_round',case when v_game.mode='winter_hegemony' then coalesce(v_game.winter_round,8) else null end,
      'rounds_remaining',case when v_game.mode='winter_hegemony' then greatest(0,coalesce(v_game.winter_round,8)-v_game.round_no) else null end,
      'end_condition',case when v_game.mode='winter_hegemony'
        then 'در پایان راند زمستان، بالاترین هژمونی ترکیبی برنده است.'
        else 'شرط پایان به حالت انتخاب‌شدهٔ تالار وابسته است.' end
    ),
    'combat',jsonb_build_object(
      'normal_success','attack_power > defense_power',
      'equal_is_success',false,
      'origin_attrition',1,
      'parthian_failed_attack_attrition',0,
      'capture_strength','max(1, attack_power - defense_power)',
      'simultaneous_target_tiebreak',jsonb_build_array('margin_desc','rotating_initiative_asc','order_id_asc'),
      'hidden_information','اثرهای پنهان مدافع در پیش‌نمایش عمومی افشا نمی‌شوند.'
    ),
    'hegemony',jsonb_build_object(
      'military','مجموع (قدرت هر شهر × ۴) + (تعداد شهر × ۵)',
      'treasury','تعداد سکهٔ خزانه',
      'external_wealth','درآمد املاک خارج از قلمرو: دکان ×۱، تیمچه/merchant_house ×۲، سطح سوم ×۳',
      'blood_contracts','هر پیمان خون فعال یا انجام‌شده × ۶',
      'legitimacy','مجموع مشروعیت شهرهای تحت کنترل',
      'total','نظامی + خزانه + ثروت بیرونی + پیمان خون + مشروعیت',
      'winner_tiebreak',jsonb_build_array('total_score_desc','military_score_desc','legitimacy_score_desc','member_id_stable')
    )
  );
end;
$function$;

revoke all on function public.get_kaykha_public_rules(uuid) from public,anon;
grant execute on function public.get_kaykha_public_rules(uuid) to authenticated;
