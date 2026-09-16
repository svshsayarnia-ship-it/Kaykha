do $patch$
declare
  v_def text;
  v_old text := $old$
  update kaykha_attack_work w
  set winner=true
  where w.success and w.blocked_reason is null
    and w.order_id=(
      select x.order_id from kaykha_attack_work x
      where x.target_id=w.target_id and x.success and x.blocked_reason is null
      order by x.margin desc,x.initiative asc,x.order_id asc
      limit 1
    );
$old$;
  v_new text := $new$
  update kaykha_attack_work as aw
  set winner=true
  where aw.success and aw.blocked_reason is null
    and aw.order_id=(
      select x.order_id from kaykha_attack_work x
      where x.target_id=aw.target_id and x.success and x.blocked_reason is null
      order by x.margin desc,x.initiative asc,x.order_id asc
      limit 1
    );
$new$;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='app_private' and p.proname='resolve_kaykha_attacks_snapshot';
  if position(v_old in v_def)=0 then raise exception 'snapshot alias patch point not found'; end if;
  execute replace(v_def,v_old,v_new);
end;
$patch$;
