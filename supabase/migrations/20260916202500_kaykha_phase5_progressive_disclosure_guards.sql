create or replace function app_private.kaykha_progressive_order_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $$
declare
  v_round integer:=1;
  v_practice boolean:=false;
  v_is_ai boolean:=false;
begin
  select coalesce(g.round_no,1),coalesce(g.is_practice,false),coalesce(m.is_ai,false)
    into v_round,v_practice,v_is_ai
  from public.kaykha_games g
  left join public.kaykha_members m on m.id=new.member_id and m.game_id=g.id
  where g.id=new.game_id;

  if v_practice or v_is_ai then return new; end if;
  if new.order_type in ('caravan','spy') and v_round<2 then
    raise exception 'این فرمان از راند ۲ باز می‌شود';
  end if;
  if new.order_type in ('revolt','raid','sabotage','spell') and v_round<4 then
    raise exception 'این فرمان از راند ۴ باز می‌شود';
  end if;
  return new;
end
$$;

drop trigger if exists kaykha_progressive_order_guard on app_private.kaykha_secret_orders;
create trigger kaykha_progressive_order_guard
before insert or update of order_type on app_private.kaykha_secret_orders
for each row execute function app_private.kaykha_progressive_order_guard();

create or replace function public.kaykha_progressive_loan_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $$
declare
  v_round integer:=1;
  v_practice boolean:=false;
begin
  select coalesce(round_no,1),coalesce(is_practice,false) into v_round,v_practice
  from public.kaykha_games where id=new.game_id;
  if not v_practice and v_round<3 then
    raise exception 'وام از راند ۳ باز می‌شود';
  end if;
  return new;
end
$$;

drop trigger if exists kaykha_progressive_loan_guard on public.kaykha_loans;
create trigger kaykha_progressive_loan_guard
before insert on public.kaykha_loans
for each row execute function public.kaykha_progressive_loan_guard();

create or replace function public.kaykha_progressive_shadow_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $$
declare
  v_round integer:=1;
  v_practice boolean:=false;
begin
  if coalesce(old.shadow_awakened,false)=false and coalesce(new.shadow_awakened,false)=true then
    select coalesce(round_no,1),coalesce(is_practice,false) into v_round,v_practice
    from public.kaykha_games where id=new.game_id;
    if not v_practice and v_round<3 then
      raise exception 'نقش سایه از راند ۳ باز می‌شود';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists kaykha_progressive_shadow_guard on public.kaykha_members;
create trigger kaykha_progressive_shadow_guard
before update of shadow_awakened on public.kaykha_members
for each row execute function public.kaykha_progressive_shadow_guard();

create or replace function public.kaykha_progressive_bounty_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $$
declare
  v_round integer:=1;
  v_practice boolean:=false;
begin
  select coalesce(round_no,1),coalesce(is_practice,false) into v_round,v_practice
  from public.kaykha_games where id=new.game_id;
  if not v_practice and v_round<4 then
    raise exception 'دیوار خون از راند ۴ باز می‌شود';
  end if;
  return new;
end
$$;

drop trigger if exists kaykha_progressive_bounty_guard on public.kaykha_bounties;
create trigger kaykha_progressive_bounty_guard
before insert on public.kaykha_bounties
for each row execute function public.kaykha_progressive_bounty_guard();
