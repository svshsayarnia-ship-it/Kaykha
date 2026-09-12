
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

  if new.contract_type = 'blood_debt' then
    new.contract_level := 'blood';
  else
    v_level := nullif(new.terms->>'contract_level', '');
    if v_level is not null then new.contract_level := v_level; end if;
  end if;

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
