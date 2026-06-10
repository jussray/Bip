import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CompanionActivityInput,
  CompanionCheckIn,
  CompanionLevel,
  CompanionState,
  MemorySummary,
} from '../types/sekretCompanion';

const STORAGE_KEY = 'sekret_companion_state';

const PERSONALITY_LABELS: Record<string, string> = {
  soft: "Raylene",
  rylane: 'Rylane',
  cloud: "Cloud Se'kret",
  night: 'Night Se\'kret',
};

const DEFAULT_MEMORY_SUMMARY: MemorySummary = {
  favoriteMood: 'Thoughtful',
  favoriteSekret: "Raylene",
  commonTopics: ['breathing', 'rest'],
  streakDays: 0,
  lastCheckIn: 'Just met you.',
  comfortToolsUsed: ['breath', 'rest'],
  recurringEmotions: ['calm'],
  recurringStruggles: ['overthinking'],
  importantMilestones: ['First check-in'],
  daysActive: 0,
  conversations: 0,
  journalsWritten: 0,
  voiceBips: 0,
  comfortActions: 0,
};

const DEFAULT_COMPANION_LEVEL: CompanionLevel = {
  level: 1,
  title: 'First hello',
  progress: 0,
  nextLevel: 8,
  unlockedGreetings: ['Hey, I’m here.'],
  unlockedDepth: ['soft check-ins'],
  encouragements: ['You’re doing enough.'],
  personalityResponses: ['gentle comfort'],
};

export const DEFAULT_COMPANION_STATE: CompanionState = {
  memorySummary: DEFAULT_MEMORY_SUMMARY,
  companionLevel: DEFAULT_COMPANION_LEVEL,
  greeting: 'Hey, I’m here with you.',
  presenceMessage: 'I’m here with you. No rush.',
  checkIn: null,
  lastUpdated: '',
  personality: "Raylene",
};

function normalizeTopics(values: Array<string | undefined>): string[] {
  const normalized = values
    .filter(Boolean)
    .map((value) => value?.toLowerCase().trim())
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(normalized)).slice(0, 6);
}

function mostFrequent(values: string[], fallback: string) {
  if (!values.length) return fallback;
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function selectFavoriteMood(input: CompanionActivityInput, fallback: string) {
  const moods = (input.moodHistory || []).map((entry) => entry.mood).filter(Boolean) as string[];
  if (moods.length) {
    return mostFrequent(moods, fallback);
  }
  return input.mood || fallback;
}

function buildTopics(input: CompanionActivityInput) {
  const journalTopics = (input.journalEntries || [])
    .map((entry) => entry.text)
    .join(' ')
    .toLowerCase()
    .match(/\b(about|school|friends|family|anxiety|stress|sleep|body|heart|future|home|work|love|money|grades|boys|girls|identity|peace|rest)\b/g) || [];

  const circleTopics = (input.circlePosts || [])
    .map((post) => post.text)
    .join(' ')
    .toLowerCase()
    .match(/\b(school|friends|family|anxiety|stress|sleep|body|heart|future|home|work|love|money|grades|boys|girls|identity|peace|rest)\b/g) || [];

  return normalizeTopics([...journalTopics, ...circleTopics]);
}

function buildComfortTools(input: CompanionActivityInput) {
  const tools = (input.comfortSessions || [])
    .map((session) => session.type)
    .filter((tool): tool is string => Boolean(tool))
    .map((tool) => tool.toLowerCase()) as string[];
  return Array.from(new Set(tools)).slice(0, 5);
}

function buildMilestones(summary: MemorySummary, input: CompanionActivityInput) {
  const milestones = [...summary.importantMilestones];
  if ((input.streakDays || 0) >= 7 && !milestones.includes('7-day streak')) milestones.push('7-day streak');
  if ((input.streakDays || 0) >= 14 && !milestones.includes('14-day streak')) milestones.push('14-day streak');
  if ((input.journalEntries || []).length >= 3 && !milestones.includes('first pages')) milestones.push('first pages');
  if ((input.voiceNotes || []).length >= 1 && !milestones.includes('voice-bip shared')) milestones.push('voice-bip shared');
  return milestones.slice(-4);
}

export function buildMemorySummary(
  input: CompanionActivityInput,
  previous?: MemorySummary
): MemorySummary {
  const base = previous || DEFAULT_MEMORY_SUMMARY;
  const favoriteMood = selectFavoriteMood(input, base.favoriteMood || DEFAULT_MEMORY_SUMMARY.favoriteMood);
  const commonTopics = buildTopics(input);
  const comfortToolsUsed = buildComfortTools(input);
  const recurringEmotions = normalizeTopics(
    (input.moodHistory || []).map((entry) => entry.mood).filter(Boolean) as string[]
  );
  const recurringStruggles = commonTopics.length ? commonTopics : base.recurringStruggles;
  const streakDays = input.streakDays || base.streakDays || 0;
  const journalsWritten = input.journalEntries?.length || base.journalsWritten || 0;
  const voiceBips = input.voiceNotes?.length || base.voiceBips || 0;
  const comfortActions = input.comfortSessions?.length || base.comfortActions || 0;
  const daysActive = Math.max(base.daysActive || 0, streakDays, journalsWritten + voiceBips + comfortActions);
  const conversations = Math.max(base.conversations || 0, journalsWritten + voiceBips + Math.max(1, (input.moodHistory || []).length));

  return {
    favoriteMood,
    favoriteSekret: PERSONALITY_LABELS[input.selectedSekret || 'soft'] || base.favoriteSekret,
    commonTopics: commonTopics.length ? commonTopics : base.commonTopics,
    streakDays,
    lastCheckIn: base.lastCheckIn || 'We’re checking in.',
    comfortToolsUsed: comfortToolsUsed.length ? comfortToolsUsed : base.comfortToolsUsed,
    recurringEmotions: recurringEmotions.length ? recurringEmotions : base.recurringEmotions,
    recurringStruggles: recurringStruggles.length ? recurringStruggles : base.recurringStruggles,
    importantMilestones: buildMilestones(base, input),
    daysActive,
    conversations,
    journalsWritten,
    voiceBips,
    comfortActions,
  };
}

export function buildCompanionLevel(summary: MemorySummary): CompanionLevel {
  const score = summary.daysActive * 2 + summary.conversations * 2 + summary.journalsWritten * 3 + summary.voiceBips * 4 + summary.comfortActions * 2;
  const level = Math.max(1, Math.min(6, Math.floor(score / 8) + 1));
  const nextLevel = Math.max(1, (level * 8) - score);
  const titles = ['First hello', 'Softly familiar', 'Trusted companion', 'Steady presence', 'Deeply known', 'Forever in your corner'];
  const greetings = [
    'Hey, I’m here.',
    'I’m glad you checked in.',
    'You don’t have to carry it alone.',
    'We’ve been growing together.',
    'I know your rhythm now.',
  ];
  const depths = [
    'gentle check-ins',
    'memory-based comfort',
    'deeper conversations',
    'special encouragement',
    'personality-specific care',
  ];
  const encouragements = [
    'You are doing better than you think.',
    'One small step still counts.',
    'You are allowed to be soft here.',
    'I’m proud of the way you keep showing up.',
  ];

  return {
    level,
    title: titles[level - 1] || titles[titles.length - 1],
    progress: Math.min(100, Math.round((score % 8) / 8 * 100)),
    nextLevel,
    unlockedGreetings: greetings.slice(0, Math.max(1, Math.min(greetings.length, level))),
    unlockedDepth: depths.slice(0, Math.max(1, Math.min(depths.length, level - 1))),
    encouragements: encouragements.slice(0, Math.max(1, Math.min(encouragements.length, level))),
    personalityResponses: ['gentle warmth', 'protective calm', 'honest care'],
  };
}

function getScreenPresence(input: CompanionActivityInput, summary: MemorySummary, personality: string) {
  const topic = summary.commonTopics[0] || 'whatever’s been sitting heavy';
  if (personality === 'Rylane') {
    if (input.screen === 'journal') {
      if (summary.streakDays >= 3) return `You’ve been keeping up your streak. That’s real. Proud of you.`;
      if (summary.journalsWritten > 0) return `Last time you mentioned ${topic}. Bet. Want to get into it?`;
      return `No pressure. One messy little page is enough.`;
    }
    if (summary.recurringStruggles.length) return `That ${summary.recurringStruggles[0]} stuff has been hanging around. We’ll handle one thing at a time.`;
    return `I’m here. No big speech, just me.`;
  }
  if (personality === "Cloud Se'kret") {
    if (input.screen === 'journal') {
      if (summary.journalsWritten > 0) return `Last time you mentioned ${topic}. We can just sit with that for a minute.`;
      return `You don’t have to solve everything tonight.`;
    }
    if (summary.recurringStruggles.length) return `That sounds heavy. We can just sit with it for a minute.`;
    return `You can rest here.`;
  }
  if (personality === 'Night Se\'kret') {
    if (input.screen === 'journal') {
      if (summary.journalsWritten > 0) return `Still awake? You mentioned ${topic} last time. You don’t gotta explain it perfectly.`;
      return `Long day? It’s okay. I’m here.`;
    }
    if (summary.recurringStruggles.length) return `Still awake? I’m here. No need to make it polished.`;
    return `You’re not alone tonight.`;
  }
  if (input.screen === 'journal') {
    if (summary.streakDays >= 3) return `You’ve been keeping up your streak. That matters. Proud of you.`;
    if (summary.journalsWritten > 0) return `Last time you mentioned ${topic}. You still carrying that around?`;
    return `No pressure. One messy little page is enough.`;
  }
  if (summary.recurringStruggles.length) return `You’ve been carrying ${summary.recurringStruggles[0]} around for a while. We can go slow.`;
  return `I’m here with you. No big speech, just me.`;
}

export function buildCheckIn(summary: MemorySummary, input: CompanionActivityInput, personality: string): CompanionCheckIn | null {
  const lowMood = /sad|angry|tired|anxious|overwhelmed|stress/i.test(input.mood || '');
  const lateNight = input.isLateNight || false;
  const roughPattern = summary.recurringEmotions.some((emotion) => /sad|angry|anxious|stress|overwhelmed/.test(emotion));
  const longAbsence = summary.streakDays <= 1 && summary.daysActive > 4;

  if (personality === 'Rylane') {
    if (lateNight && lowMood) return { id: 'night-low-mood', message: "Looks like tonight’s one of those nights. We’ll keep it simple. I’m here.", tone: 'gentle' };
    if (lowMood && roughPattern) return { id: 'rough-pattern', message: "You’ve had a few rough days in a row. Nah, that’s not nothing. Want to talk?", tone: 'warm' };
    if (longAbsence) return { id: 'long-absence', message: 'I noticed you’ve been quiet lately. That usually means something’s sitting heavy. Start from the beginning.', tone: 'protective' };
    return null;
  }
  if (personality === "Cloud Se'kret") {
    if (lateNight && lowMood) return { id: 'night-low-mood', message: 'That sounds heavy. We can just sit here for a minute.', tone: 'gentle' };
    if (lowMood && roughPattern) return { id: 'rough-pattern', message: 'You’ve had a few rough days in a row. We don’t have to fix it all tonight.', tone: 'warm' };
    if (longAbsence) return { id: 'long-absence', message: 'I noticed you’ve been quiet lately. You don’t have to solve everything right now.', tone: 'protective' };
    return null;
  }
  if (personality === 'Night Se\'kret') {
    if (lateNight && lowMood) return { id: 'night-low-mood', message: 'Still awake? It’s okay. I’m here.', tone: 'gentle' };
    if (lowMood && roughPattern) return { id: 'rough-pattern', message: 'Long day? We can keep this simple. You don’t have to explain it perfectly.', tone: 'warm' };
    if (longAbsence) return { id: 'long-absence', message: 'I noticed you’ve been quiet lately. You can just be here with me tonight.', tone: 'protective' };
    return null;
  }
  if (lateNight && lowMood) {
    return { id: 'night-low-mood', message: "Looks like tonight might be one of those nights. I’m here. No fake 'I’m fine' stuff.", tone: 'gentle' };
  }
  if (lowMood && roughPattern) {
    return { id: 'rough-pattern', message: "You’ve had a few rough days in a row. Nah, that’s not nothing. Want to talk?", tone: 'warm' };
  }
  if (longAbsence) {
    return { id: 'long-absence', message: 'I noticed you’ve been quiet lately. That usually means something’s sitting heavy. You good to talk?', tone: 'protective' };
  }
  if (summary.streakDays <= 1) {
    return { id: 'first-streak', message: 'You’re starting again, and that matters. Bet. We handle one thing at a time.', tone: 'gentle' };
  }
  return null;
}

export function buildGreeting(personality: string, level: CompanionLevel, mood?: string) {
  const moodTone = /sad|angry|tired|anxious|stress|overwhelmed/i.test(mood || '') ? 'softly' : 'warmly';
  if (personality === 'Rylane') {
    if (level.level >= 3) return `Aight, I’m here. We’ve been building something real ${moodTone}.`;
    return "Aight, talk to me. What's really going on?";
  }
  if (personality === "Cloud Se'kret") {
    return 'That sounds heavy. We can just sit here for a minute.';
  }
  if (personality === 'Night Se\'kret') {
    return 'Still awake? It’s okay. I’m here.';
  }
  if (level.level >= 3) {
    return `Hey love, I’m still here with you, ${moodTone}.`;
  }
  return "Hey love. Aight, talk to me. What's really going on?";
}

export function buildCompanionSnapshot(input: CompanionActivityInput, previousState?: CompanionState) {
  const memorySummary = buildMemorySummary(input, previousState?.memorySummary);
  const companionLevel = buildCompanionLevel(memorySummary);
  const personality = PERSONALITY_LABELS[input.selectedSekret || 'soft'] || previousState?.personality || "Raylene";
  const greeting = buildGreeting(personality, companionLevel, input.mood);
  const presenceMessage = getScreenPresence(input, memorySummary, personality);
  const checkIn = buildCheckIn(memorySummary, input, personality);

  return {
    memorySummary,
    companionLevel,
    greeting,
    presenceMessage,
    checkIn,
    lastUpdated: new Date().toISOString(),
    personality,
  } satisfies CompanionState;
}

export async function loadCompanionState(): Promise<CompanionState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANION_STATE;
    const parsed = JSON.parse(raw) as CompanionState;
    return {
      ...DEFAULT_COMPANION_STATE,
      ...parsed,
      memorySummary: { ...DEFAULT_MEMORY_SUMMARY, ...(parsed.memorySummary || {}) },
      companionLevel: { ...DEFAULT_COMPANION_LEVEL, ...(parsed.companionLevel || {}) },
    };
  } catch (error) {
    console.warn('Unable to load companion state', error);
    return DEFAULT_COMPANION_STATE;
  }
}

export async function saveCompanionState(state: CompanionState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save companion state', error);
  }
}
