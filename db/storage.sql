-- ───────────────────────────────────────────────────────────────────────────
-- Se'kret Bip — Supabase Storage buckets + policies
-- ───────────────────────────────────────────────────────────────────────────
-- Apply after schema.sql. Buckets are private (public = false).
-- All object policies enforce user-scoped folders:
--   storage path must be: <auth.uid()>/<filename>
-- ───────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public) values
  ('voice-notes',    'voice-notes',    false),
  ('journal-images', 'journal-images', false),
  ('avatar-uploads', 'avatar-uploads', false)
on conflict (id) do update set public = excluded.public;

-- ── voice-notes ────────────────────────────────────────────────────────────
drop policy if exists "voice-notes select" on storage.objects;
create policy "voice-notes select"
  on storage.objects for select
  using (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice-notes insert" on storage.objects;
create policy "voice-notes insert"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice-notes update" on storage.objects;
create policy "voice-notes update"
  on storage.objects for update
  using (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice-notes delete" on storage.objects;
create policy "voice-notes delete"
  on storage.objects for delete
  using (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── journal-images ─────────────────────────────────────────────────────────
drop policy if exists "journal-images select" on storage.objects;
create policy "journal-images select"
  on storage.objects for select
  using (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal-images insert" on storage.objects;
create policy "journal-images insert"
  on storage.objects for insert
  with check (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal-images update" on storage.objects;
create policy "journal-images update"
  on storage.objects for update
  using (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal-images delete" on storage.objects;
create policy "journal-images delete"
  on storage.objects for delete
  using (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── avatar-uploads ─────────────────────────────────────────────────────────
drop policy if exists "avatar-uploads select" on storage.objects;
create policy "avatar-uploads select"
  on storage.objects for select
  using (
    bucket_id = 'avatar-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar-uploads insert" on storage.objects;
create policy "avatar-uploads insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatar-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar-uploads update" on storage.objects;
create policy "avatar-uploads update"
  on storage.objects for update
  using (
    bucket_id = 'avatar-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatar-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar-uploads delete" on storage.objects;
create policy "avatar-uploads delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatar-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
