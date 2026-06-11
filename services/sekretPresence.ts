import type { MemorySummary } from '../types/sekretCompanion';

export type SekretPersonality = 'raylene' | 'rylane' | 'cloud' | 'night';

export function normalizeSekretPersonality(value?: string): SekretPersonality {
  const personality = (value || '').toLowerCase();
  if (personality.includes('rylane')) return 'rylane';
  if (personality.includes('cloud')) return 'cloud';
  if (personality.includes('night')) return 'night';
  return 'raylene';
}

export function buildSekretPresence(
  _summary: Partial<MemorySummary> | undefined,
  personality?: string,
  screen?: string,
): string {
  const voice = normalizeSekretPersonality(personality);

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
