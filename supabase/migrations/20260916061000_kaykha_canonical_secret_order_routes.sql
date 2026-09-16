-- Defend and trade are origin-scoped actions. Canonicalize their stored target at the database boundary
-- so old or tampered clients cannot create misleading target metadata.

create or replace function app_private.kaykha_canonicalize_secret_order_route()
returns trigger
language plpgsql
security definer
set search_path=public,app_private,pg_temp
as $$
begin
  if new.order_type in ('defend','trade') then
    new.target_territory_id := new.origin_territory_id;
  end if;
  return new;
end;
$$;

drop trigger if exists kaykha_canonical_secret_order_route on app_private.kaykha_secret_orders;
create trigger kaykha_canonical_secret_order_route
before insert or update of order_type,origin_territory_id,target_territory_id
on app_private.kaykha_secret_orders
for each row execute function app_private.kaykha_canonicalize_secret_order_route();