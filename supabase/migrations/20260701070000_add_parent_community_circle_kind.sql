-- 20260701070000_add_parent_community_circle_kind.sql
-- Se'kret Bip — Circle V2 parent community enum value
--
-- This migration intentionally only adds the enum value. PostgreSQL requires a
-- new enum label to be committed before it is safely used by constraints,
-- policies, or functions in a later migration.

alter type public.circle_kind add value if not exists 'parent_community';
