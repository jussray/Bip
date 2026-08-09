begin;

-- Forward-only cleanup for documented live catalog drift.
-- The current application writes canonical activity to public.bip_events,
-- whose reviewed award path is public.handle_bip_event_points(). The older
-- public.activity_events trigger remains in production history but no longer
-- has a current client producer and must not survive a fresh canonical replay.
--
-- This migration is intentionally unapplied while PR #760 is HOLD. It changes
-- no user rows and drops no ledger/history table.
drop trigger if exists activity_events_award_points on public.activity_events;
drop function if exists public.award_points_for_app_activity();

commit;
