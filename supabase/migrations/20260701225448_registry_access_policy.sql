create policy registry_access on "public"."control_room_fingerprints" using (public.is_founder());
