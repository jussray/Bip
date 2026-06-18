/**
 * utils/supabase/types.ts
 *
 * Hand-maintained lightweight row types that mirror the DB schema.
 * Run `npx supabase gen types typescript --project-id jvmbhralyktmdlvglrxk`
 * to auto-generate a full Database type and replace this file.
 */

export type MoodHistory = {
  user_id: string;
  id: number;
  mood: string;
  date: string;
  time: string;
  created_at: string;
};

export type JournalEntry = {
  user_id: string;
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
  sekret_reply?: string | null;
  created_at: string;
};

export type CirclePost = {
  user_id: string;
  id: number;
  text: string;
  date: string;
  time: string;
  reactions: { felt: number; comfort: number; proud: number; stay: number };
  circle_tag?: string | null;
  post_mood?: string | null;
  media_kind?: string | null;
  created_at: string;
};

export type CircleProfile = {
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  account_type: 'teen' | 'parent';
  created_at: string;
  updated_at: string;
};

export type FriendRequest = {
  id: number;
  from_user: string;
  to_user: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
};

export type Friendship = {
  id: number;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
};

export type PublicCirclePost = {
  id: number;
  user_id: string;
  text: string;
  post_mood?: string | null;
  media_kind?: string | null;
  reactions: { felt: number; comfort: number; proud: number; stay: number };
  created_at: string;
};

export type BipPoints = {
  id: number;
  user_id: string;
  total: number;
  captured_at: string;
};

// ─── P8: Bridge signal row ────────────────────────────────────────────────────
// MESSAGE CONTENT IS NEVER STORED. Only metadata (share type, conversation
// mode, char key) is synced so the parent-side can surface a gentle nudge.
export type BridgeSignal = {
  id: number;
  teen_user_id: string;          // RLS: only the teen can insert their own row
  char_key: 'raylene' | 'rylane';
  share_type: string;            // 'mood' | 'thought' | 'need' | 'win'
  conv_mode: string | null;      // 'soft' | 'honest' | 'boundary' | 'safety'
  sent_at: string;               // ISO timestamp
  created_at: string;
};

// ─── P8: Oracle session row ───────────────────────────────────────────────────
// Stores a snapshot of one completed oracle session (question IDs + aggregated
// dimension signals). Full OracleRecord JSON lives in the 'profile_snapshot'
// column for recovery/cross-device sync; individual fields are indexed for
// analytics queries.
export type OracleSession = {
  id: number;
  user_id: string;
  mode: 'teen' | 'parent';
  session_index: number;         // record.sessionCount at time of save
  total_turns: number;           // record.totalTurns
  question_ids: string[];        // array of question IDs answered this session
  dimension_summary: Record<string, number>; // dimension -> signal count
  profile_snapshot: string;      // JSON.stringify(OracleRecord) for full recovery
  completed_at: string;          // ISO timestamp
  created_at: string;
};
