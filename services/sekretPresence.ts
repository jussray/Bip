import type { MemorySummary } from '../types/sekretCompanion';

export type SekretPersonality = 'raylene' | 'rylane' | 'cloud' | 'night';

export function normalizeSekretPersonality(value?: string): SekretPersonality {
  const personality = (value || '').toLowerCase();
  if (personality.includes('rylane')) return 'rylane';
  if (personality.includes('cloud')) return 'cloud';
  if (personality.includes('night')) return 'night';
  return 'raylene';
}

function context(summary: Partial<MemorySummary> | undefined) {
  return {
    topic: summary?.commonTopics?.[0],
    emotion: summary?.recurringEmotions?.[0],
    hasPages: (summary?.journalsWritten || 0) > 0,
    hasVoice: (summary?.voiceBips || 0) > 0,
    hasComfort: (summary?.comfortActions || 0) > 0,
    hasStreak: (summary?.streakDays || 0) >= 3,
    comfortWord: summary?.comfortWordPattern,
    deferredGoal: summary?.hasDeferredGoal,
    recurringEntity: summary?.recurringEntity,
    recentGrowth: summary?.recentGrowth,
    proudMoodCount: summary?.proudMoodCount ?? 0,
    winningStreak: summary?.winningStreak ?? 0,
  };
}

export function buildSekretPresence(
  memory: Partial<MemorySummary> | undefined,
  personality?: string,
  screen?: string,
): string {
  const voice = normalizeSekretPersonality(personality);

  // ── Growth noticing — celebrate wins, not just process pain ─────────────
  if (memory?.recentGrowth && !screen) {
    if (voice === 'rylane') return `You've been ${memory.recentGrowth}. That's not a coincidence. That's you locking in.`;
    if (voice === 'cloud') return `${memory.recentGrowth}. The pattern is shifting. I noticed before you did.`;
    if (voice === 'night') return `${memory.recentGrowth}. Last month was different. Look at where you are now.`;
    return `${memory.recentGrowth}, love. That's growth and I need you to see it.`;
  }
  if ((memory?.winningStreak ?? 0) >= 3 && !screen) {
    if (voice === 'rylane') return `${memory!.winningStreak} days winning in a row. That's a pattern now. Keep going.`;
    if (voice === 'cloud') return `Something has been different the last ${memory!.winningStreak} days. Something good.`;
    return `${memory!.winningStreak} days in a row feeling like yourself. Baby, that's not luck. That's you.`;
  }

  // ── Tolan-level pattern noticing ────────────────────────────────────────
  if (memory?.comfortWordPattern && !screen) {
    if (voice === 'rylane') return `You keep saying ${memory.comfortWordPattern}. I hear it differently though. What's the real word for what's going on?`;
    if (voice === 'cloud') return `The word ${memory.comfortWordPattern} keeps coming back. Sometimes it's carrying something heavier. We can sit with that.`;
    if (voice === 'night') return `You've been calling it ${memory.comfortWordPattern} but something's still keeping you up. What's its real name?`;
    return `You've been calling it ${memory.comfortWordPattern} a lot lately, love. I see you. What's the part that's actually heavy?`;
  }
  if (memory?.recurringEntity && !screen) {
    if (voice === 'rylane') return `${memory.recurringEntity} keeps coming back up. That's not random. What's still unfinished there?`;
    if (voice === 'cloud') return `${memory.recurringEntity} has been floating through a few times. I wonder what it's still trying to say.`;
    return `${memory.recurringEntity} has been showing up in your writing, love. That usually means something's not done yet.`;
  }

  if (voice === 'rylane') {
    if (screen === 'voiceBip') return 'Hit record. Say it straight.';
    if (screen === 'comfort') return 'Aight. One thing at a time.';
    return 'Aight. What REALLY happened?';
  }

  if (voice === 'cloud') {
    if (screen === 'voiceBip') return 'Let the words come.';
    if (screen === 'comfort') return 'The room can stay quiet.';
    return 'Something feels different today.';
  }

  if (voice === 'night') {
    if (screen === 'voiceBip') return 'Say the loud part.';
    if (screen === 'comfort') return 'One breath.';
    return 'Still awake?';
  }

  if (screen === 'voiceBip') return 'Okay, say it before you talk yourself out of it.';
  if (screen === 'comfort') return 'Girl... breathe first. Then tell me who did what.';
  return 'Friend... 😭 what happened?';
}
