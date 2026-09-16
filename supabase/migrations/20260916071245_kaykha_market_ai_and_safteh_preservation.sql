create or replace function app_private.kaykha_zik_ai_undercity_toll()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  if new.zone_key='undercity' then
    update public.kaykha_members
    set coins=least(999,coins+1)
    where game_id=new.game_id and house_id='زیک' and is_ai and id<>new.owner_member_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_zik_ai_undercity_toll on public.kaykha_deeds;
create trigger kaykha_zik_ai_undercity_toll
after insert on public.kaykha_deeds
for each row execute function app_private.kaykha_zik_ai_undercity_toll();

create or replace function public.purchase_kaykha_safteh(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  l public.kaykha_loans%rowtype;
  buyer public.kaykha_members%rowtype;
  v_price integer;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into l from public.kaykha_loans where id=p_loan_id for update;
  if not found or l.status<>'defaulted' then raise exception 'این سفته در بازار بدهی عرضه نشده است'; end if;
  select * into buyer from public.kaykha_members
  where game_id=l.game_id and user_id=(select auth.uid()) and not is_ai for update;
  if not found or buyer.id=l.borrower_member_id then raise exception 'خریدار سفته نامعتبر است'; end if;
  if buyer.id=coalesce(l.current_holder_member_id,l.lender_member_id) then raise exception 'این سفته همین حالا در اختیار خودت است'; end if;
  v_price:=coalesce(l.market_price,greatest(1,ceil((l.principal+l.interest_coins)*0.65)::integer));
  if buyer.coins<v_price then raise exception 'سکهٔ کافی برای خرید سفته ندارید'; end if;
  update public.kaykha_members set coins=coins-v_price where id=buyer.id;
  update public.kaykha_members set coins=least(999,coins+v_price)
  where id=coalesce(l.current_holder_member_id,l.lender_member_id);
  update public.kaykha_loans
  set current_holder_member_id=buyer.id,
      market_price=v_price,
      leverage_points=greatest(leverage_points,3),
      income_share_bps=greatest(income_share_bps,1000)
  where id=l.id;
  insert into public.kaykha_events(game_id,round_no,tone,body)
  select l.game_id,g.round_no,'economy','سفته در بازار بدهی دست‌به‌دست شد؛ حقوق و اهرم‌های قبلی آن حفظ شدند.'
  from public.kaykha_games g where g.id=l.game_id;
end;
$function$;

grant execute on function public.purchase_kaykha_safteh(uuid) to authenticated;
