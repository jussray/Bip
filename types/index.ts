export interface JournalEntry {
  id: number;
  text: string;
  mood: string;
  date: string;
  time: string;
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
}

export interface MoodEntry {
  id: number;
  mood: string;
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
