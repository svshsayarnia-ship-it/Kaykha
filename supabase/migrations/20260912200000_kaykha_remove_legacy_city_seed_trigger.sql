-- The final Phase 5 create_kaykha_game function seeds the canonical 16-city map
-- itself. The Phase 4B trigger would add legacy "gambroon" as a 17th city.
drop trigger if exists kaykha_seed_extra_cities_trigger on public.kaykha_games;
