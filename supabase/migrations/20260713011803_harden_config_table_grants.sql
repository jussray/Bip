-- Harden server-owned application configuration tables.
--
-- Both tables already have RLS enabled and intentionally have no client
-- policies. Revoke broad Data API role privileges so their server-only intent
-- does not depend solely on the continued absence of policies.
--
-- This migration does not modify rows, add policies, or expose configuration.

alter table public.app_config enable row level security;
alter table public.app_private_config enable row level security;

revoke all privileges
  on table public.app_config, public.app_private_config
  from public, anon, authenticated;

grant all privileges
  on table public.app_config, public.app_private_config
  to service_role;

comment on table public.app_config is
  'Server-owned application configuration. Client roles have no table privileges and no RLS policies.';

comment on table public.app_private_config is
  'Server-owned private application configuration. Client roles have no table privileges and no RLS policies.';
