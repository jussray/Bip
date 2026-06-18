/**
 * src/types/index.ts
 *
 * Canonical types (moved from types/index.ts in Step 3).
 * Import via: import type { JournalEntry } from '@/types';
 */

export interface JournalEntry {
  id:           number;
  text:         string;
  mood:         string;
  date:         string;
  time:         string;
  // Extended fields used by PagesScreen, sync, and action handlers
  source?:      string;
  entryMode?:   string;
  moodTag?:     string;
  imageUri?:    string;
  sekretReply?: string;
  locked?:      boolean;
  activeTab?:   string;
}

export interface CirclePost {
  id:   number;
  text: string;
  date: string;
  time: string;
  reactions: {
    felt:    number;
    comfort: number;
    proud:   number;
    stay:    number;
    /** Reaction added by newer screens; optional to keep backward compat. */
    sameHere?: number;
  };
  // Extended fields used by action handlers and sync
  bipType?:   string;
  mediaKind?: string;
  circleTag?: string;
  postMood?:  string;
}

export interface VoiceNote {
  id:       number;
  title:    string;
  date:     string;
  time:     string;
  duration: string;
  /** Media classification added by VoiceBipScreen. */
  type?:    'voice' | 'video' | 'audio';
}

export interface MoodEntry {
  id:   number;
  mood: string;
  date: string;
  time: string;
}

export interface Theme {
  [key: string]: unknown;
  name:       string;
  emoji:      string;
  background: string;
  card:       string;
  accent:     string;
  soft:       string;
  /** Optional feeling descriptor added by RoomScreen. */
  feeling?:   string;
}

export interface SekretProfile {
  name:     string;
  emoji:    string;
  title:    string;
  vibe:     string;
  greeting: string;
}

// Personality IDs — single source of truth
export type PersonalityId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'oracle';

// App screen route keys (legacy string router — kept for type safety during migration)
export type ScreenKey =
  | 'home'
  | 'pages'
  | 'calm'
  | 'circle'
  | 'sekret'
  | 'voiceBip'
  | 'bridge'
  | 'parentBridge'
  | 'cloudThoughts'
  | 'settings'
  | 'discover';

// ─── Types previously missing from this file ─────────────────────────────────
// These were referenced by hooks, store, sync, and several screens.

export interface ParentCirclePost {
  id:        number;
  text:      string;
  date:      string;
  time:      string;
  mood?:     string;
  circleTag?: string;
  reactions: {
    felt?: number;
    comfort?: number;
    proud?: number;
    stay?: number;
    sameHere?: number;
    beenThere?: number;
    solidarity?: number;
    reminder?: number;
    needed?: number;
    strength?: number;
  };
}

export interface ComfortSession {
  id:            number;
  date:          string;
  time:          string;
  durationSecs?: number;
  type:          string;
  mood?:         string;
}

export interface CrewMember {
  id:          string;
  name:        string;
  relation?:   string;
  emoji?:      string;
  commitment?: string;
  cadence?:    string;
  inviteCode?: string;
  addedAt?:    string;
}

export interface CrewCheckIn {
  id:         number;
  memberId:   string;
  date:       string;
  time:       string;
  mood:       string;
  note?:      string;
}

// ─── Bridge payload (re-exported for types/bridge.ts shim) ───────────────────
export interface BridgePayload {
  type:    string;
  payload: unknown;
}
