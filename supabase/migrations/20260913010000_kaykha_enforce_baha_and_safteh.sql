-- Enforce Baha at the authoritative order boundary and activate traded Safteh yield.

create or replace function public.submit_kaykha_order(
  p_game_id uuid, p_order_type text, p_origin_territory_id text,
  p_target_territory_id text, p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer
set search_path=public,app_private,pg_temp as $$
declare
  v_game public.kaykha_games%rowtype; v_member public.kaykha_members%rowtype;
  v_old app_private.kaykha_secret_orders%rowtype; v_order_id uuid;
  v_income integer; v_power integer; v_base integer; v_gold integer;
  v_cred integer:=0; v_bribe integer:=0; v_masked boolean:=false;
  v_old_gold integer:=0; v_old_cred integer:=0; v_old_bribe integer:=0;
  v_payload jsonb;
begin
 if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
 if p_order_type not in ('attack','defend','support','spy','revolt','caravan','trade','raid','sabotage','spell') then raise exception 'نوع فرمان نامعتبر است'; end if;
 select * into v_game from public.kaykha_games where id=p_game_id for update;
 if not found or v_game.status<>'active' or v_game.phase<>'orders' then raise exception 'اکنون امکان مهر کردن فرمان نیست'; end if;
 select * into v_member from public.kaykha_members where game_id=p_game_id and user_id=(select auth.uid()) and not is_ai for update;
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
 into v_income,v_power from public.kaykha_territories where game_id=p_game_id and owner_member_id=v_member.id;
 v_base:=case p_order_type when 'attack' then 8 when 'defend' then 4 when 'support' then 5
   when 'spy' then 6 when 'revolt' then 10 when 'caravan' then 3 when 'trade' then 3
   when 'raid' then 7 when 'sabotage' then 8 when 'spell' then 7 else 5 end;
 v_gold:=least(999,ceil(v_base*(1+0.018*greatest(0,v_income-10)+0.012*greatest(0,v_power-12)))::integer);
 if p_order_type in ('spy','sabotage','raid','spell') then
   v_cred:=case p_order_type when 'sabotage' then 3 when 'spy' then 2 else 1 end;
 end if;
 v_masked:=case when jsonb_typeof(coalesce(p_payload,'{}'::jsonb)->'masked')='boolean'
   then (p_payload->>'masked')::boolean else false end;
 if v_masked and p_order_type in ('spy','sabotage','raid') then
   v_bribe:=least(3,greatest(1,coalesce((p_payload->>'bribe_tokens')::integer,1)));
 end if;

 -- A replaced order refunds only the server-recorded Baha, then atomically charges the new one.
 if v_member.coins+v_old_gold<v_gold then raise exception 'خزانه برای بهای این فرمان کافی نیست'; end if;
 if v_member.reputation_score+v_old_cred<v_cred then raise exception 'اعتبار سیاسی برای این فرمان کافی نیست'; end if;
 if v_member.bribe_tokens+v_old_bribe<v_bribe then raise exception 'مهر رشوه برای پوشاندن چاپار کافی نیست'; end if;
 update public.kaykha_members set
   coins=coins+v_old_gold-v_gold,
   reputation_score=least(100,reputation_score+v_old_cred)-v_cred,
   bribe_tokens=bribe_tokens+v_old_bribe-v_bribe
 where id=v_member.id;

 v_payload:=(coalesce(p_payload,'{}'::jsonb)-'_baha') ||
   jsonb_build_object('_baha',jsonb_build_object('gold',v_gold,'credibility',v_cred,'bribe_tokens',v_bribe,'revision',1));
 insert into app_private.kaykha_secret_orders(game_id,member_id,round_no,order_type,origin_territory_id,target_territory_id,payload)
 values(p_game_id,v_member.id,v_game.round_no,p_order_type,p_origin_territory_id,p_target_territory_id,v_payload)
 on conflict(game_id,member_id,round_no) do update set order_type=excluded.order_type,
   origin_territory_id=excluded.origin_territory_id,target_territory_id=excluded.target_territory_id,
   payload=excluded.payload,locked_at=now()
 returning order_id into v_order_id;
 return v_order_id;
end $$;
revoke all on function public.submit_kaykha_order(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.submit_kaykha_order(uuid,text,text,text,jsonb) to authenticated;

create or replace function app_private.settle_kaykha_safteh_market(p_game_id uuid,p_round integer)
returns integer language plpgsql security definer set search_path=public,app_private,pg_temp as $$
declare l record; v_tax integer; v_done integer:=0;
begin
 update public.kaykha_loans set
   current_holder_member_id=coalesce(current_holder_member_id,lender_member_id),
   market_price=coalesce(market_price,greatest(1,ceil((principal+interest_coins)*0.65)::integer))
 where game_id=p_game_id and status='defaulted';

 for l in select x.*,b.coins borrower_coins from public.kaykha_loans x
   join public.kaykha_members b on b.id=x.borrower_member_id
   where x.game_id=p_game_id and x.status='defaulted' and x.current_holder_member_id is not null
     and x.current_holder_member_id<>x.borrower_member_id and x.income_share_bps>0
   order by x.created_at,x.id for update of x,b
 loop
   v_tax:=least(l.borrower_coins,greatest(0,floor((l.borrower_coins*l.income_share_bps)/10000.0)::integer));
   if v_tax>0 then
     update public.kaykha_members set coins=coins-v_tax where id=l.borrower_member_id;
     update public.kaykha_members set coins=least(999,coins+v_tax) where id=l.current_holder_member_id;
     v_done:=v_done+1;
   end if;
 end loop;
 return v_done;
end $$;
revoke all on function app_private.settle_kaykha_safteh_market(uuid,integer) from public,anon,authenticated;

create or replace function app_private.kaykha_paranoia_after_round()
returns trigger language plpgsql security definer set search_path=public,app_private,pg_temp as $$
begin
 if old.phase='orders' and new.phase='negotiation' and new.round_no=old.round_no+1 then
   perform app_private.resolve_kaykha_searches(new.id,old.round_no);
   perform app_private.update_kaykha_paranoia(new.id,old.round_no);
   perform app_private.settle_kaykha_safteh_market(new.id,old.round_no);
   update public.kaykha_members set search_tokens=least(5,search_tokens+1),
     bribe_tokens=least(8,bribe_tokens+case when new.round_no%2=0 then 1 else 0 end)
   where game_id=new.id;
 end if; return new;
end $$;
revoke execute on function app_private.kaykha_paranoia_after_round() from public,anon,authenticated;

