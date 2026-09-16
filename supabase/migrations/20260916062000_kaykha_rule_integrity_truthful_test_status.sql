-- Registry coverage is not the same as automated verification.
-- Reset optimistic test flags and expose coverage/test status separately.

update app_private.kaykha_rule_implementation_registry
set tested=false,updated_at=now();

create or replace function public.get_kaykha_rule_integrity()
returns jsonb
language sql
security definer
set search_path=public,app_private,pg_temp
as $$
with expected_families(name) as (values
 ('هخامنشیان'),('وراز'),('نهابد'),('طاهریان'),('صفاریان'),('آل‌بویه'),('اسپینداد'),('اشکانیان'),
 ('باوندیان'),('زیاریان'),('زیک'),('ساسانیان'),('سامانیان'),('سورن'),('کارن'),('مهران')
), expected_personas(name) as (values
 ('اسپهبد'),('بزرگ‌فرمادار'),('چشم شاه'),('رئیس‌التجار'),('دهقان'),('مغ اعظم'),
 ('عیار'),('عطّار'),('خواب‌گزار'),('پیر کوهستان'),('پرده‌خوان'),('قلندر')
), relevant as (
 select * from public.kaykha_rule_catalog where enabled and scope in ('family','persona_light','persona_shadow')
), missing_family as (
 select e.name from expected_families e left join relevant r on r.scope='family' and r.subject_key=e.name where r.rule_key is null
), missing_persona_light as (
 select e.name from expected_personas e left join relevant r on r.scope='persona_light' and r.subject_key=e.name where r.rule_key is null
), missing_persona_shadow as (
 select e.name from expected_personas e left join relevant r on r.scope='persona_shadow' and r.subject_key=e.name where r.rule_key is null
), missing_registry as (
 select r.rule_key from relevant r left join app_private.kaykha_rule_implementation_registry i on i.rule_key=r.rule_key where i.rule_key is null
), counts as (
 select
  (select count(*) from relevant)::integer as expected_count,
  (select count(*) from relevant r join app_private.kaykha_rule_implementation_registry i on i.rule_key=r.rule_key)::integer as registered_count,
  (select count(*) from relevant r join app_private.kaykha_rule_implementation_registry i on i.rule_key=r.rule_key where i.tested)::integer as verified_count
)
select jsonb_build_object(
 'families_expected',16,
 'families_active',(select count(*) from relevant where scope='family'),
 'persona_archetypes_expected',12,
 'persona_light_active',(select count(*) from relevant where scope='persona_light'),
 'persona_shadow_active',(select count(*) from relevant where scope='persona_shadow'),
 'implementation_registry_count',(select registered_count from counts),
 'verified_test_count',(select verified_count from counts),
 'catalog_complete',not exists(select 1 from missing_family) and not exists(select 1 from missing_persona_light) and not exists(select 1 from missing_persona_shadow) and not exists(select 1 from missing_registry),
 'fully_tested',(select verified_count=expected_count and expected_count>0 from counts),
 'missing_families',coalesce((select jsonb_agg(name) from missing_family),'[]'::jsonb),
 'missing_persona_light',coalesce((select jsonb_agg(name) from missing_persona_light),'[]'::jsonb),
 'missing_persona_shadow',coalesce((select jsonb_agg(name) from missing_persona_shadow),'[]'::jsonb),
 'missing_implementations',coalesce((select jsonb_agg(rule_key) from missing_registry),'[]'::jsonb),
 'ok',not exists(select 1 from missing_family) and not exists(select 1 from missing_persona_light) and not exists(select 1 from missing_persona_shadow) and not exists(select 1 from missing_registry)
);
$$;
revoke all on function public.get_kaykha_rule_integrity() from public,anon;
grant execute on function public.get_kaykha_rule_integrity() to authenticated;