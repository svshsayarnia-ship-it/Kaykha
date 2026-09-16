create or replace function app_private.kaykha_order_initiative_id(p_game_id uuid,p_member_id uuid,p_round integer)
returns uuid
language plpgsql
stable
security definer
set search_path=public,app_private,pg_temp
as $function$
declare
  v_seat integer;
  v_count integer;
  v_rank integer;
  v_hash text;
  v_hex text;
begin
  select seat_no into v_seat from public.kaykha_members where id=p_member_id and game_id=p_game_id;
  select greatest(1,count(*))::integer into v_count
  from public.kaykha_members where game_id=p_game_id and seat_no is not null;
  v_seat:=coalesce(v_seat,v_count);
  v_rank:=mod((v_seat-1)-mod(greatest(0,p_round-1),v_count)+v_count,v_count)+1;
  v_hash:=md5(p_game_id::text||':'||p_member_id::text||':'||p_round::text);
  v_hex:=lpad(to_hex(v_rank),8,'0')||'-'||substr(v_hash,1,4)||'-'||substr(v_hash,5,4)||'-'||substr(v_hash,9,4)||'-'||substr(v_hash,13,12);
  return v_hex::uuid;
end;
$function$;

create or replace function app_private.kaykha_assign_rotating_initiative()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $function$
begin
  new.order_id:=app_private.kaykha_order_initiative_id(new.game_id,new.member_id,new.round_no);
  return new;
end;
$function$;

drop trigger if exists aaa_kaykha_assign_rotating_initiative on app_private.kaykha_secret_orders;
create trigger aaa_kaykha_assign_rotating_initiative
before insert or update of game_id,member_id,round_no
on app_private.kaykha_secret_orders
for each row execute function app_private.kaykha_assign_rotating_initiative();

update app_private.kaykha_secret_orders so
set order_id=app_private.kaykha_order_initiative_id(so.game_id,so.member_id,so.round_no)
from public.kaykha_games g
where g.id=so.game_id and g.status='active' and g.phase='orders' and so.round_no=g.round_no;

revoke all on function app_private.kaykha_order_initiative_id(uuid,uuid,integer) from public,anon,authenticated;
