-- Gameplay Flow V2 security hardening.
-- Immutable helpers do not need caller-controlled schemas in their search_path.

alter function app_private.kaykha_action_family(text)
  set search_path = pg_catalog;

alter function app_private.kaykha_repetition_surcharge(integer)
  set search_path = pg_catalog;

alter function app_private.kaykha_repetition_exposure(integer)
  set search_path = pg_catalog;
