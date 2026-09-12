
create index if not exists kaykha_defense_pledges_member_idx
  on public.kaykha_defense_pledges(member_id);

drop policy if exists "city neighbors are never directly readable" on app_private.kaykha_city_neighbors;
create policy "city neighbors are never directly readable"
  on app_private.kaykha_city_neighbors for all to public
  using (false)
  with check (false);
