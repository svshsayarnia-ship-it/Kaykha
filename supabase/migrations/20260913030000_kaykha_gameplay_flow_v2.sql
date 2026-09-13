-- Kaykha Gameplay Flow V2
-- Makes the strategic depth readable without leaking hidden information.
-- Adds server-authoritative command previews, anti-dominant-strategy pressure,
-- mode-aware objective state, and repetition-sensitive paranoia.

create or replace function app_private.kaykha_action_family(p_order_type text)
returns text
language sql
immutable
as $$
  select case
    when p_order_type in ('attack','defend','support','raid') then 'military'
    when p_order_type in ('spy','sabotage','spell') then 'espionage'
    when p_order_type in ('trade','caravan') then 'economy'
    when p_order_type in ('revolt') then 'politics'
    else 'utility'
  end
$$;

revoke all on function app_private.kaykha_action_family(text) from public, anon, authenticated;

create or replace function app_private.kaykha_strategy_repetition(
  p_game_id uuid,
  p_member_id uuid,
  p_round integer,
  p_family text
) returns integer
language sql
stable
security definer
set search_path=public,app_private,pg_temp
as $$
  select count(*)::integer
  from app_private.kaykha_secret_orders so
  where so.game_id=p_game_id
    and so.member_id=p_member_id
    and so.round_no between greatest(1,p_round-3) and p_round-1
    and app_private.kaykha_action_family(so.order_type)=p_family
$$;

revoke all on function app_private.kaykha_strategy_repetition(uuid,uuid,integer,text) from public, anon, authenticated;

create or replace function app_private.kaykha_repetition_surcharge(p_repetition integer)
returns numeric
language sql
immutable
as $$
  select case
    when p_repetition <= 0 then 0.00
    when p_repetition = 1 then 0.15
    when p_repetition = 2 then 0.35
    else 0.60
  end
$$;

revoke all on function app_private.kaykha_repetition_surcharge(integer) from public, anon, authenticated;

create or replace function app_private.kaykha_repetition_exposure(p_repetition integer)
returns integer
language sql
immutable
as $$
  select case
    when p_repetition <= 0 then 0
    when p_repetition = 1 then 2
    when p_repetition = 2 then 5
    else 9
  end
$$;

revoke all on function app_private.kaykha_repetition_exposure(integer) from public, anon, authenticated;

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
as $$
declare
  g public.kaykha_games%rowtype;
  m public.kaykha_members%rowtype;
  v_income integer:=0;
  v_power integer:=0;
  v_base integer:=0;
  v_base_gold integer:=0;
  v_gold integer:=0;
  v_cred integer:=0;
  v_bribe integer:=0;
  v_masked boolean:=false;
  v_family text;
  v_repetition integer:=0;
  v_surcharge numeric:=0;
  v_exposure integer:=0;
  v_risk text;
  v_effect text;
  v_counterplay text;
  v_target_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then
    raise exception 'نوع فرمان نامعتبر است';
  end if;

  select * into g from public.kaykha_games where id=p_game_id;
  if not found or g.status<>'active' then raise exception 'تالار فعال نیست'; end if;

  select * into m
  from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  if not exists(
    select 1 from public.kaykha_territories
    where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=m.id
  ) then raise exception 'مبدأ باید یکی از قلمروهای تو باشد'; end if;

  select owner_member_id into v_target_owner
  from public.kaykha_territories
  where game_id=p_game_id and territory_id=p_target_territory_id;
  if not found then raise exception 'هدف در این نقشه وجود ندارد'; end if;

  select coalesce(sum(economy),0)::integer,
         coalesce(sum(strength+influence),0)::integer
    into v_income,v_power
  from public.kaykha_territories
  where game_id=p_game_id and owner_member_id=m.id;

  v_base:=case p_order_type
    when 'attack' then 8 when 'defend' then 4 when 'support' then 5
    when 'spy' then 6 when 'revolt' then 10 when 'caravan' then 3 when 'trade' then 3
    when 'raid' then 7 when 'sabotage' then 8 when 'spell' then 7 else 5 end;

  v_base_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);

  v_family:=app_private.kaykha_action_family(p_order_type);
  v_repetition:=app_private.kaykha_strategy_repetition(p_game_id,m.id,g.round_no,v_family);
  v_surcharge:=app_private.kaykha_repetition_surcharge(v_repetition);
  v_exposure:=app_private.kaykha_repetition_exposure(v_repetition);
  v_gold:=least(999,ceil(v_base_gold*(1+v_surcharge))::integer);

  if p_order_type in ('spy','sabotage','raid','spell') then
    v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end;
  end if;

  v_masked:=case
    when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'masked')='boolean'
      then (p_payload->>'masked')::boolean
    else false
  end;

  if v_masked and p_order_type in ('spy','sabotage','raid') then
    v_bribe:=least(3,greatest(1,coalesce((p_payload->>'bribe_tokens')::integer,1)));
  end if;

  v_risk:=case
    when p_order_type in ('spy','sabotage','raid','spell','revolt') and v_repetition>=2 then 'very_high'
    when p_order_type in ('spy','sabotage','raid','spell','revolt','attack') then 'high'
    when p_order_type in ('support','caravan') then 'medium'
    else 'low'
  end;

  v_effect:=case p_order_type
    when 'attack' then 'برای گرفتن شهر هدف قدرت نظامی خود را متعهد می‌کنی؛ شکست می‌تواند تمپو و موقعیتت را از بین ببرد.'
    when 'defend' then 'پادگان مبدأ تقویت می‌شود؛ در عوض فرصت اجرای یک فرمان تهاجمی این راند را از دست می‌دهی.'
    when 'support' then 'قدرت شهر هدف را بالا می‌بری و عملاً روی بقای آن سرمایه‌گذاری می‌کنی.'
    when 'spy' then 'در صورت عبور از ضدجاسوسی، پرونده‌ای خصوصی از شهر هدف می‌گیری؛ هدف از وجود این عملیات اعلان خودکار نمی‌گیرد.'
    when 'revolt' then 'بی‌ثباتی سیاسی در هدف ایجاد می‌کنی؛ هزینه بالا و ضدبازی سیاسی دارد.'
    when 'caravan' then 'اقتصاد هدف را تقویت می‌کنی اما مسیرهای بسته یا سوخته می‌توانند اثر را خنثی کنند.'
    when 'trade' then 'اقتصاد مبدأ را رشد می‌دهی؛ انتخابی کم‌ریسک‌تر اما با تمپوی تهاجمی کمتر.'
    when 'raid' then 'به دارایی یا درآمد هدف ضربه می‌زنی؛ ریسک سوءظن و ضدعملیات دارد.'
    when 'sabotage' then 'زیرساخت هدف را مختل می‌کنی؛ اثر قوی‌تر است اما رد بیشتری به جا می‌گذارد.'
    when 'spell' then 'اثر پنهان ویژه اجرا می‌کنی؛ قدرت آن به وضعیت جاری و ضدعملیات وابسته است.'
    else 'فرمان انتخاب‌شده در پایان راند حل می‌شود.'
  end;

  v_counterplay:=case p_order_type
    when 'attack' then 'دفاع، پشتیبانی، بست و توان خاندان‌ها می‌توانند نتیجه را تغییر دهند.'
    when 'defend' then 'وحشت، قفل دفاع و فشار چندجانبه می‌توانند ارزش دفاع را کم کنند.'
    when 'support' then 'تغییر مالکیت یا از بین رفتن هدف می‌تواند سرمایه‌گذاری تو را هدر دهد.'
    when 'spy' then 'ضدجاسوسی، خاندان‌های مقاوم و پوشش مسیر می‌توانند شبکه را بسوزانند.'
    when 'revolt' then 'مشروعیت، نفوذ و کنترل سیاسی هدف مهم‌ترین پاسخ هستند.'
    when 'caravan' then 'محاصره، زمین سوخته و اختلال مسیر پاسخ طبیعی این فرمان‌اند.'
    when 'trade' then 'زمین سوخته و فشار اقتصادی می‌توانند بازده تجارت را متوقف کنند.'
    when 'raid' then 'بست، خودکفایی و ضدجاسوسی می‌توانند غارت را بی‌اثر کنند.'
    when 'sabotage' then 'بست، خودکفایی و ضدجاسوسی می‌توانند خرابکاری را خنثی کنند.'
    when 'spell' then 'اثرهای دفاعی و قابلیت‌های خاندان می‌توانند آن را تضعیف یا خنثی کنند.'
    else 'وضعیت عمومی نقشه و قابلیت خاندان‌ها پاسخ طبیعی این فرمان‌اند.'
  end;

  return jsonb_build_object(
    'order_type',p_order_type,
    'family',v_family,
    'cost',jsonb_build_object(
      'gold',v_gold,
      'base_gold',v_base_gold,
      'credibility',v_cred,
      'bribe_tokens',v_bribe,
      'tempo_orders',1
    ),
    'repetition',jsonb_build_object(
      'recent_same_family',v_repetition,
      'surcharge_pct',round(v_surcharge*100),
      'exposure_bonus',v_exposure,
      'message',case
        when v_repetition=0 then 'این مسیر در سه راند اخیر تکراری نشده است.'
        when v_repetition=1 then 'تکرار این مسیر هزینه و قابل‌پیش‌بینی‌بودن تو را کمی بالا برده است.'
        when v_repetition=2 then 'حریفان به الگوی تو عادت می‌کنند؛ هزینه و رد عملیات بیشتر شده است.'
        else 'این استراتژی بیش از حد تکرار شده؛ تغییر مسیر به‌صرفه‌تر است.'
      end
    ),
    'risk',v_risk,
    'effect',v_effect,
    'counterplay',v_counterplay,
    'target_is_self',v_target_owner=m.id,
    'hidden_information_notice','این پیش‌نمایش هیچ وضعیت مخفیِ حریف را افشا نمی‌کند.',
    'can_afford',m.coins>=v_gold and m.reputation_score>=v_cred and m.bribe_tokens>=v_bribe
  );
end $$;

revoke all on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) to authenticated;

create or replace function public.get_kaykha_objective_state(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  g public.kaykha_games%rowtype;
  m public.kaykha_members%rowtype;
  v_my_cities integer:=0;
  v_my_mutiny integer:=0;
  v_max_enemy_cities integer:=0;
  v_enemy_name text;
  v_primary jsonb;
  v_secondary jsonb:='[]'::jsonb;
  v_suggestions jsonb:='[]'::jsonb;
  v_threat jsonb;
  v_partner_cities integer:=0;
  v_horde_cities integer:=0;
  v_human_cities integer:=0;
  v_my_hegemony integer:=0;
  v_rank integer:=null;
  v_winter integer:=8;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into g from public.kaykha_games where id=p_game_id;
  if not found then raise exception 'تالار پیدا نشد'; end if;
  select * into m from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  select count(*),count(*) filter(where is_in_mutiny)
    into v_my_cities,v_my_mutiny
  from public.kaykha_territories
  where game_id=p_game_id and owner_member_id=m.id;

  select x.city_count,x.display_name into v_max_enemy_cities,v_enemy_name
  from (
    select count(*)::integer city_count,mm.display_name,mm.id
    from public.kaykha_members mm
    left join public.kaykha_territories t on t.game_id=mm.game_id and t.owner_member_id=mm.id
    where mm.game_id=p_game_id and mm.id<>m.id and not mm.is_ai
    group by mm.id,mm.display_name
    order by count(*) desc,mm.id
    limit 1
  ) x;

  v_threat:=jsonb_build_object(
    'kind',case when coalesce(v_max_enemy_cities,0)>=3 then 'rival_expansion' when v_my_mutiny>0 then 'internal_instability' else 'none_critical' end,
    'message',case
      when coalesce(v_max_enemy_cities,0)>=3 then coalesce(v_enemy_name,'یک رقیب')||' به آستانهٔ برتری سرزمینی نزدیک شده است.'
      when v_my_mutiny>0 then 'در قلمرو تو بی‌ثباتی دیده می‌شود؛ نادیده‌گرفتن آن می‌تواند مسیر برد را خراب کند.'
      else 'تهدید فوریِ عمومی دیده نمی‌شود؛ اطلاعات پنهان همچنان نامعلوم است.'
    end
  );

  if g.mode='hegemony' then
    v_primary:=jsonb_build_object('label','چهار شهر زیر یک درفش','current',v_my_cities,'target',4,'progress',least(1,v_my_cities/4.0));
    v_secondary:=jsonb_build_array('اقتصاد و پیمان‌ها را برای تأمین حمله نگه دار.','از جاسوسی برای انتخاب هدف استفاده کن، نه برای گرفتن هشدار رایگان.');
  elsif g.mode='silk_road' then
    v_primary:=jsonb_build_object('label','تسلط بر شریان ابریشم','current',m.coins,'target',120,'progress',least(1,m.coins/120.0));
    v_secondary:=jsonb_build_array('تجارت و کاروان درآمد می‌سازند.','بدهی و سفته می‌توانند بدون فتح شهر اهرم بسازند.');
  elsif g.mode='dynasty' then
    select coalesce(max(cnt),0) into v_partner_cities
    from (
      select count(*)::integer cnt
      from public.kaykha_contracts c
      join public.kaykha_territories t on t.game_id=c.game_id
       and t.owner_member_id in(c.creator_member_id,c.counterparty_member_id)
      where c.game_id=p_game_id and c.contract_type='treaty' and c.status='active'
        and m.id in(c.creator_member_id,c.counterparty_member_id)
      group by c.id
    ) q;
    v_primary:=jsonb_build_object('label','چهار شهر با پیمان فعال','current',greatest(v_my_cities,v_partner_cities),'target',4,'progress',least(1,greatest(v_my_cities,v_partner_cities)/4.0));
    v_secondary:=jsonb_build_array('پیمان خوب باید مسیر برد هر دو طرف را روشن کند.','شکستن پیمان باید هزینهٔ سیاسی واقعی داشته باشد.');
  elsif g.mode='survival' then
    select count(*) into v_horde_cities
    from public.kaykha_territories t join public.kaykha_members mm on mm.id=t.owner_member_id
    where t.game_id=p_game_id and mm.is_ai and mm.house_id='انیران';
    select count(*) into v_human_cities
    from public.kaykha_territories t join public.kaykha_members mm on mm.id=t.owner_member_id
    where t.game_id=p_game_id and not mm.is_ai;
    v_primary:=jsonb_build_object('label','زنده‌ماندن تا سپیده‌دم هشتم','current',g.round_no,'target',8,'progress',least(1,g.round_no/8.0));
    v_secondary:=jsonb_build_array('شهرهای انسانی: '||v_human_cities,'شهرهای انیران: '||v_horde_cities);
  elsif g.mode='winter_hegemony' then
    v_winter:=coalesce(g.winter_round,8);
    select s.total_score into v_my_hegemony from app_private.kaykha_compute_hegemony_scores(p_game_id) s where s.member_id=m.id;
    select rnk into v_rank from (
      select s.member_id,row_number() over(order by s.total_score desc,s.military_score desc,s.legitimacy_score desc,s.member_id)::integer rnk
      from app_private.kaykha_compute_hegemony_scores(p_game_id) s
    ) ranked where ranked.member_id=m.id;
    v_primary:=jsonb_build_object('label','بیشترین هژمونی در آغاز زمستان','current',g.round_no,'target',v_winter,'progress',least(1,g.round_no/greatest(1,v_winter)::numeric),'score',v_my_hegemony,'rank',v_rank);
    v_secondary:=jsonb_build_array('قدرت نظامی، خزانه، ثروت بیرونی، پیمان خون و مشروعیت همگی امتیاز می‌دهند.','یک مسیر واحد برای برد کافی نیست.');
  elsif g.mode='invisible_guest' then
    v_primary:=jsonb_build_object('label','کنترل سرزمین و مهار تهدید پنهان','current',v_my_cities,'target',4,'progress',least(1,v_my_cities/4.0));
    v_secondary:=jsonb_build_array('هیچ هشدار خودکاری از عملیات پنهان دریافت نمی‌کنی.','برای بررسی حدس باید مهر جست‌وجو بسوزانی.');
  else
    v_primary:=jsonb_build_object('label','برتری راهبردی','current',v_my_cities,'target',4,'progress',least(1,v_my_cities/4.0));
  end if;

  if m.coins<12 then
    v_suggestions:=v_suggestions||jsonb_build_array('خزانه پایین است؛ تجارت یا کاروان می‌تواند آزادی عمل راند بعد را حفظ کند.');
  end if;
  if m.suspicion_level>=60 then
    v_suggestions:=v_suggestions||jsonb_build_array('سوءظن بالا رفته؛ تکرار عملیات پنهان تو را به حسابرسی دیوان نزدیک می‌کند.');
  end if;
  if v_my_cities<coalesce(v_max_enemy_cities,0) then
    v_suggestions:=v_suggestions||jsonb_build_array('از رقیب پیشتاز عقب هستی؛ بین فشار نظامی، پیمان و ضربهٔ اقتصادی یکی را آگاهانه انتخاب کن.');
  end if;
  if jsonb_array_length(v_suggestions)=0 then
    v_suggestions:=jsonb_build_array('قبل از مهر فرمان، هزینه، ضدبازی و تکرار خانوادهٔ استراتژی را مقایسه کن.','اگر به عملیات پنهان شک داری، فقط با خرج مهر جست‌وجو می‌توانی بررسی کنی.');
  end if;

  return jsonb_build_object(
    'mode',g.mode,
    'round',g.round_no,
    'phase',g.phase,
    'primary',v_primary,
    'secondary',v_secondary,
    'threat',v_threat,
    'suggestions',v_suggestions,
    'resources',jsonb_build_object(
      'coins',m.coins,
      'influence',m.influence_tokens,
      'search_tokens',m.search_tokens,
      'bribe_tokens',m.bribe_tokens,
      'reputation',m.reputation_score,
      'suspicion',m.suspicion_level
    ),
    'information_rule','هیچ عملیات پنهانی صرفاً به دلیل وقوعش برای تو اعلان نمی‌شود.'
  );
end $$;

revoke all on function public.get_kaykha_objective_state(uuid) from public,anon;
grant execute on function public.get_kaykha_objective_state(uuid) to authenticated;

-- Replace the authoritative order boundary with Flow V2 pressure.
-- Existing Baha refunds remain exact because the prior server-recorded _baha is refunded.
create or replace function public.submit_kaykha_order(
  p_game_id uuid, p_order_type text, p_origin_territory_id text,
  p_target_territory_id text, p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer
set search_path=public,app_private,pg_temp as $$
declare
  v_game public.kaykha_games%rowtype;
  v_member public.kaykha_members%rowtype;
  v_old app_private.kaykha_secret_orders%rowtype;
  v_order_id uuid;
  v_income integer;
  v_power integer;
  v_base integer;
  v_base_gold integer;
  v_gold integer;
  v_cred integer:=0;
  v_bribe integer:=0;
  v_masked boolean:=false;
  v_old_gold integer:=0;
  v_old_cred integer:=0;
  v_old_bribe integer:=0;
  v_payload jsonb;
  v_family text;
  v_repetition integer:=0;
  v_surcharge numeric:=0;
  v_exposure integer:=0;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then raise exception 'نوع فرمان نامعتبر است'; end if;

  select * into v_game from public.kaykha_games where id=p_game_id for update;
  if not found or v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'اکنون امکان مهر کردن فرمان نیست'; end if;

  select * into v_member from public.kaykha_members
  where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found then raise exception 'تو عضو این تالار نیستی'; end if;

  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and owner_member_id=v_member.id) then raise exception 'مبدأ باید یکی از قلمروهای تو باشد'; end if;
  if not exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_target_territory_id) then raise exception 'هدف در این نقشه وجود ندارد'; end if;
  if p_order_type='defend' and exists(select 1 from public.kaykha_territories where game_id=p_game_id and territory_id=p_origin_territory_id and defense_locked_round=v_game.round_no) then raise exception 'وحشت در شهر، فرمان دفاع را برای این راند قفل کرده است'; end if;

  select * into v_old from app_private.kaykha_secret_orders
  where game_id=p_game_id and member_id=v_member.id and round_no=v_game.round_no for update;
  if found then
    v_old_gold:=coalesce((v_old.payload->'_baha'->>'gold')::integer,0);
    v_old_cred:=coalesce((v_old.payload->'_baha'->>'credibility')::integer,0);
    v_old_bribe:=coalesce((v_old.payload->'_baha'->>'bribe_tokens')::integer,0);
  end if;

  select coalesce(sum(economy),0)::integer,coalesce(sum(strength+influence),0)::integer
  into v_income,v_power
  from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_member.id;

  v_base:=case p_order_type when 'attack' then 8 when 'defend' then 4 when 'support' then 5
    when 'spy' then 6 when 'revolt' then 10 when 'caravan' then 3 when 'trade' then 3
    when 'raid' then 7 when 'sabotage' then 8 when 'spell' then 7 else 5 end;

  v_base_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);
  v_family:=app_private.kaykha_action_family(p_order_type);
  v_repetition:=app_private.kaykha_strategy_repetition(p_game_id,v_member.id,v_game.round_no,v_family);
  v_surcharge:=app_private.kaykha_repetition_surcharge(v_repetition);
  v_exposure:=app_private.kaykha_repetition_exposure(v_repetition);
  v_gold:=least(999,ceil(v_base_gold*(1+v_surcharge))::integer);

  if p_order_type in ('spy','sabotage','raid','spell') then
    v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end;
  end if;

  v_masked:=case when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'masked')='boolean'
    then (p_payload->>'masked')::boolean else false end;
  if v_masked and p_order_type in ('spy','sabotage','raid') then
    v_bribe:=least(3,greatest(1,coalesce((p_payload->>'bribe_tokens')::integer,1)));
  end if;

  if v_member.coins+v_old_gold<v_gold then raise exception 'خزانه برای بهای این فرمان کافی نیست'; end if;
  if v_member.reputation_score+v_old_cred<v_cred then raise exception 'اعتبار سیاسی برای این فرمان کافی نیست'; end if;
  if v_member.bribe_tokens+v_old_bribe<v_bribe then raise exception 'مهر رشوه برای پوشاندن چاپار کافی نیست'; end if;

  update public.kaykha_members set
    coins=coins+v_old_gold-v_gold,
    reputation_score=least(100,reputation_score+v_old_cred)-v_cred,
    bribe_tokens=bribe_tokens+v_old_bribe-v_bribe
  where id=v_member.id;

  v_payload:=(coalesce(p_payload,'{}'::jsonb)-'_baha'-'_flow_v2')
    || jsonb_build_object(
      '_baha',jsonb_build_object('gold',v_gold,'credibility',v_cred,'bribe_tokens',v_bribe,'revision',2),
      '_flow_v2',jsonb_build_object(
        'family',v_family,
        'recent_same_family',v_repetition,
        'surcharge_pct',round(v_surcharge*100),
        'exposure_bonus',v_exposure,
        'revision',2
      )
    );

  insert into app_private.kaykha_secret_orders(game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload)
  values(p_game_id,v_member.id,v_game.round_no,p_order_type,p_origin_territory_id,p_target_territory_id,v_payload)
  on conflict(game_id,member_id,round_no) do update set
    order_type=excluded.order_type,
    origin_territory_id=excluded.origin_territory_id,
    target_territory_id=excluded.target_territory_id,
    payload=excluded.payload,
    locked_at=now()
  returning order_id into v_order_id;

  return v_order_id;
end $$;

revoke all on function public.submit_kaykha_order(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.submit_kaykha_order(uuid,text,text,text,jsonb) to authenticated;

-- Repetition of covert families increases the dawn suspicion delta.
create or replace function app_private.update_kaykha_paranoia(p_game_id uuid,p_round integer)
returns integer language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare r record; v_delta integer; v_count integer:=0;
begin
  for r in
    select so.member_id,
      sum(
        case so.order_type
          when 'sabotage' then 16 when 'spy' then 9 when 'raid' then 8 when 'spell' then 11 else 0
        end
        + case when so.order_type in ('sabotage','spy','raid','spell')
          then coalesce((so.payload->'_flow_v2'->>'exposure_bonus')::integer,0)
          else 0 end
      )::integer delta
    from app_private.kaykha_secret_orders so
    where so.game_id=p_game_id and so.round_no=p_round
    group by so.member_id
    having sum(case so.order_type when 'sabotage' then 16 when 'spy' then 9 when 'raid' then 8 when 'spell' then 11 else 0 end)>0
  loop
    v_delta:=greatest(1,r.delta-coalesce((
      select sum(strength*2)
      from app_private.kaykha_counter_orders c
      where c.game_id=p_game_id and c.round_no=p_round and c.member_id=r.member_id and c.counter_type='blind_route'
    ),0));

    update public.kaykha_members
    set suspicion_level=least(100,greatest(0,suspicion_level+v_delta-2))
    where id=r.member_id;

    if (select suspicion_level from public.kaykha_members where id=r.member_id)>=85 then
      update public.kaykha_members
      set reputation_score=greatest(0,reputation_score-8),influence_tokens=greatest(0,influence_tokens-2)
      where id=r.member_id;
      insert into app_private.kaykha_intel(game_id,member_id,round_no,target_territory_id,target_member_id,intel)
      values(p_game_id,r.member_id,p_round,'دیوان',r.member_id,
        jsonb_build_object('kind','audit','message','حسابرسی دیوان آغاز شد؛ اعتبار و نفوذ تو کاهش یافت.'));
    end if;
    v_count:=v_count+1;
  end loop;

  update public.kaykha_members
  set suspicion_level=greatest(0,suspicion_level-3)
  where game_id=p_game_id and id not in (
    select member_id from app_private.kaykha_secret_orders
    where game_id=p_game_id and round_no=p_round and order_type in ('sabotage','spy','raid','spell')
  );

  return v_count;
end $$;

revoke all on function app_private.update_kaykha_paranoia(uuid,integer) from public,anon,authenticated;
