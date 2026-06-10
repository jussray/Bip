import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CompanionActivityInput, MemorySummary } from '../types/sekretCompanion';

type MemoryRecord = {
  sourceId?: string;
  date?: string;
};

export type MoodMemory = MemoryRecord & { mood?: string };
export type JournalMemory = MemoryRecord & { mood?: string; topics?: string[] };
export type VoiceBipMemory = MemoryRecord & { title?: string; type?: string };
export type ComfortMemory = MemoryRecord & { type?: string };

export interface SekretMemory {
  moodHistory: MoodMemory[];
  journalActivity: JournalMemory[];
  voiceBips: VoiceBipMemory[];
  comfortUsage: ComfortMemory[];
  streaks: {
    current: number;
    longest: number;
    lastUpdated?: string;
  };
  selectedPersonality: string;
  lastCheckIn?: string;
  lastActiveAt?: string;
  recurringTopics: string[];
  lastUpdated: string;
}

export const SEKRET_MEMORY_STORAGE_KEY = 'sekret_companion_memory';

const LEGACY_ACTIVITY_KEYS = ['moodHistory', 'entries', 'voiceNotes', 'comfortSessions'] as const;
const TOPIC_WORDS = [
  'school', 'friends', 'friendship', 'family', 'stress', 'sleep', 'body', 'heart',
  'future', 'home', 'work', 'love', 'money', 'grades', 'identity', 'peace', 'rest',
  'comfort', 'voice', 'circle', 'confidence', 'lonely', 'overthinking', 'relationship',
] as const;
const MAX_ACTIVITY_ITEMS = 60;

export const DEFAULT_SEKRET_MEMORY: SekretMemory = {
  moodHistory: [],
  journalActivity: [],
  voiceBips: [],
  comfortUsage: [],
  streaks: { current: 0, longest: 0, lastUpdated: '' },
  selectedPersonality: 'soft',
  lastCheckIn: '',
  lastActiveAt: '',
  recurringTopics: [],
  lastUpdated: '',
};

function safeArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function parseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    return safeArray(JSON.parse(raw));
  } catch {
    return [];
  }
}

function sourceId(value: any, fallback: string): string {
  return String(value?.id ?? fallback);
}

function normalizeDate(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function extractTopics(text?: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  return TOPIC_WORDS.filter((topic) => normalized.includes(topic));
}

function normalizeTopics(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.toLowerCase().trim())))
    .slice(0, 6);
}

function mergeUnique<T extends MemoryRecord>(existing: T[], incoming: T[]): T[] {
  const records = new Map<string, T>();
  [...existing, ...incoming].forEach((record, index) => {
    const key = record.sourceId || `${record.date || 'undated'}:${JSON.stringify(record)}:${index}`;
    records.set(key, { ...records.get(key), ...record });
  });
  return Array.from(records.values()).slice(-MAX_ACTIVITY_ITEMS);
}

function countMostCommon(values: Array<string | undefined>, fallback: string): string {
  const counts = values.reduce<Record<string, number>>((all, value) => {
    if (value) all[value] = (all[value] || 0) + 1;
    return all;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function activityFromInput(input: CompanionActivityInput) {
  const moodHistory = safeArray(input.moodHistory).map((entry, index): MoodMemory => ({
    sourceId: sourceId(entry, `mood:${entry?.date || index}:${entry?.mood || ''}`),
    mood: entry?.mood,
    date: normalizeDate(entry?.date),
  }));
  const journalActivity = safeArray(input.journalEntries).map((entry, index): JournalMemory => ({
    sourceId: sourceId(entry, `journal:${entry?.date || index}:${entry?.text || ''}`),
    mood: entry?.mood,
    date: normalizeDate(entry?.date),
    topics: extractTopics(entry?.text),
  }));
  const voiceBips = safeArray(input.voiceNotes).map((entry, index): VoiceBipMemory => ({
    sourceId: sourceId(entry, `voice:${entry?.date || index}:${entry?.title || ''}`),
    title: entry?.title,
    type: entry?.type,
    date: normalizeDate(entry?.date),
  }));
  const comfortUsage = safeArray(input.comfortSessions).map((entry, index): ComfortMemory => ({
    sourceId: sourceId(entry, `comfort:${entry?.date || index}:${entry?.type || ''}`),
    type: entry?.type,
    date: normalizeDate(entry?.date),
  }));
  const recurringTopics = normalizeTopics([
    ...journalActivity.flatMap((entry) => entry.topics || []),
    ...safeArray(input.circlePosts).flatMap((post) => extractTopics(post?.text)),
  ]);
  return { moodHistory, journalActivity, voiceBips, comfortUsage, recurringTopics };
}

function normalizeMemory(value: Partial<SekretMemory> | undefined): SekretMemory {
  return {
    ...DEFAULT_SEKRET_MEMORY,
    ...value,
    moodHistory: safeArray(value?.moodHistory),
    journalActivity: safeArray(value?.journalActivity),
    voiceBips: safeArray(value?.voiceBips),
    comfortUsage: safeArray(value?.comfortUsage),
    streaks: {
      current: Math.max(0, Number(value?.streaks?.current) || 0),
      longest: Math.max(0, Number(value?.streaks?.longest) || 0),
      lastUpdated: value?.streaks?.lastUpdated || '',
    },
    recurringTopics: normalizeTopics(value?.recurringTopics || []),
  };
}

export async function loadSekretMemory(): Promise<SekretMemory> {
  try {
    const values = await AsyncStorage.multiGet([SEKRET_MEMORY_STORAGE_KEY, ...LEGACY_ACTIVITY_KEYS]);
    const byKey = Object.fromEntries(values);
    const stored = byKey[SEKRET_MEMORY_STORAGE_KEY]
      ? normalizeMemory(JSON.parse(byKey[SEKRET_MEMORY_STORAGE_KEY] as string) as Partial<SekretMemory>)
      : normalizeMemory(undefined);

    // Existing app activity remains canonical. We only copy compact metadata into companion memory.
    const legacyInput: CompanionActivityInput = {
      moodHistory: parseArray(byKey.moodHistory),
      journalEntries: parseArray(byKey.entries),
      voiceNotes: parseArray(byKey.voiceNotes),
      comfortSessions: parseArray(byKey.comfortSessions),
    };
    const legacy = activityFromInput(legacyInput);
    return {
      ...stored,
      moodHistory: mergeUnique(stored.moodHistory, legacy.moodHistory),
      journalActivity: mergeUnique(stored.journalActivity, legacy.journalActivity),
      voiceBips: mergeUnique(stored.voiceBips, legacy.voiceBips),
      comfortUsage: mergeUnique(stored.comfortUsage, legacy.comfortUsage),
      recurringTopics: normalizeTopics([...stored.recurringTopics, ...legacy.recurringTopics]),
    };
  } catch (error) {
    console.warn('Unable to load Sekret memory', error);
    return normalizeMemory(undefined);
  }
}

export async function saveSekretMemory(memory: SekretMemory): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SEKRET_MEMORY_STORAGE_KEY, JSON.stringify(normalizeMemory(memory)));
    return true;
  } catch (error) {
    console.warn('Unable to save Sekret memory', error);
    return false;
  }
}

export async function updateSekretMemory(
  input: CompanionActivityInput,
  previous?: SekretMemory,
): Promise<SekretMemory> {
  const base = normalizeMemory(previous || await loadSekretMemory());
  const activity = activityFromInput(input);
  const now = new Date().toISOString();
  const currentStreak = Math.max(0, input.streakDays ?? base.streaks.current);
  const next: SekretMemory = {
    ...base,
    moodHistory: mergeUnique(base.moodHistory, activity.moodHistory),
    journalActivity: mergeUnique(base.journalActivity, activity.journalActivity),
    voiceBips: mergeUnique(base.voiceBips, activity.voiceBips),
    comfortUsage: mergeUnique(base.comfortUsage, activity.comfortUsage),
    streaks: {
      current: currentStreak,
      longest: Math.max(base.streaks.longest, currentStreak),
      lastUpdated: input.lastOpenDate || base.streaks.lastUpdated || now,
    },
    selectedPersonality: input.selectedSekret || base.selectedPersonality || 'soft',
    lastActiveAt: input.lastOpenDate || base.lastActiveAt || now,
    recurringTopics: normalizeTopics([...activity.recurringTopics, ...base.recurringTopics]),
    lastUpdated: now,
  };
  await saveSekretMemory(next);
  return next;
}

export function summarizeSekretMemory(memory: SekretMemory): MemorySummary {
  const normalized = normalizeMemory(memory);
  const moods = normalized.moodHistory.map((entry) => entry.mood).filter(Boolean) as string[];
  const moodCounts = moods.reduce<Record<string, number>>((all, mood) => {
    all[mood] = (all[mood] || 0) + 1;
    return all;
  }, {});
  const recurringEmotions = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 1)
    .map(([mood]) => mood)
    .slice(0, 6);
  const comfortTools = normalizeTopics(normalized.comfortUsage.map((entry) => entry.type));
  const activityDates = new Set([
    ...normalized.moodHistory, ...normalized.journalActivity,
    ...normalized.voiceBips, ...normalized.comfortUsage,
  ].map((entry) => entry.date).filter(Boolean));

  return {
    favoriteMood: countMostCommon(moods, 'Thoughtful'),
    favoriteSekret: normalized.selectedPersonality || 'soft',
    commonTopics: normalized.recurringTopics,
    streakDays: normalized.streaks.current,
    lastCheckIn: normalized.lastCheckIn || '',
    comfortToolsUsed: comfortTools,
    recurringEmotions,
    recurringStruggles: normalized.recurringTopics.slice(0, 4),
    importantMilestones: [
      ...(normalized.streaks.longest >= 2 ? [`${normalized.streaks.longest}-day streak`] : []),
      ...(normalized.journalActivity.length ? ['first page written'] : []),
      ...(normalized.voiceBips.length ? ['first voice bip'] : []),
      ...(normalized.comfortUsage.length ? ['comfort found'] : []),
    ].slice(0, 4),
    daysActive: Math.max(activityDates.size, normalized.streaks.longest),
    conversations: normalized.moodHistory.length + normalized.journalActivity.length + normalized.voiceBips.length,
    journalsWritten: normalized.journalActivity.length,
    voiceBips: normalized.voiceBips.length,
    comfortActions: normalized.comfortUsage.length,
  };
}
