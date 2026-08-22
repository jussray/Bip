-- Se'kret Bip Trust Contract v1
--
-- Private journal writes are not safety actions.
-- Remove only the automatic journal -> safety-scan trigger so a private
-- reflection cannot enter the privileged moderation/escalation pipeline merely
-- by being saved.
--
-- Public/social content scanning is intentionally unchanged here. Those paths
-- have different audience/visibility semantics and require their own review.

DROP TRIGGER IF EXISTS safety_scan_journal ON public.journal_entries;
