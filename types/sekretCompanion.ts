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
  journalEntries?: Array<{ text?: string; mood?: string; date?: string }>;
  moodHistory?: Array<{ mood?: string }>;
  voiceNotes?: Array<{ title?: string; type?: string }>;
  comfortSessions?: Array<{ type?: string }>;
  circlePosts?: Array<{ text?: string }>;
  streakDays?: number;
  lastOpenDate?: string;
  screen?: string;
  isLateNight?: boolean;
  journalText?: string;
}
