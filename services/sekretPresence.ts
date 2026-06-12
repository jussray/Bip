import type { MemorySummary } from '../types/sekretCompanion';

export type SekretPersonality = 'raylene' | 'rylane' | 'cloud' | 'night';

export function normalizeSekretPersonality(value?: string): SekretPersonality {
  const personality = (value || '').toLowerCase();
  if (personality.includes('rylane')) return 'rylane';
  if (personality.includes('cloud')) return 'cloud';
  if (personality.includes('night')) return 'night';
  return 'raylene';
}

function shouldNoticeMemory(summary?: Partial<MemorySummary>, screen?: string): boolean {
  if (screen || !summary) return false;
  const conversations = summary.conversations || 0;
  return conversations >= 5 && conversations % 5 === 0;
}

function rememberedPresence(summary: Partial<MemorySummary>, voice: SekretPersonality): string | null {
  if (summary.recentGrowth || (summary.winningStreak || 0) >= 3) {
    if (voice === 'rylane') return 'look at you still standing. keep going.';
    if (voice === 'cloud') return 'something feels different today. lighter, maybe.';
    if (voice === 'night') return 'yesterday had hands. you’re still here.';
    return 'look at that. yesterday had hands and you’re still standing.';
  }

  const recurringEmotion = summary.recurringEmotions?.[0];
  if (recurringEmotion) {
    if (voice === 'rylane') return `${recurringEmotion} again, huh. aight. what happened?`;
    if (voice === 'cloud') return `that ${recurringEmotion} feeling came back. no rush.`;
    if (voice === 'night') return 'rough again? stay here a minute.';
    return `friend... that ${recurringEmotion} feeling again? c’mere.`;
  }

  return null;
}

export function buildSekretPresence(
  summary: Partial<MemorySummary> | undefined,
  personality?: string,
  screen?: string,
): string {
  const voice = normalizeSekretPersonality(personality);
  const memoryLine = shouldNoticeMemory(summary, screen) && summary
    ? rememberedPresence(summary, voice)
    : null;
  if (memoryLine) return memoryLine;

  if (voice === 'rylane') {
    if (screen === 'voiceBip') return 'drop a voice bip. say it straight.';
    if (screen === 'comfort') return 'aight. one thing at a time.';
    return 'aight. what REALLY happened?';
  }

  if (voice === 'cloud') {
    if (screen === 'voiceBip') return 'let the words come.';
    if (screen === 'comfort') return 'come sit for a sec.';
    return 'something feels different today.';
  }

  if (voice === 'night') {
    if (screen === 'voiceBip') return 'say the loud part.';
    if (screen === 'comfort') return 'one breath.';
    return 'rough night?';
  }

  if (screen === 'voiceBip') return 'okay, say it before you talk yourself out of it.';
  if (screen === 'comfort') return 'girl... breathe first. then tell me who did what.';
  return 'friend... 😭 what happened?';
}
