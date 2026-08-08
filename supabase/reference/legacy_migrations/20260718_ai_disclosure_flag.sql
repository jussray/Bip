-- Legacy local-only migration preserved from the active migration chain.
-- Production migration history has no recorded migration containing this column change.
-- Reintroduce only through a separately reviewed, uniquely versioned migration if still needed.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_disclosure_accepted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.ai_disclosure_accepted_at IS
  'Timestamp when the user accepted the AI companion disclosure modal. NULL = not yet shown. Apple App Store §2.5.16 requirement.';
