import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CompanionActivityInput, MemorySummary } from '../types/sekretCompanion';

export interface SekretMemory {
  moodHistory: Array<{ mood?: string; date?: string }>;
  journalActivity: Array<{ text?: string; date?: string; mood?: string }>;
  voiceBips: Array<{ title?: string; type?: string; date?: string }>;
  comfortUsage: Array<{ type?: string; date?: string }>;
  streaks: {
    current: number;
    longest: number;
    lastUpdated?: string;
  };
  selectedPersonality: string;
  lastCheckIn?: string;
  recurringTopics: string[];
  lastUpdated: string;
}

export const SEKRET_MEMORY_STORAGE_KEY = 'sekret_companion_memory';

export const DEFAULT_SEKRET_MEMORY: SekretMemory = {
  moodHistory: [],
  journalActivity: [],
  voiceBips: [],
  comfortUsage: [],
  streaks: {
    current: 0,
    longest: 0,
    lastUpdated: '',
  },
  selectedPersonality: 'soft',
  lastCheckIn: 'We’re checking in.',
  recurringTopics: ['rest'],
  lastUpdated: '',
};

function normalizeTopics(values: Array<string | undefined>): string[] {
  const normalized = values
    .filter(Boolean)
    .map((value) => value?.toLowerCase().trim())
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(normalized)).slice(0, 6);
}

function buildTopics(input: CompanionActivityInput, fallback: string[] = []): string[] {
  const journalTopics = (input.journalEntries || [])
    .map((entry) => entry.text)
    .join(' ')
    .toLowerCase()
    .match(/\b(about|school|friends|family|anxiety|stress|sleep|body|heart|future|home|work|love|money|grades|boys|girls|identity|peace|rest|comfort|voice|circle)\b/g) || [];

  const circleTopics = (input.circlePosts || [])
    .map((post) => post.text)
    .join(' ')
    .toLowerCase()
    .match(/\b(school|friends|family|anxiety|stress|sleep|body|heart|future|home|work|love|money|grades|boys|girls|identity|peace|rest|comfort|voice|circle)\b/g) || [];

  const topics = normalizeTopics([...journalTopics, ...circleTopics, ...fallback]);
  return topics.length ? topics : fallback.length ? fallback : ['rest'];
}

function buildFavoriteMood(input: CompanionActivityInput, memory: SekretMemory) {
  const moods = (input.moodHistory || []).map((entry) => entry.mood).filter(Boolean) as string[];
  const moodHistoryMood = (memory.moodHistory || []).map((entry) => entry.mood).filter(Boolean) as string[];
  const combined = [...moods, ...moodHistoryMood];
  if (!combined.length) return 'Thoughtful';
  const counts = combined.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Thoughtful';
}

export async function loadSekretMemory(): Promise<SekretMemory> {
  try {
    const raw = await AsyncStorage.getItem(SEKRET_MEMORY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SEKRET_MEMORY };

    const parsed = JSON.parse(raw) as Partial<SekretMemory>;
    return {
      ...DEFAULT_SEKRET_MEMORY,
      ...parsed,
      streaks: {
        current: parsed.streaks?.current ?? 0,
        longest: parsed.streaks?.longest ?? 0,
        lastUpdated: parsed.streaks?.lastUpdated ?? '',
      },
      recurringTopics: parsed.recurringTopics?.length ? parsed.recurringTopics : DEFAULT_SEKRET_MEMORY.recurringTopics,
    };
  } catch (error) {
    console.warn('Unable to load Sekret memory', error);
    return { ...DEFAULT_SEKRET_MEMORY };
  }
}

export async function saveSekretMemory(memory: SekretMemory) {
  try {
    await AsyncStorage.setItem(SEKRET_MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch (error) {
    console.warn('Unable to save Sekret memory', error);
  }
}

export async function updateSekretMemory(input: CompanionActivityInput, previous?: SekretMemory) {
  const base = previous || (await loadSekretMemory());
  const moodHistory = [
    ...(base.moodHistory || []),
    ...((input.moodHistory || []).map((entry) => ({ mood: entry.mood, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const journalActivity = [
    ...(base.journalActivity || []),
    ...((input.journalEntries || []).map((entry) => ({ text: entry.text, mood: entry.mood, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const voiceBips = [
    ...(base.voiceBips || []),
    ...((input.voiceNotes || []).map((note) => ({ title: note.title, type: note.type, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const comfortUsage = [
    ...(base.comfortUsage || []),
    ...((input.comfortSessions || []).map((session) => ({ type: session.type, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const streakDays = input.streakDays ?? base.streaks?.current ?? 0;
  const nextMemory: SekretMemory = {
    moodHistory,
    journalActivity,
    voiceBips,
    comfortUsage,
    streaks: {
      current: streakDays,
      longest: Math.max(base.streaks?.longest ?? 0, streakDays),
      lastUpdated: new Date().toISOString(),
    },
    selectedPersonality: input.selectedSekret || base.selectedPersonality || 'soft',
    lastCheckIn: base.lastCheckIn || 'We’re checking in.',
    recurringTopics: buildTopics(input, base.recurringTopics || []),
    lastUpdated: new Date().toISOString(),
  };

  await saveSekretMemory(nextMemory);
  return nextMemory;
}

export function summarizeSekretMemory(memory: SekretMemory, input?: CompanionActivityInput): MemorySummary {
  const resolvedInput = input || {};
  const moodHistory = [
    ...(memory.moodHistory || []),
    ...((resolvedInput.moodHistory || []).map((entry) => ({ mood: entry.mood, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const journalActivity = [
    ...(memory.journalActivity || []),
    ...((resolvedInput.journalEntries || []).map((entry) => ({ text: entry.text, mood: entry.mood, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const voiceBips = [
    ...(memory.voiceBips || []),
    ...((resolvedInput.voiceNotes || []).map((note) => ({ title: note.title, type: note.type, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const comfortUsage = [
    ...(memory.comfortUsage || []),
    ...((resolvedInput.comfortSessions || []).map((session) => ({ type: session.type, date: new Date().toISOString() })) || []),
  ].slice(-24);

  const recurringTopics = buildTopics(resolvedInput, memory.recurringTopics || []);
  const streakDays = resolvedInput.streakDays ?? memory.streaks?.current ?? 0;
  const recurringEmotions = moodHistory.map((entry) => entry.mood).filter(Boolean) as string[];
  const comfortToolsUsed = comfortUsage.map((entry) => entry.type).filter(Boolean) as string[];

  return {
    favoriteMood: buildFavoriteMood(resolvedInput, memory),
    favoriteSekret: memory.selectedPersonality || 'soft',
    commonTopics: recurringTopics,
    streakDays,
    lastCheckIn: memory.lastCheckIn || 'We’re checking in.',
    comfortToolsUsed: Array.from(new Set(comfortToolsUsed)).slice(0, 5),
    recurringEmotions: Array.from(new Set(recurringEmotions)).slice(0, 6),
    recurringStruggles: recurringTopics.length ? recurringTopics : ['rest'],
    importantMilestones: [
      ...(memory.streaks?.longest ? [`${memory.streaks.longest}-day streak`] : []),
      ...(journalActivity.length >= 3 ? ['first pages'] : []),
      ...(voiceBips.length ? ['voice-bip shared'] : []),
      ...(comfortUsage.length ? ['comfort ritual'] : []),
    ].slice(0, 4),
    daysActive: Math.max(memory.streaks?.longest ?? 0, streakDays, journalActivity.length + voiceBips.length + comfortUsage.length),
    conversations: Math.max(1, moodHistory.length + journalActivity.length + voiceBips.length),
    journalsWritten: journalActivity.length,
    voiceBips: voiceBips.length,
    comfortActions: comfortUsage.length,
  };
}
