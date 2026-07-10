-- Se'kret Bip — close parent_links direct-write trust-boundary gap
--
-- parent_links_insert/_update (0004_supplemental_tables.sql) only constrain
-- teen_user_id/ownership via `with check`/`using` — neither restricts the
-- security-relevant columns (status, parent_user_id, is_active, invite_code).
-- A teen's own JWT can therefore call the Supabase REST API directly to:
--   * INSERT a parent_links row with status='active', parent_user_id=<anyone>,
--     skipping the invite-code flow entirely, or
--   * UPDATE their own pending row to the same effect,
-- bypassing the two-party consent implemented in create_parent_link_invite() /
-- redeem_parent_link_invite() / revoke_parent_link() (all SECURITY DEFINER,
-- 20260630003000_reconcile_parent_link_contract.sql,
-- 20260707022000_revoke_parent_link.sql).
--
-- Those three functions run as their owner and so are unaffected by revoking
-- table grants from `authenticated` (same pattern already used for
-- account_verification in 20260630001000_account_verification_parent_approval.sql).
-- Verified no client code performs a direct insert/update/delete on
-- parent_links (src/utils/parentLink.ts, supabase/functions/send-push,
-- supabase/functions/safety-scan all only .select()) — this is safe to lock
-- down without behavior change.

begin;

revoke insert, update, delete on public.parent_links from authenticated;

commit;
