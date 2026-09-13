-- Cover the new relation keys used by per-round private resolution.
create index if not exists kaykha_counter_orders_member_idx
  on app_private.kaykha_counter_orders(member_id);
create index if not exists kaykha_searches_investigator_idx
  on app_private.kaykha_searches(investigator_member_id);
create index if not exists kaykha_compensations_game_member_idx
  on public.kaykha_compensations(game_id,member_id,expires_round);
create index if not exists kaykha_loans_current_holder_idx
  on public.kaykha_loans(current_holder_member_id);

