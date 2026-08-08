do $$
begin
  execute 'revoke execute on function public.apply_inactivity_point_adjustment() from public';
  execute 'revoke execute on function public.apply_inactivity_point_adjustment() from anon';
  execute 'grant execute on function public.apply_inactivity_point_adjustment() to authenticated';
end
$$;
