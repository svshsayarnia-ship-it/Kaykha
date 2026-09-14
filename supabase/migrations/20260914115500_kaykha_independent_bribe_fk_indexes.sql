-- Cover member foreign keys used by the independent-character bribery network.
create index if not exists kaykha_independent_bribes_member_fk_idx
  on app_private.kaykha_independent_bribes(member_id);

create index if not exists kaykha_independent_influence_member_fk_idx
  on app_private.kaykha_independent_character_influence(member_id);
