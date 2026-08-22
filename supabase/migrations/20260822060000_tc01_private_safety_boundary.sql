-- TC-01: private writing must not automatically enter the safety-scan pipeline.
-- Barrier A removes the confirmed journal_entries ingress. Mixed/private-capable
-- sources are rejected again by the Edge Function allowlist (Barrier B).

DROP TRIGGER IF EXISTS safety_scan_journal ON public.journal_entries;

-- Defensive invariant: future migrations must not restore an automatic journal
-- trigger without an explicit Trust Contract review and replacement migration.
COMMENT ON COLUMN public.journal_entries.safety_flagged IS
  'Legacy safety marker. TC-01 forbids automatic safety scanning of private journal_entries.';
