alter function public.create_kaykha_contract(uuid,text,uuid,jsonb) rename to create_kaykha_contract_legacy_p0;
revoke all on function public.create_kaykha_contract_legacy_p0(uuid,text,uuid,jsonb) from public,anon,authenticated;

create or replace function app_private.activate_kaykha_contract(
  p_contract_id uuid,
  p_acceptor_member_id uuid,
  p_round integer
) returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  c public.kaykha_contracts%rowtype;
  v_amount integer;
  v_duration integer;
  v_peace_architect boolean:=false;
begin
  select * into c from public.kaykha_contracts where id=p_contract_id for update;
  if not found or c.status<>'open' then raise exception 'این پیشنهاد دیگر باز نیست'; end if;
  if c.counterparty_member_id is distinct from p_acceptor_member_id then raise exception 'فقط طرف مقابل می‌تواند این پیشنهاد را بپذیرد'; end if;

  if c.contract_type='debt' then
    v_amount:=coalesce((c.terms->>'amount')::integer,0);
    if v_amount not between 1 and 40 then raise exception 'مبلغ سفته نامعتبر است'; end if;
    update public.kaykha_members set coins=coins-v_amount where id=c.creator_member_id and coins>=v_amount;
    if not found then raise exception 'وام‌دهنده هنگام پذیرش، سکهٔ کافی برای تأمین سفته ندارد'; end if;
    update public.kaykha_members set coins=least(999,coins+v_amount) where id=c.counterparty_member_id;
  end if;

  v_duration:=case when c.terms ? 'duration_rounds' then greatest(1,least(12,(c.terms->>'duration_rounds')::integer)) else null end;
  update public.kaykha_contracts
  set status='active',
      due_round=case when v_duration is not null then p_round+v_duration else due_round end,
      resolved_at=null
  where id=c.id;

  select exists(
    select 1 from app_private.kaykha_effect_states e
    where e.game_id=c.game_id and e.source_member_id=c.creator_member_id
      and e.effect_key='class.peace_architect' and e.consumed_at is null and e.expires_round>=p_round
  ) into v_peace_architect;
  if v_peace_architect and c.contract_type in ('treaty','vassalage') then
    update public.kaykha_members set influence_tokens=least(99,influence_tokens+1) where id=c.creator_member_id;
    update app_private.kaykha_effect_states set consumed_at=now()
    where game_id=c.game_id and source_member_id=c.creator_member_id and effect_key='class.peace_architect'
      and consumed_at is null and expires_round>=p_round;
  end if;

  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(c.game_id,p_round,'diplomacy',case c.contract_type
    when 'joint_venture' then 'پیشنهاد شراکت تیمچه با مهر هر دو طرف فعال شد.'
    when 'debt' then 'سفته پس از پذیرش وام‌گیرنده تأمین و فعال شد.'
    when 'blood_debt' then 'پیمان خون با مهر هر دو طرف فعال شد.'
    when 'vassalage' then 'دست‌نشاندگی پس از پذیرش طرف مقابل در دفتر دیوان فعال شد.'
    else 'پیمان رسمی با مهر هر دو طرف فعال شد.' end);
  return c.id;
end;
$function$;

revoke all on function app_private.activate_kaykha_contract(uuid,uuid,integer) from public,anon,authenticated;

create function public.create_kaykha_contract(
  p_game_id uuid,
  p_contract_type text,
  p_counterparty_member_id uuid,
  p_terms jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_member_id uuid;
  v_game public.kaykha_games%rowtype;
  v_terms jsonb:=coalesce(p_terms,'{}'::jsonb);
  v_amount integer;
  v_reverse public.kaykha_contracts%rowtype;
  v_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'negotiation' then raise exception 'ثبت قرارداد فقط در بازار مکاره ممکن است'; end if;
  select id into v_member_id from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if v_member_id is null then raise exception 'شما عضو این تالار نیستید'; end if;
  if p_contract_type not in ('joint_venture','debt','blood_debt','treaty','vassalage') then raise exception 'نوع قرارداد نامعتبر است'; end if;
  if p_counterparty_member_id is null or p_counterparty_member_id=v_member_id
    or not exists(select 1 from public.kaykha_members where id=p_counterparty_member_id and game_id=p_game_id and not is_ai) then
    raise exception 'طرف قرارداد باید یکی از فرماندهان انسانی همین تالار باشد';
  end if;

  if p_contract_type='joint_venture' then
    if coalesce((v_terms->>'creator_share')::integer,0)+coalesce((v_terms->>'counterparty_share')::integer,0)<>100 then
      raise exception 'سهم شراکت باید دقیقاً صد درصد باشد';
    end if;
  elsif p_contract_type='debt' then
    v_amount:=coalesce((v_terms->>'amount')::integer,0);
    if v_amount not between 1 and 40 then raise exception 'مبلغ سفته باید بین ۱ تا ۴۰ سکه باشد'; end if;
    if coalesce((v_terms->>'interest')::integer,0) not between 0 and 40 then raise exception 'بهرهٔ سفته نامعتبر است'; end if;
    if coalesce((v_terms->>'duration_rounds')::integer,1) not between 1 and 8 then raise exception 'مدت سفته باید بین ۱ تا ۸ راند باشد'; end if;
  elsif p_contract_type='blood_debt' and not (v_terms ? 'duration_rounds') and not (v_terms ? 'due_round') then
    v_terms:=v_terms||jsonb_build_object('duration_rounds',2);
  end if;
  v_terms:=v_terms||jsonb_build_object('proposed_round',v_game.round_no,'requires_counterparty_consent',true);

  if exists(
    select 1 from public.kaykha_contracts c
    where c.game_id=p_game_id and c.status in ('open','active') and c.contract_type=p_contract_type
      and ((c.creator_member_id=v_member_id and c.counterparty_member_id=p_counterparty_member_id)
        or (c.creator_member_id=p_counterparty_member_id and c.counterparty_member_id=v_member_id))
      and p_contract_type in ('treaty','vassalage','blood_debt','joint_venture')
  ) then
    select * into v_reverse from public.kaykha_contracts c
    where c.game_id=p_game_id and c.status='open' and c.contract_type=p_contract_type
      and c.creator_member_id=p_counterparty_member_id and c.counterparty_member_id=v_member_id
    order by c.created_at desc limit 1;
    if found then
      return app_private.activate_kaykha_contract(v_reverse.id,v_member_id,v_game.round_no);
    end if;
    raise exception 'میان این دو فرمانده، همین نوع رابطه از قبل باز یا فعال است';
  end if;

  if p_contract_type='debt' then
    select * into v_reverse from public.kaykha_contracts c
    where c.game_id=p_game_id and c.status='open' and c.contract_type='debt'
      and c.creator_member_id=p_counterparty_member_id and c.counterparty_member_id=v_member_id
      and coalesce((c.terms->>'amount')::integer,0)=coalesce((v_terms->>'amount')::integer,0)
      and coalesce((c.terms->>'interest')::integer,0)=coalesce((v_terms->>'interest')::integer,0)
    order by c.created_at desc limit 1;
    if found then
      return app_private.activate_kaykha_contract(v_reverse.id,v_member_id,v_game.round_no);
    end if;
  end if;

  insert into public.kaykha_contracts(
    game_id,creator_member_id,counterparty_member_id,contract_type,terms,status,due_round
  ) values(
    p_game_id,v_member_id,p_counterparty_member_id,p_contract_type,v_terms,'open',null
  ) returning id into v_id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(p_game_id,v_game.round_no,'diplomacy','یک پیشنهاد قرارداد ثبت شد؛ تا مهر طرف مقابل هیچ اثر قدرتی، مالی یا پیروزی ایجاد نمی‌کند.');
  return v_id;
end;
$function$;

grant execute on function public.create_kaykha_contract(uuid,text,uuid,jsonb) to authenticated;

create or replace function public.accept_kaykha_contract(p_contract_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  c public.kaykha_contracts%rowtype;
  v_me uuid;
  v_round integer;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into c from public.kaykha_contracts where id=p_contract_id for update;
  if not found or c.status<>'open' then raise exception 'این پیشنهاد دیگر باز نیست'; end if;
  select m.id,g.round_no into v_me,v_round
  from public.kaykha_members m join public.kaykha_games g on g.id=m.game_id
  where m.game_id=c.game_id and m.user_id=(select auth.uid()) and not m.is_ai
    and g.status='active' and g.phase='negotiation';
  if v_me is null or v_me is distinct from c.counterparty_member_id then raise exception 'فقط طرف مقابل در بازار مکاره می‌تواند این پیشنهاد را بپذیرد'; end if;
  return app_private.activate_kaykha_contract(c.id,v_me,v_round);
end;
$function$;

grant execute on function public.accept_kaykha_contract(uuid) to authenticated;

create or replace function public.reject_kaykha_contract(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  c public.kaykha_contracts%rowtype;
  v_me uuid;
  v_round integer;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into c from public.kaykha_contracts where id=p_contract_id for update;
  if not found or c.status<>'open' then raise exception 'این پیشنهاد دیگر باز نیست'; end if;
  select m.id,g.round_no into v_me,v_round
  from public.kaykha_members m join public.kaykha_games g on g.id=m.game_id
  where m.game_id=c.game_id and m.user_id=(select auth.uid()) and not m.is_ai
    and g.status='active' and g.phase='negotiation';
  if v_me is null or v_me is distinct from c.counterparty_member_id then raise exception 'فقط طرف مقابل می‌تواند پیشنهاد را رد کند'; end if;
  update public.kaykha_contracts set status='cancelled',resolved_at=now() where id=c.id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values(c.game_id,v_round,'diplomacy','یک پیشنهاد قرارداد بدون اثر بازی رد شد.');
end;
$function$;

grant execute on function public.reject_kaykha_contract(uuid) to authenticated;
