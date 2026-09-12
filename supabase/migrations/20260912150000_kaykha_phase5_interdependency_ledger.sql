
-- Kaykha Phase 5A: interdependency ledger, enforceable credit and shadow roles.
-- Additive only: existing contracts, economy, orders and resolution remain compatible.

alter table public.kaykha_members
  add column if not exists reputation_score integer not null default 50,
  add column if not exists credit_limit integer not null default 20,
  add column if not exists blacklist_until_round integer;

alter table public.kaykha_members
  drop constraint if exists kaykha_members_reputation_score_check,
  drop constraint if exists kaykha_members_credit_limit_check,
  drop constraint if exists kaykha_members_blacklist_until_round_check;

alter table public.kaykha_members
  add constraint kaykha_members_reputation_score_check check (reputation_score between 0 and 100),
  add constraint kaykha_members_credit_limit_check check (credit_limit >= 0),
  add constraint kaykha_members_blacklist_until_round_check check (blacklist_until_round is null or blacklist_until_round >= 0);

alter table public.kaykha_contracts
  add column if not exists contract_level text not null default 'sealed',
  add column if not exists witness_member_id uuid,
  add column if not exists deposit_coins integer not null default 0,
  add column if not exists breach_penalty_reputation integer not null default 10,
  add column if not exists blacklist_rounds integer not null default 2,
  add column if not exists enforcement_result jsonb not null default '{}'::jsonb;

alter table public.kaykha_contracts
  drop constraint if exists kaykha_contracts_contract_level_check,
  drop constraint if exists kaykha_contracts_deposit_coins_check,
  drop constraint if exists kaykha_contracts_breach_penalty_check,
  drop constraint if exists kaykha_contracts_blacklist_rounds_check;

alter table public.kaykha_contracts
  add constraint kaykha_contracts_contract_level_check
    check (contract_level in ('word','sealed','blood')),
  add constraint kaykha_contracts_deposit_coins_check
    check (deposit_coins >= 0),
  add constraint kaykha_contracts_breach_penalty_check
    check (breach_penalty_reputation between 0 and 100),
  add constraint kaykha_contracts_blacklist_rounds_check
    check (blacklist_rounds between 0 and 12);

alter table public.kaykha_contracts
  drop constraint if exists kaykha_contracts_witness_member_id_fkey;
alter table public.kaykha_contracts
  add constraint kaykha_contracts_witness_member_id_fkey
    foreign key (witness_member_id) references public.kaykha_members(id) on delete set null;

create table if not exists public.kaykha_loans (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  lender_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  borrower_member_id uuid not null references public.kaykha_members(id) on delete cascade,
  principal integer not null check (principal between 1 and 999),
  interest_coins integer not null default 0 check (interest_coins between 0 and 999),
  collateral_type text not null check (collateral_type in ('territory','deed','income','route')),
  collateral_ref jsonb not null default '{}'::jsonb,
  opened_round integer not null check (opened_round >= 0),
  due_round integer not null check (due_round > opened_round),
  status text not null default 'active' check (status in ('active','repaid','defaulted','foreclosed','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (lender_member_id <> borrower_member_id)
);

create index if not exists kaykha_loans_game_status_due_idx
  on public.kaykha_loans(game_id, status, due_round);
create index if not exists kaykha_loans_lender_idx
  on public.kaykha_loans(lender_member_id, status);
create index if not exists kaykha_loans_borrower_idx
  on public.kaykha_loans(borrower_member_id, status);

alter table public.kaykha_loans enable row level security;
drop policy if exists "game members read kaykha loans" on public.kaykha_loans;
create policy "game members read kaykha loans"
  on public.kaykha_loans for select to authenticated
  using (exists (
    select 1 from public.kaykha_members m
    where m.game_id = kaykha_loans.game_id and m.user_id = (select auth.uid())
  ));

create table if not exists public.kaykha_credit_ledger (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  delta integer not null check (delta between -100 and 100),
  reason text not null,
  round_no integer not null default 0 check (round_no >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kaykha_credit_ledger_member_idx
  on public.kaykha_credit_ledger(game_id, member_id, created_at desc);

alter table public.kaykha_credit_ledger enable row level security;
drop policy if exists "game members read kaykha credit ledger" on public.kaykha_credit_ledger;
create policy "game members read kaykha credit ledger"
  on public.kaykha_credit_ledger for select to authenticated
  using (exists (
    select 1 from public.kaykha_members m
    where m.game_id = kaykha_credit_ledger.game_id and m.user_id = (select auth.uid())
  ));

create table if not exists app_private.kaykha_shadow_roles (
  game_id uuid not null references public.kaykha_games(id) on delete cascade,
  member_id uuid not null references public.kaykha_members(id) on delete cascade,
  role_key text not null check (role_key in ('banker','logist','whisperer')),
  assigned_at timestamptz not null default now(),
  revealed_at timestamptz,
  primary key (game_id, member_id),
  unique (game_id, role_key)
);

alter table app_private.kaykha_shadow_roles enable row level security;
revoke all on app_private.kaykha_shadow_roles from anon, authenticated;

create or replace function app_private.adjust_kaykha_credit(
  p_game_id uuid,
  p_member_id uuid,
  p_delta integer,
  p_reason text,
  p_round_no integer,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  update public.kaykha_members
     set reputation_score = greatest(0, least(100, reputation_score + p_delta)),
         credit_limit = greatest(0, least(200, credit_limit + case when p_delta >= 0 then floor(p_delta / 2.0)::integer else p_delta end))
   where id = p_member_id and game_id = p_game_id;

  insert into public.kaykha_credit_ledger(game_id, member_id, delta, reason, round_no, metadata)
  values (p_game_id, p_member_id, p_delta, p_reason, greatest(0, p_round_no), coalesce(p_metadata, '{}'::jsonb));
end;
$function$;

create or replace function public.get_kaykha_credit_profile(p_game_id uuid)
returns table (
  member_id uuid,
  display_name text,
  reputation_score integer,
  credit_limit integer,
  blacklist_until_round integer,
  active_debt integer
)
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  if not exists (
    select 1 from public.kaykha_members
    where game_id = p_game_id and user_id = (select auth.uid())
  ) then
    raise exception 'شما عضو این تالار نیستید';
  end if;

  return query
  select m.id, m.display_name, m.reputation_score, m.credit_limit,
         m.blacklist_until_round,
         coalesce(sum(l.principal + l.interest_coins) filter (where l.status = 'active'), 0)::integer
    from public.kaykha_members m
    left join public.kaykha_loans l
      on l.game_id = m.game_id and l.borrower_member_id = m.id
   where m.game_id = p_game_id
   group by m.id, m.display_name, m.reputation_score, m.credit_limit, m.blacklist_until_round
   order by m.seat_no nulls last, m.display_name;
end;
$function$;

create or replace function public.assign_kaykha_shadow_role(
  p_game_id uuid,
  p_member_id uuid,
  p_role_key text
) returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id = p_game_id for update;
  if not found or v_game.host_user_id <> (select auth.uid()) then
    raise exception 'فقط میزبان می‌تواند نقش سایه را تعیین کند';
  end if;
  if v_game.status <> 'lobby' then raise exception 'نقش سایه فقط پیش از آغاز بازی تعیین می‌شود'; end if;
  if p_role_key not in ('banker','logist','whisperer') then raise exception 'نقش سایه نامعتبر است'; end if;
  if not exists (select 1 from public.kaykha_members where id = p_member_id and game_id = p_game_id) then
    raise exception 'عضو این تالار پیدا نشد';
  end if;

  insert into app_private.kaykha_shadow_roles(game_id, member_id, role_key)
  values (p_game_id, p_member_id, p_role_key)
  on conflict (game_id, member_id) do update
     set role_key = excluded.role_key, assigned_at = now(), revealed_at = null;
end;
$function$;

create or replace function public.get_kaykha_shadow_role(p_game_id uuid)
returns table (role_key text, assigned_at timestamptz, revealed_at timestamptz)
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  return query
  select s.role_key, s.assigned_at, s.revealed_at
    from app_private.kaykha_shadow_roles s
    join public.kaykha_members m on m.id = s.member_id
   where s.game_id = p_game_id and m.user_id = (select auth.uid());
end;
$function$;

create or replace function public.create_kaykha_loan(
  p_game_id uuid,
  p_borrower_member_id uuid,
  p_principal integer,
  p_interest_coins integer default 0,
  p_due_round integer default null,
  p_collateral_type text default 'income',
  p_collateral_ref jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_game public.kaykha_games%rowtype;
  v_lender_id uuid;
  v_borrower public.kaykha_members%rowtype;
  v_lender public.kaykha_members%rowtype;
  v_due integer;
  v_limit integer;
  v_exposure integer;
  v_loan_id uuid;
  v_territory text;
  v_deed uuid;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_game from public.kaykha_games where id = p_game_id for update;
  if not found or v_game.status <> 'active' or v_game.phase <> 'negotiation' then
    raise exception 'وام فقط در بازار مکاره فعال بازی ثبت می‌شود';
  end if;

  select * into v_lender from public.kaykha_members
   where game_id = p_game_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'شما عضو این تالار نیستید'; end if;
  v_lender_id := v_lender.id;

  select * into v_borrower from public.kaykha_members
   where id = p_borrower_member_id and game_id = p_game_id for update;
  if not found or v_borrower.id = v_lender_id or v_borrower.is_ai then
    raise exception 'وام‌گیرنده باید فرمانده دیگری از همین تالار باشد';
  end if;

  if p_principal not between 1 and 200 or p_interest_coins not between 0 and 200 then
    raise exception 'مقدار وام یا بهره نامعتبر است';
  end if;
  v_due := coalesce(p_due_round, v_game.round_no + 2);
  if v_due < v_game.round_no + 1 or v_due > v_game.round_no + 8 then
    raise exception 'موعد وام باید بین یک تا هشت راند آینده باشد';
  end if;

  v_limit := v_borrower.credit_limit + greatest(0, v_borrower.reputation_score - 50) / 2;
  select coalesce(sum(principal + interest_coins), 0)::integer into v_exposure
    from public.kaykha_loans
   where borrower_member_id = v_borrower.id and status = 'active';
  if v_exposure + p_principal + p_interest_coins > greatest(0, v_limit) then
    raise exception 'اعتبار این فرمانده برای این وام کافی نیست';
  end if;

  if v_lender.coins < p_principal then raise exception 'سکهٔ کافی برای پرداخت وام ندارید'; end if;

  if p_collateral_type = 'territory' then
    v_territory := nullif(p_collateral_ref->>'territory_id', '');
    if v_territory is null or not exists (
      select 1 from public.kaykha_territories
       where game_id = p_game_id and territory_id = v_territory and owner_member_id = v_borrower.id
    ) then
      raise exception 'وثیقهٔ شهر باید متعلق به وام‌گیرنده باشد';
    end if;
  elsif p_collateral_type = 'deed' then
    v_deed := nullif(p_collateral_ref->>'deed_id', '')::uuid;
    if v_deed is null or not exists (
      select 1 from public.kaykha_deeds
       where id = v_deed and game_id = p_game_id and owner_member_id = v_borrower.id
    ) then
      raise exception 'وثیقهٔ دکان باید متعلق به وام‌گیرنده باشد';
    end if;
  elsif p_collateral_type not in ('income','route') then
    raise exception 'نوع وثیقه نامعتبر است';
  end if;

  update public.kaykha_members set coins = coins - p_principal where id = v_lender_id;
  update public.kaykha_members set coins = least(999, coins + p_principal) where id = v_borrower.id;

  insert into public.kaykha_loans(
    game_id,lender_member_id,borrower_member_id,principal,interest_coins,
    collateral_type,collateral_ref,opened_round,due_round,status
  ) values (
    p_game_id,v_lender_id,v_borrower.id,p_principal,p_interest_coins,
    p_collateral_type,coalesce(p_collateral_ref,'{}'::jsonb),v_game.round_no,v_due,'active'
  ) returning id into v_loan_id;

  insert into public.kaykha_events(game_id,round_no,tone,body)
  values (p_game_id,v_game.round_no,'economy','وامی با وثیقه در دفتر آهنین ثبت شد؛ موعد وام در سپیده‌دم بررسی می‌شود.');

  return v_loan_id;
end;
$function$;

create or replace function public.settle_kaykha_loan(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_loan public.kaykha_loans%rowtype;
  v_borrower public.kaykha_members%rowtype;
  v_total integer;
  v_round integer;
begin
  if (select auth.uid()) is null then raise exception 'ورود به بازی لازم است'; end if;
  select * into v_loan from public.kaykha_loans where id = p_loan_id for update;
  if not found or v_loan.status <> 'active' then raise exception 'این وام دیگر فعال نیست'; end if;
  select round_no into v_round from public.kaykha_games where id = v_loan.game_id for update;
  select * into v_borrower from public.kaykha_members
   where id = v_loan.borrower_member_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'فقط وام‌گیرنده می‌تواند وام را تسویه کند'; end if;

  v_total := v_loan.principal + v_loan.interest_coins;
  if v_borrower.coins < v_total then raise exception 'سکهٔ کافی برای تسویه ندارید'; end if;

  update public.kaykha_members set coins = coins - v_total where id = v_borrower.id;
  update public.kaykha_members set coins = least(999, coins + v_total) where id = v_loan.lender_member_id;
  update public.kaykha_loans set status = 'repaid', resolved_at = now() where id = v_loan.id;
  perform app_private.adjust_kaykha_credit(
    v_loan.game_id, v_borrower.id, 8, 'repayment_on_time', v_round,
    jsonb_build_object('loan_id', v_loan.id)
  );
  insert into public.kaykha_events(game_id,round_no,tone,body)
  values (v_loan.game_id,v_round,'economy','وام پیش از نکول تسویه شد؛ اعتبار وام‌گیرنده ترمیم شد.');
end;
$function$;

create or replace function app_private.resolve_kaykha_loans(p_game_id uuid, p_round integer)
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  r record;
  v_total integer;
  v_territory text;
  v_deed uuid;
  v_actions integer := 0;
begin
  for r in
    select l.*, b.coins as borrower_coins, b.blacklist_until_round
      from public.kaykha_loans l
      join public.kaykha_members b on b.id = l.borrower_member_id
     where l.game_id = p_game_id and l.status = 'active' and l.due_round <= p_round
     order by l.due_round, l.created_at, l.id
     for update of l
  loop
    v_total := r.principal + r.interest_coins;
    if r.borrower_coins >= v_total then
      update public.kaykha_members set coins = coins - v_total where id = r.borrower_member_id;
      update public.kaykha_members set coins = least(999, coins + v_total) where id = r.lender_member_id;
      update public.kaykha_loans set status = 'repaid', resolved_at = now() where id = r.id;
      perform app_private.adjust_kaykha_credit(
        p_game_id, r.borrower_member_id, 5, 'automatic_repayment', p_round,
        jsonb_build_object('loan_id', r.id)
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values (p_game_id,p_round,'economy','سپیده‌دم، وامِ سررسیدشده خودکار پرداخت شد.');
    else
      update public.kaykha_loans set status = 'defaulted', resolved_at = now() where id = r.id;
      update public.kaykha_members
         set blacklist_until_round = greatest(coalesce(blacklist_until_round, 0), p_round + 2),
             credit_limit = greatest(0, credit_limit - 10)
       where id = r.borrower_member_id;
      perform app_private.adjust_kaykha_credit(
        p_game_id, r.borrower_member_id, -20, 'loan_default', p_round,
        jsonb_build_object('loan_id', r.id, 'collateral_type', r.collateral_type)
      );

      if r.collateral_type = 'territory' then
        v_territory := nullif(r.collateral_ref->>'territory_id', '');
        if v_territory is not null then
          update public.kaykha_territories
             set owner_member_id = r.lender_member_id, revision = revision + 1,
                 is_in_mutiny = false
           where game_id = p_game_id and territory_id = v_territory
             and owner_member_id = r.borrower_member_id;
          if found then update public.kaykha_loans set status = 'foreclosed' where id = r.id; end if;
        end if;
      elsif r.collateral_type = 'deed' then
        v_deed := nullif(r.collateral_ref->>'deed_id', '')::uuid;
        if v_deed is not null then
          update public.kaykha_deeds set owner_member_id = r.lender_member_id
           where id = v_deed and game_id = p_game_id and owner_member_id = r.borrower_member_id;
          if found then update public.kaykha_loans set status = 'foreclosed' where id = r.id; end if;
        end if;
      end if;

      insert into public.kaykha_events(game_id,round_no,tone,body)
      values (p_game_id,p_round,'danger','وام بی‌پاسخ ماند؛ اعتبار وام‌گیرنده شکست و وثیقه در معرض مصادره قرار گرفت.');
    end if;
    v_actions := v_actions + 1;
  end loop;
  return v_actions;
end;
$function$;

create or replace function app_private.enforce_kaykha_blood_contracts(p_game_id uuid, p_round integer)
returns integer
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  r record;
  v_required_type text;
  v_required_target text;
  v_fulfilled boolean;
  v_actions integer := 0;
begin
  for r in
    select c.*
      from public.kaykha_contracts c
     where c.game_id = p_game_id
       and c.status = 'active'
       and c.contract_level = 'blood'
       and c.due_round is not null
       and c.due_round <= p_round
       and c.terms ? 'required_order_type'
     order by c.created_at, c.id
     for update
  loop
    v_required_type := c.terms->>'required_order_type';
    v_required_target := nullif(c.terms->>'required_target_territory', '');
    select exists (
      select 1
        from app_private.kaykha_secret_orders so
       where so.game_id = p_game_id
         and so.round_no = r.due_round
         and so.member_id = r.counterparty_member_id
         and so.order_type = v_required_type
         and (v_required_target is null or so.target_territory_id = v_required_target)
    ) into v_fulfilled;

    if v_fulfilled then
      update public.kaykha_contracts
         set status = 'fulfilled', resolved_at = now(),
             enforcement_result = jsonb_build_object('result','fulfilled','round',p_round)
       where id = r.id;
      perform app_private.adjust_kaykha_credit(
        p_game_id, r.counterparty_member_id, 5, 'blood_contract_fulfilled', p_round,
        jsonb_build_object('contract_id', r.id)
      );
    else
      update public.kaykha_contracts
         set status = 'broken', resolved_at = now(),
             enforcement_result = jsonb_build_object('result','breached','round',p_round,'reason','required_order_missing')
       where id = r.id;
      update public.kaykha_members
         set blacklist_until_round = greatest(coalesce(blacklist_until_round, 0), p_round + r.blacklist_rounds)
       where id = r.counterparty_member_id;
      perform app_private.adjust_kaykha_credit(
        p_game_id, r.counterparty_member_id, -r.breach_penalty_reputation,
        'blood_contract_breach', p_round,
        jsonb_build_object('contract_id', r.id)
      );
      insert into public.kaykha_events(game_id,round_no,tone,body)
      values (p_game_id,p_round,'danger','قرارداد خون شکسته شد؛ اعتبار پیمان‌شکن کاهش یافت و دیوان او را در سیاهه گذاشت.');
    end if;
    v_actions := v_actions + 1;
  end loop;
  return v_actions;
end;
$function$;

create or replace function app_private.kaykha_after_round_resolution()
returns trigger
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
begin
  if old.phase = 'orders' and new.phase = 'negotiation' and new.round_no = old.round_no + 1 then
    perform app_private.resolve_kaykha_loans(old.id, old.round_no);
    perform app_private.enforce_kaykha_blood_contracts(old.id, old.round_no);
  end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_interdependency_after_round on public.kaykha_games;
create trigger kaykha_interdependency_after_round
after update of phase, round_no on public.kaykha_games
for each row execute function app_private.kaykha_after_round_resolution();

grant select on public.kaykha_loans, public.kaykha_credit_ledger to authenticated;
grant execute on function public.get_kaykha_credit_profile(uuid) to authenticated;
grant execute on function public.assign_kaykha_shadow_role(uuid,uuid,text) to authenticated;
grant execute on function public.get_kaykha_shadow_role(uuid) to authenticated;
grant execute on function public.create_kaykha_loan(uuid,uuid,integer,integer,integer,text,jsonb) to authenticated;
grant execute on function public.settle_kaykha_loan(uuid) to authenticated;
