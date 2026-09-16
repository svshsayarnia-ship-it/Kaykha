insert into public.kaykha_rule_catalog(rule_key,scope,subject_key,title,summary,timing,effect_spec,enabled,revision)
values
('order.raid.success','system','raid','غارت موفق','ثبت نتیجه قطعی فرمان غارت برای مصرف سایر Resolverها.','resolution',jsonb_build_object('kind','order_outcome','order_type','raid','outcome','success'),true,1),
('order.sabotage.success','system','sabotage','خرابکاری موفق','ثبت نتیجه قطعی فرمان خرابکاری برای مصرف سایر Resolverها.','resolution',jsonb_build_object('kind','order_outcome','order_type','sabotage','outcome','success'),true,1)
on conflict(rule_key) do update set
  scope=excluded.scope,
  subject_key=excluded.subject_key,
  title=excluded.title,
  summary=excluded.summary,
  timing=excluded.timing,
  effect_spec=excluded.effect_spec,
  enabled=true,
  revision=greatest(public.kaykha_rule_catalog.revision,excluded.revision),
  updated_at=now();
