-- Canonical production-schema witness consumed by release verification.
--
-- This marker is intentionally written only when the ordered migration chain
-- reaches this point. GitHub's production verifier reads it through Supabase's
-- read-only Management API and refuses to call a release verified unless both
-- this migration and the marker are present in the live project.

insert into public.runtime_contract_versions (contract_key, version, applied_at)
values ('production_schema', '20260811132900', now())
on conflict (contract_key) do update
set version = excluded.version,
    applied_at = excluded.applied_at;
