alter function public.use_kaykha_family_doctrine(uuid,text,jsonb) rename to use_kaykha_family_doctrine_legacy_p0;

create function public.use_kaykha_family_doctrine(
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
  v_target_owner uuid;
  v_recipient uuid;
  v_rule text;
  v_effect text;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then
    raise exception 'فرمان خاندان فقط در پردهٔ خنجرهای پنهان ثبت می‌شود';
  end if;
  select * into v_member from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found then raise exception 'شما عضو این تالار نیستید'; end if;

  if v_member.house_id not in ('وراز','نهابد') then
    return public.use_kaykha_family_doctrine_legacy_p0(p_game_id,p_target_territory_id,p_payload);
  end if;
  if v_member.family_action_round=v_game.round_no then raise exception 'فرمان خاندان این راند پیش‌تر ثبت شده است'; end if;

  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=p_game_id and territory_id=trim(p_target_territory_id);
  if not found then raise exception 'هدف روی نقشه نیست'; end if;
  v_rule:='family.'||v_member.house_id;

  if v_member.house_id='وراز' then
    if v_target_owner=v_member.id then raise exception 'زمین سوخته باید روی قلمرو دشمن یا بی‌طرف اجرا شود'; end if;
    update public.kaykha_territories
    set economy=0,is_raided=true,revision=revision+1
    where game_id=p_game_id and territory_id=trim(p_target_territory_id);
    insert into app_private.kaykha_effect_states(
      game_id,round_no,effect_key,source_member_id,target_member_id,target_territory_id,expires_round,payload
    ) values(
      p_game_id,v_game.round_no,'family.vraz_scorched',v_member.id,v_target_owner,trim(p_target_territory_id),
      v_game.round_no,jsonb_build_object('guaranteed_attack',true,'recovery_allowed_after_round',true)
    );
    v_effect:='خشم گراز اقتصاد شهر را در این راند سوزاند؛ حملهٔ خودت به همین شهر در این سپیده‌دم قطعی است، اما از راند بعد شهر می‌تواند دوباره بازسازی شود.';
  else
    begin
      v_recipient:=coalesce(nullif(p_payload->>'recipient_member_id','')::uuid,v_target_owner);
    exception when invalid_text_representation then
      raise exception 'فرمانده انتخاب‌شده معتبر نیست';
    end;
    if v_recipient is null or v_recipient=v_member.id then raise exception 'برای وام درباری یک فرماندهٔ دیگر را انتخاب کن'; end if;
    if not exists(select 1 from public.kaykha_members where game_id=p_game_id and id=v_recipient and not is_ai) then
      raise exception 'وام‌گیرنده عضو انسانی این تالار نیست';
    end if;
    update public.kaykha_members set coins=coins-12 where id=v_member.id and coins>=12;
    if not found then raise exception 'خزانهٔ نهابد برای پرداخت وام ۱۲ سکه‌ای کافی نیست'; end if;
    update public.kaykha_members set coins=least(999,coins+12) where id=v_recipient;
    insert into public.kaykha_contracts(
      game_id,creator_member_id,counterparty_member_id,contract_type,terms,status,due_round
    ) values(
      p_game_id,v_member.id,v_recipient,'debt',
      jsonb_build_object('amount',12,'interest',3,'duration_rounds',1,'system_loan',true,'funded_by_creator',true),
      'active',v_game.round_no+1
    );
    v_effect:='خزانهٔ نهابد ۱۲ سکهٔ واقعی از دارایی خود پرداخت کرد؛ بدهکار در سررسید ۱۵ سکه بازمی‌گرداند و نکول می‌تواند به مصادره برسد.';
  end if;

  update public.kaykha_members
  set family_action_round=v_game.round_no,family_action_count=family_action_count+1
  where id=v_member.id;
  perform app_private.record_kaykha_effect(
    p_game_id,v_game.round_no,v_rule,v_member.id,v_recipient,trim(p_target_territory_id),
    jsonb_build_object('manual',true,'funded',v_member.house_id='نهابد')
  );
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,v_game.round_no,'family',v_effect);
  return jsonb_build_object('effect',v_effect,'rule_key',v_rule,'once',false);
end;
$function$;

grant execute on function public.use_kaykha_family_doctrine(uuid,text,jsonb) to authenticated;

create or replace function app_private.kaykha_unsecured_collateral_default()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_take integer:=0;
  v_route text;
  v_before_economy integer;
  v_price integer;
begin
  if old.status<>'active' or new.status<>'defaulted' or new.collateral_type not in ('income','route') then
    return new;
  end if;
  v_price:=greatest(1,ceil((new.principal+new.interest_coins)*0.65)::integer);

  if new.collateral_type='income' then
    select least(6,coins) into v_take from public.kaykha_members where id=new.borrower_member_id for update;
    v_take:=coalesce(v_take,0);
    if v_take>0 then
      update public.kaykha_members set coins=coins-v_take where id=new.borrower_member_id;
      update public.kaykha_members set coins=least(999,coins+v_take) where id=new.lender_member_id;
    end if;
    update public.kaykha_loans
    set current_holder_member_id=new.lender_member_id,
        market_price=coalesce(market_price,v_price),
        income_share_bps=greatest(income_share_bps,1000),
        leverage_points=greatest(leverage_points,2)
    where id=new.id;
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(new.game_id,new.due_round,'economy','وام نکول شد؛ تا ۶ سکه فوراً توقیف شد و سفته با سهم پایهٔ ۱۰٪ درآمد وارد بازار بدهی شد.');
    insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,delta)
    values(new.game_id,new.due_round,'member',new.borrower_member_id::text,'loan_income_default',jsonb_build_object('coins',-v_take,'income_share_bps',1000,'lender_member_id',new.lender_member_id,'loan_id',new.id));
  else
    select territory_id,economy into v_route,v_before_economy
    from public.kaykha_territories
    where game_id=new.game_id and owner_member_id=new.borrower_member_id
    order by economy desc,strength desc,territory_id
    limit 1 for update;
    if v_route is not null then
      update public.kaykha_territories
      set economy=greatest(0,economy-2),poverty=least(100,poverty+4),revision=revision+1
      where game_id=new.game_id and territory_id=v_route;
      update public.kaykha_members set coins=least(999,coins+3) where id=new.lender_member_id;
      update public.kaykha_loans
      set current_holder_member_id=new.lender_member_id,
          market_price=coalesce(market_price,v_price),
          leverage_points=greatest(leverage_points,3),
          collateral_ref=coalesce(collateral_ref,'{}'::jsonb)||jsonb_build_object('resolved_route',v_route)
      where id=new.id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(new.game_id,new.due_round,'economy','وام نکول شد؛ حق عوارض مسیر فعال شد، اقتصاد مسیر آسیب دید و سفته همچنان قابل معامله و اعمال اهرم است.');
      insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,delta)
      values(new.game_id,new.due_round,'territory',v_route,'loan_route_default',jsonb_build_object('economy',greatest(0,v_before_economy-2)-v_before_economy,'poverty',4,'lender_coins',3,'loan_id',new.id));
    else
      update public.kaykha_loans
      set current_holder_member_id=new.lender_member_id,market_price=coalesce(market_price,v_price),leverage_points=greatest(leverage_points,2)
      where id=new.id;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.exercise_kaykha_leverage(p_loan_id uuid,p_leverage_type text)
returns void
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  l public.kaykha_loans%rowtype;
  h uuid;
  v_round integer;
  v_cost integer;
  v_new_share integer;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_leverage_type='bind_vote' then
    raise exception 'تعهد رأی تا زمانی که رأی‌گیری سرورمحور دیوان فعال نشده قابل خرج نیست؛ هیچ امتیاز اهرمی کم نشد';
  end if;
  select * into l from public.kaykha_loans where id=p_loan_id for update;
  if not found or l.status<>'defaulted' then raise exception 'اهرم این سفته فعال نیست'; end if;
  select id into h from public.kaykha_members where id=l.current_holder_member_id and user_id=(select auth.uid()) for update;
  if h is null then raise exception 'فقط دارندهٔ فعلی سفته حق استفاده از اهرم را دارد'; end if;
  v_cost:=case p_leverage_type when 'tax_income' then 1 when 'damage_credibility' then 1 else 99 end;
  if v_cost=99 then raise exception 'نوع اهرم نامعتبر است'; end if;
  if l.leverage_points<v_cost then raise exception 'امتیاز اهرم کافی نیست'; end if;
  select round_no into v_round from public.kaykha_games where id=l.game_id;

  if p_leverage_type='tax_income' then
    v_new_share:=least(2500,coalesce(l.income_share_bps,0)+500);
    update public.kaykha_loans set income_share_bps=v_new_share where id=l.id;
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(l.game_id,v_round,'economy','دارندهٔ سفته سهم درآمد را با خرج اهرم افزایش داد؛ سقف این فشار ۲۵٪ است.');
  else
    update public.kaykha_members set reputation_score=greatest(0,reputation_score-6) where id=l.borrower_member_id;
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(l.game_id,v_round,'warning','دارندهٔ سفته یک امتیاز اهرم خرج کرد و اعتبار مالی بدهکار ۶ واحد آسیب دید.');
  end if;
  update public.kaykha_loans set leverage_points=leverage_points-v_cost where id=l.id;
end;
$function$;

grant execute on function public.exercise_kaykha_leverage(uuid,text) to authenticated;
