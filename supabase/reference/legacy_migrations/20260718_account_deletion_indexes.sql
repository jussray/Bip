-- Legacy local-only migration preserved from the active migration chain.
-- Production migration history has no recorded migration containing these indexes.
-- Reintroduce only through a separately reviewed, uniquely versioned migration if still needed.

CREATE INDEX IF NOT EXISTS idx_messages_user_id
  ON messages (user_id);

CREATE INDEX IF NOT EXISTS idx_companion_memories_user_id
  ON companion_memories (user_id);

CREATE INDEX IF NOT EXISTS idx_companion_sessions_user_id
  ON companion_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id
  ON journal_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id
  ON user_rewards (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_circle_members_user_id
  ON circle_members (user_id);
