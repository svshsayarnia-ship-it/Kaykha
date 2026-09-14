create index if not exists kaykha_independent_role_actions_member_fk_idx
  on app_private.kaykha_independent_role_actions(member_id);

create index if not exists kaykha_independent_role_actions_target_member_fk_idx
  on app_private.kaykha_independent_role_actions(target_member_id)
  where target_member_id is not null;

create index if not exists kaykha_independent_role_relations_actor_member_fk_idx
  on app_private.kaykha_independent_role_relations(actor_member_id);

create index if not exists kaykha_independent_role_relations_target_member_fk_idx
  on app_private.kaykha_independent_role_relations(target_member_id);
