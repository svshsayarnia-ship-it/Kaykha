
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
    v_required_type := r.terms->>'required_order_type';
    v_required_target := nullif(r.terms->>'required_target_territory', '');
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

create or replace function app_private.prepare_kaykha_contract()
returns trigger
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $function$
declare
  v_round integer;
  v_level text;
  v_due integer;
begin
  select round_no into v_round from public.kaykha_games where id = new.game_id;
  v_level := nullif(new.terms->>'contract_level', '');
  if v_level is null and new.contract_type = 'blood_debt' then v_level := 'blood'; end if;
  if v_level is not null then new.contract_level := v_level; end if;

  if new.terms ? 'deposit_coins' then
    new.deposit_coins := greatest(0, least(999, coalesce((new.terms->>'deposit_coins')::integer, new.deposit_coins)));
  end if;
  if new.terms ? 'breach_penalty_reputation' then
    new.breach_penalty_reputation := greatest(0, least(100, coalesce((new.terms->>'breach_penalty_reputation')::integer, new.breach_penalty_reputation)));
  end if;
  if new.terms ? 'blacklist_rounds' then
    new.blacklist_rounds := greatest(0, least(12, coalesce((new.terms->>'blacklist_rounds')::integer, new.blacklist_rounds)));
  end if;

  v_due := nullif(new.terms->>'due_round', '')::integer;
  if v_due is null and new.terms ? 'duration_rounds' and v_round is not null then
    v_due := v_round + greatest(1, least(12, (new.terms->>'duration_rounds')::integer));
  end if;
  if new.due_round is null and v_due is not null then new.due_round := v_due; end if;
  return new;
end;
$function$;

drop trigger if exists kaykha_contract_defaults on public.kaykha_contracts;
create trigger kaykha_contract_defaults
before insert or update of terms, contract_type on public.kaykha_contracts
for each row execute function app_private.prepare_kaykha_contract();

grant execute on function public.get_kaykha_credit_profile(uuid) to authenticated;
grant execute on function public.assign_kaykha_shadow_role(uuid,uuid,text) to authenticated;
grant execute on function public.get_kaykha_shadow_role(uuid) to authenticated;
grant execute on function public.create_kaykha_loan(uuid,uuid,integer,integer,integer,text,jsonb) to authenticated;
grant execute on function public.settle_kaykha_loan(uuid) to authenticated;
