-- Additive expansion: preserve the original six territories and add the ten visual cities.
create or replace function public.seed_kaykha_extra_cities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence)
  values
    (new.id,'ctesiphon',null,4,5,3),
    (new.id,'hormuz',null,2,6,3),
    (new.id,'shiraz',null,3,5,4),
    (new.id,'bam',null,3,3,3),
    (new.id,'susa',null,3,4,3),
    (new.id,'tabriz',null,4,4,3),
    (new.id,'alamut',null,2,3,5),
    (new.id,'balkh',null,3,4,3),
    (new.id,'gambroon',null,2,5,4),
    (new.id,'yazd',null,3,4,4)
  on conflict (game_id,territory_id) do nothing;
  return new;
end;
$$;

drop trigger if exists kaykha_seed_extra_cities_trigger on public.kaykha_games;
create trigger kaykha_seed_extra_cities_trigger
after insert on public.kaykha_games
for each row execute function public.seed_kaykha_extra_cities();

insert into public.kaykha_territories(game_id,territory_id,owner_member_id,strength,economy,influence)
select g.id, c.territory_id, null, c.strength, c.economy, c.influence
from public.kaykha_games g
cross join (values
  ('ctesiphon',4,5,3),('hormuz',2,6,3),('shiraz',3,5,4),
  ('bam',3,3,3),('susa',3,4,3),('tabriz',4,4,3),
  ('alamut',2,3,5),('balkh',3,4,3),('gambroon',2,5,4),('yazd',3,4,4)
) as c(territory_id,strength,economy,influence)
where not exists (
  select 1 from public.kaykha_territories t
  where t.game_id=g.id and t.territory_id=c.territory_id
);