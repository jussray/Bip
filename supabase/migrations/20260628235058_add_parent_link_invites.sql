begin;

-- Reconstruct the connector-applied parent-link compatibility layer recorded
-- in the canonical production migration ledger as
-- 20260628235058_add_parent_link_invites.
--
-- Historical repository sources diverged before this point:
-- - 0003 created invite_code/status/expires_at but not the older is_active /
--   quiet-hours shape;
-- - the preserved full bootstrap created is_active/quiet-hours/updated_at but
--   did not contain the invite lifecycle fields.
--
-- Production contains the combined shape. Keep this migration additive and
-- idempotent so a fresh replay converges without rewriting either historical
-- foundation source.
alter table public.parent_links
  add column if not exists is_active boolean not null default true,
  add column if not exists quiet_hours_start time,
  add column if not exists quiet_hours_end time,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists invite_code text,
  add column if not exists status text not null default 'pending',
  add column if not exists expires_at timestamptz;

-- An invite may exist before a parent accepts it, so parent_user_id must be
-- nullable during the pending state. This matches the live production shape.
alter table public.parent_links
  alter column parent_user_id drop not null;

create index if not exists idx_parent_links_parent
  on public.parent_links(parent_user_id);
create index if not exists idx_parent_links_teen
  on public.parent_links(teen_user_id);

commit;
