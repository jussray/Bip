export interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
  source?: string; // 'me' | 'oracle' | 'raylene' | 'rylane' | 'cloud' — undefined treated as 'me'
}

export interface CirclePost {
  id: number;
  text: string;
  date: string;
  time: string;
  reactions: {
    felt: number;
    comfort: number;
    proud: number;
    stay: number;
  };
}

export interface VoiceNote {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  type?: string;
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
