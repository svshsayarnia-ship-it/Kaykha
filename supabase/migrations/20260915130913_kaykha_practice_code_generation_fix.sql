-- Compatibility marker.
-- The repository copy of 20260915130813 already uses gen_random_uuid() for practice codes.
-- Production originally required this hotfix because extensions.gen_random_bytes was outside the function search_path.
select 1;