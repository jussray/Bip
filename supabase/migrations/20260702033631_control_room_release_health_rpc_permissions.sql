revoke all on function public.refresh_control_room_release_health(text) from public;
revoke all on function public.refresh_control_room_release_health(text) from anon;
revoke all on function public.refresh_control_room_release_health(text) from authenticated;
grant execute on function public.refresh_control_room_release_health(text) to service_role;
