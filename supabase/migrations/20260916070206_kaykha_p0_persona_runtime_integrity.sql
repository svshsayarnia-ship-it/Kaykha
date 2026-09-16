alter function public.use_kaykha_class_action(uuid,text,jsonb) rename to use_kaykha_class_action_legacy_p0;

create function public.use_kaykha_class_action(
  p_game_id uuid,
  p_target_territory_id text,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_member public.kaykha_members%rowtype;
  v_role text;
  v_target_owner uuid;
  v_effect text;
  v_reveal boolean:=false;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then
    raise exception 'فرمان کلاس در پردهٔ خنجرهای پنهان ثبت می‌شود';
  end if;
  select * into v_member from public.kaykha_members
    where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found then raise exception 'شما عضو این تالار نیستید'; end if;
  if v_member.persona_key is null then raise exception 'ابتدا هویت خود را قفل کن'; end if;

  v_role:=split_part(v_member.persona_key,' · ',1);
  v_reveal:=v_member.shadow_awakened;

  if (not v_member.shadow_awakened and v_role not in ('چشم شاه','رئیس‌التجار','پیر کوهستان'))
     or (v_member.shadow_awakened and v_role not in ('دهقان','خواب‌گزار','پرده‌خوان')) then
    return public.use_kaykha_class_action_legacy_p0(p_game_id,p_target_territory_id,p_payload);
  end if;

  if v_member.class_action_round=v_game.round_no then
    raise exception 'فرمان کلاس این راند پیش‌تر ثبت شده است';
  end if;
  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=p_game_id and territory_id=trim(p_target_territory_id);
  if not found then raise exception 'هدف روی نقشه نیست'; end if;

  if not v_member.shadow_awakened then
    case v_role
      when 'چشم شاه' then
        if v_target_owner<>v_member.id then raise exception 'سایه‌بان فقط از قلمرو خودت محافظت می‌کند'; end if;
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.counterspy',v_member.id,v_member.id,trim(p_target_territory_id),
          v_game.round_no,'{}'::jsonb
        );
        v_effect:='سایه‌بان روی شهر خودی نشست؛ جاسوسی، طلسم و خرابکاریِ پنهان آنجا بی‌اثر می‌شود.';

      when 'رئیس‌التجار' then
        if v_target_owner<>v_member.id then raise exception 'کاروانسرا باید در قلمرو خودت برپا شود'; end if;
        update public.kaykha_territories
          set economy=least(99,economy+2),revision=revision+1
          where game_id=p_game_id and territory_id=trim(p_target_territory_id);
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.smuggler_convoy',v_member.id,v_member.id,trim(p_target_territory_id),
          v_game.round_no,jsonb_build_object('source_persona','رئیس‌التجار','kind','caravan_network')
        );
        v_effect:='کاروانسرا ساخته شد؛ اقتصاد شهر دو پله بالا رفت و کاروان‌های تو در همین راند از عوارض مسیر معاف‌اند.';

      when 'پیر کوهستان' then
        if v_target_owner<>v_member.id then raise exception 'فرمان مرشد برای سپاه خودی است'; end if;
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.murshid',v_member.id,v_member.id,trim(p_target_territory_id),
          v_game.round_no+1,'{}'::jsonb
        );
        update public.kaykha_territories set strength=least(99,strength+1),revision=revision+1
          where game_id=p_game_id and territory_id=trim(p_target_territory_id);
        v_effect:='مرشد روحیهٔ سپاه را بست؛ یک قدرت فوری گرفت و سپر مرشد تا پایان راند بعد فعال می‌ماند.';
    end case;
  else
    case v_role
      when 'دهقان' then
        if v_target_owner<>v_member.id then raise exception 'شبکهٔ قاچاق از یکی از شهرهای خودت آغاز می‌شود'; end if;
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.smuggler_convoy',v_member.id,v_member.id,trim(p_target_territory_id),
          v_game.round_no,'{}'::jsonb
        );
        v_effect:='قاچاقچی مسیر نامرئی را باز کرد؛ کاروان تو در این راند از عوارض مسیر می‌گذرد.';

      when 'خواب‌گزار' then
        if v_target_owner is null or v_target_owner=v_member.id then raise exception 'هزارتو باید نجواهای یکی از رقبا را نشانه بگیرد'; end if;
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.labyrinth',v_member.id,v_target_owner,trim(p_target_territory_id),
          v_game.round_no,'{}'::jsonb
        );
        v_effect:='هزارتو فعال شد؛ یک نجوا از حلقهٔ رقیب در همین سپیده‌دم مخدوش خواهد شد.';

      when 'پرده‌خوان' then
        if v_target_owner is null or v_target_owner=v_member.id then raise exception 'تحریف‌گر باید یکی از رقیبان را نشانه بگیرد'; end if;
        insert into app_private.kaykha_effect_states(
          game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
        ) values(
          p_game_id,v_game.round_no,'class.log_forge',v_member.id,v_target_owner,trim(p_target_territory_id),
          v_game.round_no,'{}'::jsonb
        );
        v_effect:='تحریف‌گر آماده است؛ یک خط از دفتر وقایعِ همین سپیده‌دم با روایت مبهم جایگزین می‌شود.';
    end case;
  end if;

  if v_effect is null then raise exception 'این فرمان برای هدف انتخابی قابل اجرا نیست'; end if;
  update public.kaykha_members
    set class_action_round=v_game.round_no,
      class_action_count=class_action_count+1,
      shadow_revealed_at=case when v_reveal and shadow_revealed_at is null then now() else shadow_revealed_at end
    where id=v_member.id;

  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(
    p_game_id,v_game.round_no,case when v_reveal then 'shadow' else 'class' end,
    case when v_reveal then 'قدرت تاریک یکی از فرماندهان از پرده بیرون افتاد؛ ' else '' end||v_effect
  );
  return jsonb_build_object('effect',v_effect,'shadow_revealed',v_reveal,'round_no',v_game.round_no);
end;
$function$;

grant execute on function public.use_kaykha_class_action(uuid,text,jsonb) to authenticated;
