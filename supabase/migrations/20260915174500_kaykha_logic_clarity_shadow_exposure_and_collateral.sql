-- Close logic gaps found in the rendered-UI audit without changing the shared turn resolver.

create or replace function public.get_kaykha_logic_guide()
returns jsonb
language sql
stable
security definer
set search_path=public,app_private,pg_temp
as $$
select jsonb_build_object(
  'combat', jsonb_build_object(
    'formula','قدرت حمله = قدرت شهر مبدأ + اثرهای فعال خاندان/چهره. دفاع = قدرت شهر هدف + وهم و اثرهای دفاعی فعال.',
    'resolution_order','دفاع، پشتیبانی و اثرهای آماده‌سازی پیش از حمله حل می‌شوند؛ سپس حمله مقایسه می‌شود.',
    'hard_blocks',jsonb_build_array('بست فعال','خون‌بهای فعال میان مهاجم و مدافع'),
    'intel','جاسوسی قدرت، اقتصاد، مشروعیت و فرمان مهرشدهٔ هدف را در سپیده‌دم به دفتر خصوصی می‌دهد؛ خودش ضریب مستقیم حمله نیست.',
    'specials','سورن می‌تواند نخستین حمله را تقویت کند؛ مرشد و اثرهای مشابه دفاع را بالا می‌برند؛ برخی فرمان‌های خاندان/چهره می‌توانند نتیجه را قطعی یا محدود کنند.'
  ),
  'economy', jsonb_build_object(
    'trade','فرمان تجارت یک اقدام تاکتیکی است: در سپیده‌دم اقتصاد شهر مبدأ +۱ می‌شود، مگر شهر/دفتر تجاری مختل باشد.',
    'caravan','فرمان کاروان یک اقدام مسیرمحور است: در سپیده‌دم اقتصاد شهر هدف +۱ می‌شود، مگر مسیر سوخته یا محاصره باشد.',
    'market','بازار مکاره مالکیت بلندمدت سند/دکان/حجره/کاروانسراست و درآمد سندها در سپیده‌دم پرداخت می‌شود.',
    'separation','کنترل نظامی شهر و مالکیت اقتصادی سندها دو state جدا هستند، اما هر دو به اقتصاد مشترک شهر وصل‌اند.'
  ),
  'clock', jsonb_build_object(
    'immediate',jsonb_build_array('خرید سند','ثبت قرارداد و وام','تعهد دفاعی','رشوه به شخصیت مستقل','اکشن مستقیم نقش مستقل'),
    'dawn',jsonb_build_array('۹ فرمان مهرشده','درآمد اسناد','سررسید و نکول وام','اجرای سفته‌ها و دیوار خون','حل/سرایت بحران‌ها','تغییر راند'),
    'rule','هیچ بحران یا نکول خارج از مرز راند به‌صورت مخفیانه resolve نمی‌شود؛ تغییرات خودکار در گذار سپیده‌دم ثبت می‌شوند.'
  ),
  'currencies', jsonb_build_object(
    'prestige','اعتبار درباری/Prestige: منبع بیداری سایه و بعضی توانایی‌های هویتی؛ با گذر راند، بعضی مالکیت‌ها و اکشن‌های موفق افزایش می‌یابد.',
    'credit','اعتبار مالی/Credit: reputation_score و credit_limit؛ سقف وام، نکول و دفتر آهنین را کنترل می‌کند و با Prestige یکی نیست.',
    'influence','نفوذ: توکن عملیاتی برای نجوا، فشار و بعضی اکشن‌های سیاسی.'
  ),
  'shadow', jsonb_build_object(
    'rule','هر اکشن مستقیم نقش سایه رد می‌گذارد. اکشن‌های تهاجمی رد بیشتری دارند؛ با رسیدن سوءظن به ۸۵، نقش سایه افشا می‌شود.',
    'risk',jsonb_build_object('underwrite',5,'margin_call',10,'secure_route',5,'reroute_supply',8,'buy_dossier',8,'seed_rumor',12),
    'bribe_network','رشوه به ۹ شخصیت مستقل نیز سوءظن را بالا می‌برد و قواعد افشای خودش را دارد.'
  ),
  'loans', jsonb_build_object(
    'territory','نکول وثیقه شهر: اگر شهر هنوز متعلق به وام‌گیرنده باشد، مالکیت به وام‌دهنده منتقل می‌شود.',
    'deed','نکول وثیقه سند: سند اقتصادی به وام‌دهنده منتقل می‌شود.',
    'income','نکول وثیقه درآمد: تا ۶ سکه از نقدینگی موجود وام‌گیرنده به وام‌دهنده منتقل می‌شود و حق توقیف در دفتر ثبت می‌شود.',
    'route','نکول وثیقه مسیر: پردرآمدترین شهر وام‌گیرنده ۲ اقتصاد و ۴ واحد ثبات اجتماعی از دست می‌دهد و ۳ سکه عوارض به وام‌دهنده می‌رسد.',
    'credit_penalty','هر نکول علاوه بر وثیقه، اعتبار مالی و سقف وام را کاهش می‌دهد و وام‌گیرنده موقتاً در سیاهه می‌رود.'
  ),
  'practice',jsonb_build_object(
    'engine','Practice و Online از یک Shared Resolver استفاده می‌کنند.',
    'transfer','Practice تالار مستقل سرورمحور است؛ state آن به تالار Online منتقل نمی‌شود و ورود به Online state تالار Online را بارگذاری می‌کند.'
  )
);
$$;
revoke all on function public.get_kaykha_logic_guide() from public,anon;
grant execute on function public.get_kaykha_logic_guide() to authenticated;

create or replace function app_private.kaykha_shadow_action_exposure()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_risk integer;
  v_after integer;
  v_role text;
  v_revealed boolean:=false;
begin
  v_risk:=case new.action_key
    when 'underwrite' then 5
    when 'margin_call' then 10
    when 'secure_route' then 5
    when 'reroute_supply' then 8
    when 'buy_dossier' then 8
    when 'seed_rumor' then 12
    else 6 end;

  update public.kaykha_members
     set suspicion_level=least(100,coalesce(suspicion_level,0)+v_risk)
   where id=new.member_id and game_id=new.game_id
   returning suspicion_level into v_after;

  select role_key into v_role
    from app_private.kaykha_shadow_roles
   where game_id=new.game_id and member_id=new.member_id;

  if coalesce(v_after,0)>=85 then
    update app_private.kaykha_shadow_roles
       set revealed_at=coalesce(revealed_at,now())
     where game_id=new.game_id and member_id=new.member_id and revealed_at is null;
    v_revealed:=found;
    if v_revealed then
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(new.game_id,new.round_no,'warning','رد شبکهٔ پنهان بیش از حد شد؛ نقش سایهٔ یک فرمانده در دیوان افشا شد.');
    end if;
  end if;

  insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,after_state,delta)
  values(new.game_id,new.round_no,'independent',new.member_id::text,'shadow_exposure',
    jsonb_build_object('role_key',v_role,'suspicion',v_after,'revealed',v_revealed),
    jsonb_build_object('suspicion_level',v_risk,'revealed',v_revealed));
  return new;
end;
$$;

drop trigger if exists kaykha_shadow_action_exposure on app_private.kaykha_independent_role_actions;
create trigger kaykha_shadow_action_exposure
after insert on app_private.kaykha_independent_role_actions
for each row execute function app_private.kaykha_shadow_action_exposure();

create or replace function app_private.kaykha_unsecured_collateral_default()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
declare
  v_take integer:=0;
  v_route text;
  v_before_economy integer;
begin
  if old.status<>'active' or new.status<>'defaulted' or new.collateral_type not in ('income','route') then
    return new;
  end if;

  if new.collateral_type='income' then
    select least(6,coins) into v_take from public.kaykha_members where id=new.borrower_member_id for update;
    v_take:=coalesce(v_take,0);
    if v_take>0 then
      update public.kaykha_members set coins=coins-v_take where id=new.borrower_member_id;
      update public.kaykha_members set coins=least(999,coins+v_take) where id=new.lender_member_id;
    end if;
    update public.kaykha_loans
       set status='foreclosed',current_holder_member_id=new.lender_member_id,
           income_share_bps=4000,leverage_points=greatest(leverage_points,2)
     where id=new.id;
    insert into public.kaykha_events(game_id,round_no,tone,body)
    values(new.game_id,new.due_round,'economy','وام نکول شد؛ وثیقه درآمد فعال شد و تا ۶ سکه از نقدینگی موجود به وام‌دهنده منتقل شد.');
    insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,delta)
    values(new.game_id,new.due_round,'member',new.borrower_member_id::text,'loan_income_foreclosure',jsonb_build_object('coins',-v_take,'lender_member_id',new.lender_member_id,'loan_id',new.id));
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
         set status='foreclosed',current_holder_member_id=new.lender_member_id,leverage_points=greatest(leverage_points,3),
             collateral_ref=coalesce(collateral_ref,'{}'::jsonb)||jsonb_build_object('resolved_route',v_route)
       where id=new.id;
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values(new.game_id,new.due_round,'economy','وام نکول شد؛ حق عوارض مسیر مصادره شد، اقتصاد مسیر آسیب دید و ۳ سکه عوارض به وام‌دهنده رسید.');
      insert into public.kaykha_effect_events(game_id,round_no,entity_type,entity_id,effect_kind,delta)
      values(new.game_id,new.due_round,'territory',v_route,'loan_route_foreclosure',jsonb_build_object('economy',greatest(0,v_before_economy-2)-v_before_economy,'poverty',4,'lender_coins',3,'loan_id',new.id));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists kaykha_unsecured_collateral_default on public.kaykha_loans;
create trigger kaykha_unsecured_collateral_default
after update of status on public.kaykha_loans
for each row execute function app_private.kaykha_unsecured_collateral_default();

create or replace function public.get_kaykha_action_manifest()
returns jsonb
language sql
stable security definer
set search_path=''
as $$
select jsonb_build_object(
  'attack',jsonb_build_object('base_cost',8,'credibility_cost',0,'effect','سپیده‌دم: قدرت حمله = قدرت مبدأ + اثرهای فعال؛ دفاع = قدرت هدف + وهم/اثرهای دفاعی. دفاع و پشتیبانی پیش از حمله حل می‌شوند.','counterplay','بست یا خون‌بها حمله را کامل می‌بندد؛ دفاع، پشتیبانی، مرشد و اثرهای خاندان/چهره دفاع را تغییر می‌دهند. جاسوسی ضریب مستقیم نیست و فقط اطلاعات واقعی می‌دهد.','risk','شکست معمولاً ۱ قدرت از مبدأ کم می‌کند؛ استثناها و خاندان‌ها می‌توانند این پیامد را تغییر دهند.','visual','ownership_flip'),
  'defend',jsonb_build_object('base_cost',4,'credibility_cost',0,'effect','سپیده‌دم و پیش از حمله‌ها: قدرت پادگان شهر مبدأ +۲ می‌شود.','counterplay','قفل دفاع و اثرهای ترس می‌توانند آن را خنثی کنند.','risk','فرصت فرمان دیگری همان راند را مصرف می‌کنی.','visual','fortify'),
  'support',jsonb_build_object('base_cost',5,'credibility_cost',0,'effect','سپیده‌دم و پیش از حمله‌ها: قدرت شهر هدف افزایش می‌یابد؛ مهران پاداش بیشتری می‌گیرد.','counterplay','فشار همزمان، محاصره یا تغییر مالکیت می‌تواند ارزش پشتیبانی را کم کند.','risk','منابع به جبهه‌ای می‌رود که شاید هدف حمله نباشد.','visual','reinforcement'),
  'caravan',jsonb_build_object('base_cost',3,'credibility_cost',0,'effect','سپیده‌دم: اگر مسیر باز باشد، اقتصاد شهر هدف +۱. این «حرکت مسیر» است، نه خرید مالکیت بازار.','counterplay','محاصره بازار، زمین سوخته و خرابکاری مسیر.','risk','مسیر بسته، فرمان را بی‌سود می‌کند.','visual','caravan_arrival'),
  'trade',jsonb_build_object('base_cost',3,'credibility_cost',0,'effect','سپیده‌دم: اقتصاد شهر مبدأ +۱. این «رونق تاکتیکی شهر» است؛ سندهای بازار مالکیت بلندمدت جداگانه دارند.','counterplay','زمین سوخته، اختلال بازار و فشار قراردادها.','risk','در شهر مختل‌شده ممکن است بدون اثر بماند.','visual','economy_up'),
  'spy',jsonb_build_object('base_cost',6,'credibility_cost',2,'effect','سپیده‌دم: پرونده خصوصی قدرت، اقتصاد، مشروعیت و فرمان هدف ثبت می‌شود؛ جاسوسی خودش قدرت نبرد را تغییر نمی‌دهد.','counterplay','ضدجاسوسی، اسپینداد، باوندیان و سایه‌بان.','risk','۲ اعتبار مالی مصرف می‌شود و شبکه ممکن است بسوزد.','visual','intel_reveal'),
  'revolt',jsonb_build_object('base_cost',10,'credibility_cost',0,'effect','سپیده‌دم: قدرت −۱، اقتصاد −۲، مشروعیت −۱۰ و فقر +۱۰؛ شهر وارد آشوب می‌شود.','counterplay','کارن، اسپینداد و اثرهای ضدشورش.','risk','گران است و روی شهر محافظت‌شده بی‌اثر می‌شود.','visual','revolt'),
  'raid',jsonb_build_object('base_cost',7,'credibility_cost',1,'effect','سپیده‌دم: یک دارایی آسیب‌پذیر هدف غارت و جریان اقتصادی مختل می‌شود.','counterplay','بست، باوندیان، حفاظت سند و ضدجاسوسی.','risk','۱ اعتبار مالی مصرف می‌شود و هدف نامناسب ممکن است غنیمتی نداشته باشد.','visual','raid'),
  'sabotage',jsonb_build_object('base_cost',8,'credibility_cost',3,'effect','سپیده‌دم: زیرساخت/سند اقتصادی هدف از کار می‌افتد، مگر ضدبازی آن را خنثی کند.','counterplay','ضدجاسوسی، بست، باوندیان و حفاظت سند.','risk','۳ اعتبار مالی مصرف می‌شود؛ بالاترین هزینه اعتبار میان فرمان‌های پنهان.','visual','sabotage')
);
$$;
revoke all on function public.get_kaykha_action_manifest() from public,anon;
grant execute on function public.get_kaykha_action_manifest() to authenticated;