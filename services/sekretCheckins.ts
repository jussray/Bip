import type { CompanionActivityInput, CompanionCheckIn, MemorySummary } from '../types/sekretCompanion';
import type { SekretMemory } from './sekretMemory';
import { normalizeSekretPersonality } from './sekretPresence';

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(value?: string): number {
  const date = parseDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

function messageFor(
  trigger: 'long-absence' | 'late-night',
  personality?: string,
): Omit<CompanionCheckIn, 'id'> {
  const voice = normalizeSekretPersonality(personality);
  const messages = {
    raylene: {
      'long-absence': { message: 'Girl where have you BEEN 😭 what happened?', tone: 'warm' },
      'late-night': { message: 'You still up? Okay, what’s going on?', tone: 'warm' },
    },
    rylane: {
      'long-absence': { message: 'You been gone. No lecture. What happened?', tone: 'warm' },
      'late-night': { message: 'Still up? Aight. Talk.', tone: 'gentle' },
    },
    cloud: {
      'long-absence': { message: 'It’s been quiet here.', tone: 'warm' },
      'late-night': { message: 'Everything feels louder tonight.', tone: 'gentle' },
    },
    night: {
      'long-absence': { message: 'been a while.', tone: 'warm' },
      'late-night': { message: 'still awake?', tone: 'gentle' },
    },
  } as const;
  return messages[voice][trigger];
}

export function buildSekretCheckIn(
  _summary: Partial<MemorySummary> | undefined,
  personality?: string,
  _mood?: string,
  isLateNight?: boolean,
  input?: CompanionActivityInput,
  memory?: SekretMemory,
): CompanionCheckIn | null {
  const lastActive = input?.lastOpenDate || memory?.lastActiveAt;
  const absentDays = daysSince(lastActive);

  const trigger = absentDays >= 7 ? 'long-absence' : isLateNight ? 'late-night' : null;
  if (!trigger) return null;

  return { id: `${normalizeSekretPersonality(personality)}-${trigger}`, ...messageFor(trigger, personality) };
}
