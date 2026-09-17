-- Reconcile the combat resolver's schema/runtime dependencies with source control.
-- Production already has these objects; this migration is idempotent and makes
-- a fresh migration chain fail fast instead of leaving a latent round-resolution bug.

alter table public.kaykha_territories
  add column if not exists illusion_strength smallint;

update public.kaykha_territories
set illusion_strength = 0
where illusion_strength is null;

alter table public.kaykha_territories
  alter column illusion_strength set default 0,
  alter column illusion_strength set not null;

do $guard$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='kaykha_territories'
      and c.conname='kaykha_territories_illusion_strength_check'
  ) then
    alter table public.kaykha_territories
      add constraint kaykha_territories_illusion_strength_check
      check (illusion_strength >= 0);
  end if;

  if to_regprocedure('app_private.resolve_kaykha_economy_and_contracts(uuid,integer)') is null then
    raise exception 'Kaykha migration integrity failure: resolve_kaykha_economy_and_contracts(uuid,integer) is missing';
  end if;
end;
$guard$;
