
create index if not exists kaykha_contracts_witness_idx
  on public.kaykha_contracts(witness_member_id);
create index if not exists kaykha_credit_ledger_member_only_idx
  on public.kaykha_credit_ledger(member_id);
create index if not exists kaykha_shadow_roles_member_idx
  on app_private.kaykha_shadow_roles(member_id);

drop policy if exists "shadow roles are never directly readable" on app_private.kaykha_shadow_roles;
create policy "shadow roles are never directly readable"
  on app_private.kaykha_shadow_roles for all to public
  using (false)
  with check (false);
