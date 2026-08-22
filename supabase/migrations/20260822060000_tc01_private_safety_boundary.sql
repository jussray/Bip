-- TC-01: private or mixed-visibility child writing must not automatically enter
-- the safety-scan pipeline. Public-only content may retain automatic scanning.
--
-- Barrier A removes ingress from confirmed private/mixed-capability sources:
--   journal_entries  owner-only private journal
--   circle_posts     owner-only legacy circle content
--   posts            unified public/friends/crew content, so source type alone
--                    cannot prove the row is public
--
-- Barrier B in the Edge Function independently rejects every source except the
-- explicitly allowlisted public_circle_posts source.

DROP TRIGGER IF EXISTS safety_scan_journal ON public.journal_entries;
DROP TRIGGER IF EXISTS safety_scan_circle ON public.circle_posts;
DROP TRIGGER IF EXISTS safety_scan_posts ON public.posts;

COMMENT ON COLUMN public.journal_entries.safety_flagged IS
  'Legacy safety marker. TC-01 forbids automatic safety scanning of private journal_entries.';
COMMENT ON COLUMN public.circle_posts.safety_flagged IS
  'Legacy safety marker. TC-01 forbids automatic safety scanning of owner-only circle_posts.';
COMMENT ON COLUMN public.posts.safety_flagged IS
  'Legacy safety marker. TC-01 forbids automatic scanning when source visibility cannot be proven public.';
