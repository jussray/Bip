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

// ─── P8: Oracle row types ────────────────────────────────────────────────────

// oracle_records: upsert snapshot keyed on (user_id, mode).
export type OracleRecord_Row = {
  user_id: string;
  mode: 'teen' | 'parent';
  session_count: number;
  total_turns: number;
  last_session: string | null;
  dimension_summary: Record<string, number>;
  profile_snapshot: string;      // JSON.stringify(OracleRecord)
  updated_at: string;
};

// oracle_session_log: append-only per-session audit rows.
// Named oracle_session_log to avoid conflict with oracle_sessions (0003).
export type OracleSessionLog = {
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

// ─── User Room ────────────────────────────────────────────────────────────────

export type UserRoom = {
  user_id:       string;
  base_room_id:  string;
  lighting_mode: string;
  companion_id:  string;
  room_name:     string;
  placed_items:  unknown[];   // JSON array of PlacedItem
  vibe_overlay:  string;
  room_quote:    string;
  glow_color:    string;
  updated_at:    string;
};
