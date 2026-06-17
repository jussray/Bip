export interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
  source?: string; // Legacy/current tab source; undefined is treated as 'me'.
  activeTab?: string;
  moodTag?: string;
  entryMode?: 'typed' | 'voice';
  locked?: boolean;
  imageUri?: string;
  sekretReply?: string;   // Se'kret's saved reply shown below the entry
  sekretTyping?: boolean; // transient — true while reply is being streamed
}

export interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  bipType?: string;
  mediaKind?: string;
  anonymousName?: string;
  circleTag?: string;
  postMood?: string;
  quietRepliesCount?: number;
  reactions: {
    felt: number;
    comfort: number;
    proud: number;
    stay: number;
    sameHere?: number;
  };
}

export interface ParentCirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  circleTag?: string;
  anonymousName?: string;
  quietRepliesCount?: number;
  reactions: {
    beenThere: number;
    solidarity: number;
    reminder: number;
    needed: number;
    strength: number;
  };
}

export interface VoiceNote {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  type?: string;
  avatarKey?: string;     // which Se'kret avatar recorded / responded
  transcriptId?: string;  // reference to the Supabase transcript row
}

export interface MoodEntry {
  id: number;
  mood: string;
  date: string;
  time: string;
}

export interface ComfortSession {
  id: number;
  type: 'comfort' | 'calm' | 'voice' | 'journal' | 'growth' | 'mood';
  date: string;
  time: string;
  mood?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  emoji: string;            // soft picker, no profile pics
  commitment: string;       // "text me when you spiral", "daily check-in", etc.
  cadence: 'daily' | 'weekly' | 'whenever';
  inviteCode: string;       // local placeholder until Supabase
  addedAt: string;          // ISO
}

export interface CrewCheckIn {
  id: number;
  memberId: number;
  note: string;             // short, soft
  mood?: string;
  date: string;
  time: string;
}

export interface Theme {
  name: string;
  emoji: string;
  background: string;
  card: string;
  accent: string;
  soft: string;
}

export interface SekretProfile {
  name: string;
  emoji: string;
  title: string;
  vibe: string;
  greeting: string;
}

export interface BridgePayload {
  shareTypeLabel?: string;
  preview?:        string;
  mood?:           string;
  moodEmoji?:      string;
  sharedAt?:       string;
  sekretTip?:      string;
  softPrompt?:     string;
  conversationStarter?: string;
  followUp?:       string;
  avoid?:          string[];
  guidance?:       string;
  translation?:    { said: string; means: string };
}
