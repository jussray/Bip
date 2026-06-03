// types/bridge.ts
// Se'kret Bip — shared TypeScript types
//
// Import from here — do NOT re-declare these inline in screens.
// ─────────────────────────────────────────────────────────────────────────────

// ── Journal ───────────────────────────────────────────────────────────────────
export interface JournalEntry {
  id:   number;
  text: string;
  mood: string;
  date: string;
  time: string;
}

// ── Circle ────────────────────────────────────────────────────────────────────
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
  };
}

// ── Voice Notes ───────────────────────────────────────────────────────────────
export interface VoiceNote {
  id:       number;
  title:    string;
  date:     string;
  time:     string;
  duration: string;
  type?:    string;   // 'voice' | 'bip' | custom — optional, set by VoiceBipScreen
}

// ── Mood ──────────────────────────────────────────────────────────────────────
export interface MoodEntry {
  id:   number;
  mood: string;
  date: string;
  time: string;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
// Matches the shape of THEME_PACKS values in constants/theme.ts
export interface Theme {
  name:       string;
  emoji:      string;
  background: string;
  card:       string;
  accent:     string;
  soft:       string;
}

// ── Sekret Profile ────────────────────────────────────────────────────────────
// Matches the shape of SEKRET_PROFILES values in constants/theme.ts
export interface SekretProfile {
  name:     string;
  emoji:    string;
  title:    string;
  vibe:     string;
  greeting: string;
}

// ── Bridge Payload ────────────────────────────────────────────────────────────
// Used by BridgeScreen + ParentBridgeScreen + RoomScreen
export type BridgePayload = {
  sharedTitle?:         string;
  preview?:             string;
  mood?:                string;
  moodEmoji?:           string;
  shareTypeLabel?:      string;
  sharedAt?:            string;
  sekretTip?:           string;
  softPrompt?:          string;
  conversationStarter?: string;
  followUp?:            string;
  avoid?:               string[];
  guidance?:            string;
  translation?: {
    said:  string;
    means: string;
  };
};
