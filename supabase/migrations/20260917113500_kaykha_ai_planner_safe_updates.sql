-- Hotfix: Supabase safe-update guards reject UPDATE statements without a WHERE clause.
-- kaykha_ai_candidates.action is NOT NULL, so these predicates change no scoring
-- semantics; they only make the three temporary-table scoring passes explicit.

do $patch$
declare
  v_def text;
  v_before text;
begin
  select pg_get_functiondef('app_private.plan_kaykha_practice_ai(uuid,integer)'::regprocedure)
    into v_def;
  v_before:=v_def;

  if strpos(v_def,$old_hard$
      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3;
$old_hard$)=0 then
    raise exception 'Hard AI scoring update marker not found';
  end if;
  v_def:=replace(
    v_def,
$old_hard$      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3;$old_hard$,
$new_hard$      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3
    where c.action is not null;$new_hard$
  );

  if strpos(v_def,$old_master$
      + mod(abs(hashtext('mastermind:'||p_game_id::text||':'||p_round::text||':'||c.action||':'||c.target_id)::bigint),5)-2;
$old_master$)=0 then
    raise exception 'Mastermind AI scoring update marker not found';
  end if;
  v_def:=replace(
    v_def,
$old_master$      + mod(abs(hashtext('mastermind:'||p_game_id::text||':'||p_round::text||':'||c.action||':'||c.target_id)::bigint),5)-2;$old_master$,
$new_master$      + mod(abs(hashtext('mastermind:'||p_game_id::text||':'||p_round::text||':'||c.action||':'||c.target_id)::bigint),5)-2
    where c.action is not null;$new_master$
  );

  if strpos(v_def,$old_repeat$      least(20,5*app_private.kaykha_strategy_repetition(p_game_id,v_ai.id,p_round,app_private.kaykha_action_family(c.action)));$old_repeat$)=0 then
    raise exception 'Mastermind repetition update marker not found';
  end if;
  v_def:=replace(
    v_def,
$old_repeat$      least(20,5*app_private.kaykha_strategy_repetition(p_game_id,v_ai.id,p_round,app_private.kaykha_action_family(c.action)));$old_repeat$,
$new_repeat$      least(20,5*app_private.kaykha_strategy_repetition(p_game_id,v_ai.id,p_round,app_private.kaykha_action_family(c.action)))
    where c.action is not null;$new_repeat$
  );

  if v_def=v_before then raise exception 'AI safe-update hotfix produced no change'; end if;
  execute v_def;
end;
$patch$;
