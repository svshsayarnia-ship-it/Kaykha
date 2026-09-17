-- Hotfix: Supabase safe-update guards reject UPDATE statements without a WHERE clause.
-- kaykha_ai_candidates.action is NOT NULL, so this predicate changes no scoring
-- semantics; it only makes the three temporary-table scoring passes explicit.

do $patch$
declare
  v_def text;
  v_before text;
begin
  select pg_get_functiondef('app_private.plan_kaykha_practice_ai(uuid,integer)'::regprocedure)
    into v_def;
  v_before:=v_def;

  v_def:=replace(
    v_def,
    E"      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3;",
    E"      + mod(abs(hashtext(p_game_id::text||':'||p_round::text||':'||c.action||':'||c.origin_id||':'||c.target_id)::bigint),7)-3;"
  );
end;
$patch$;
