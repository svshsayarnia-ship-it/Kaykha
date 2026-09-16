create or replace function app_private.after_invisible_guest_kill()
returns trigger
language plpgsql
security definer
set search_path to 'public','app_private','pg_temp'
as $function$
declare
  v_traitor uuid;
  v_target_owner uuid;
  v_target_territory text;
  v_contract uuid;
begin
  if old.phase='orders' and new.phase='negotiation' and new.round_no=old.round_no+1
    and new.mode='invisible_guest' then
    select member_id into v_traitor
    from app_private.kaykha_hidden_roles
    where game_id=new.id and role_key='invisible_guest';

    if v_traitor is not null then
      select r.target_member_id,r.target_territory_id
        into v_target_owner,v_target_territory
      from app_private.kaykha_round_effects r
      where r.game_id=new.id
        and r.round_no=old.round_no
        and r.rule_key='order.sabotage.success'
        and r.source_member_id=v_traitor
      order by r.applied_at,r.id
      limit 1;

      if v_target_owner is not null then
        select c.id into v_contract
        from public.kaykha_contracts c
        where c.game_id=new.id and c.contract_type='treaty' and c.status='active'
          and (c.creator_member_id=v_target_owner or c.counterparty_member_id=v_target_owner)
        order by c.created_at,c.id limit 1 for update;

        if v_contract is not null then
          update public.kaykha_contracts
             set status='broken',resolved_at=now()
           where id=v_contract;

          perform app_private.record_kaykha_effect(
            new.id,old.round_no,'mode.invisible_guest',v_traitor,v_target_owner,v_target_territory,
            jsonb_build_object('effect','silent_kill','broken_contract_id',v_contract,'requires_successful_sabotage',true)
          );

          insert into public.kaykha_events(game_id,round_no,tone,body)
          values(new.id,old.round_no,'shadow','یک خرابکاری موفق، پیمانی رسمی را بی‌صدا پاره کرد؛ هیچ نامی پای این خنجر نبود.');
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$function$;
