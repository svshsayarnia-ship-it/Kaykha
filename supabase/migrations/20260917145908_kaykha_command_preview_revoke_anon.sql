-- Harden the authoritative combat preview RPC so anonymous callers cannot invoke it.
revoke all on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) from public, anon;
grant execute on function public.get_kaykha_command_preview(uuid,text,text,text,jsonb) to authenticated;
