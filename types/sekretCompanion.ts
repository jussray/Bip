export interface MemorySummary {
  favoriteMood: string;
  favoriteSekret: string;
  commonTopics: string[];
  streakDays: number;
  lastCheckIn: string;
  comfortToolsUsed: string[];
  recurringEmotions: string[];
  recurringStruggles: string[];
  importantMilestones: string[];
  daysActive: number;
  conversations: number;
  journalsWritten: number;
  voiceBips: number;
  comfortActions: number;
}

export interface CompanionLevel {
  level: number;
  title: string;
  progress: number;
  nextLevel: number;
  unlockedGreetings: string[];
  unlockedDepth: string[];
  encouragements: string[];
  personalityResponses: string[];
}

export interface CompanionCheckIn {
  id: string;
  message: string;
  tone: 'gentle' | 'warm' | 'protective';
}

export interface CompanionState {
  memorySummary: MemorySummary;
  companionLevel: CompanionLevel;
  greeting: string;
  presenceMessage: string;
  checkIn: CompanionCheckIn | null;
  lastUpdated: string;
  personality: string;
}

export interface CompanionActivityInput {
  selectedSekret?: string;
  mood?: string;
  journalEntries?: Array<{ id?: string | number; text?: string; mood?: string; date?: string }>;
  moodHistory?: Array<{ id?: string | number; mood?: string; date?: string }>;
  voiceNotes?: Array<{ id?: string | number; title?: string; type?: string; date?: string }>;
  comfortSessions?: Array<{ id?: string | number; type?: string; date?: string }>;
  circlePosts?: Array<{ id?: string | number; text?: string; date?: string }>;
  streakDays?: number;
  lastOpenDate?: string;
  screen?: string;
  isLateNight?: boolean;
  journalText?: string;
}
