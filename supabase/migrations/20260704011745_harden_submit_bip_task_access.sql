do $$
begin
  execute 'revoke execute on function public.submit_bip_task(uuid,text,text) from public';
  execute 'revoke execute on function public.submit_bip_task(uuid,text,text) from anon';
  execute 'grant execute on function public.submit_bip_task(uuid,text,text) to authenticated';
end
$$;
