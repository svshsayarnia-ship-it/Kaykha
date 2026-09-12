
revoke execute on function public.get_kaykha_credit_profile(uuid) from public, anon;
revoke execute on function public.assign_kaykha_shadow_role(uuid,uuid,text) from public, anon;
revoke execute on function public.get_kaykha_shadow_role(uuid) from public, anon;
revoke execute on function public.create_kaykha_loan(uuid,uuid,integer,integer,integer,text,jsonb) from public, anon;
revoke execute on function public.settle_kaykha_loan(uuid) from public, anon;
grant execute on function public.get_kaykha_credit_profile(uuid) to authenticated;
grant execute on function public.assign_kaykha_shadow_role(uuid,uuid,text) to authenticated;
grant execute on function public.get_kaykha_shadow_role(uuid) to authenticated;
grant execute on function public.create_kaykha_loan(uuid,uuid,integer,integer,integer,text,jsonb) to authenticated;
grant execute on function public.settle_kaykha_loan(uuid) to authenticated;
