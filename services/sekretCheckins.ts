import type { CompanionActivityInput, CompanionCheckIn, MemorySummary } from '../types/sekretCompanion';
import type { SekretMemory } from './sekretMemory';
import { normalizeSekretPersonality } from './sekretPresence';

const LOW_MOOD = /sad|angry|tired|anxious|stress|overwhelmed|awful|lonely|burned out/i;

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
  trigger: 'low-mood' | 'repeated-emotion' | 'missed-streak' | 'long-absence' | 'late-night',
  personality?: string,
): Omit<CompanionCheckIn, 'id'> {
  const voice = normalizeSekretPersonality(personality);
  const messages = {
    raylene: {
      'low-mood': { message: 'Hey love, that mood sounds heavy. Come tell me what happened—no pretending over here.', tone: 'warm' },
      'repeated-emotion': { message: 'This feeling has pulled up more than once lately. I remember. What keeps bringing it back?', tone: 'protective' },
      'missed-streak': { message: 'Missed a day? Baby, that does not erase the days you showed up. We can start right here.', tone: 'gentle' },
      'long-absence': { message: 'You been gone a little minute. No guilt trip—I’m just glad you came back. What’s been going on?', tone: 'warm' },
      'late-night': { message: 'It’s late, love. Don’t carry the whole day into bed by yourself.', tone: 'gentle' },
    },
    rylane: {
      'low-mood': { message: 'Nah, that sounds like a rough one. Talk to me straight—what went down?', tone: 'protective' },
      'repeated-emotion': { message: 'That same feeling keeps doubling back. I peeped it too. Let’s get to what’s underneath it.', tone: 'protective' },
      'missed-streak': { message: 'You missed a day, not the whole mission. Tap back in. We keep moving.', tone: 'warm' },
      'long-absence': { message: 'You been quiet for a minute. No lecture. Just tell me where your head’s been.', tone: 'warm' },
      'late-night': { message: 'You still up carrying stuff? Put some of it down before the night gets any longer.', tone: 'gentle' },
    },
    cloud: {
      'low-mood': { message: 'That feels heavy. You can set a little of it down here, one piece at a time.', tone: 'gentle' },
      'repeated-emotion': { message: 'This feeling has floated back in again. We do not have to chase it away; we can listen softly.', tone: 'warm' },
      'missed-streak': { message: 'A missed day is only a pause. Your soft place is still here whenever you return.', tone: 'gentle' },
      'long-absence': { message: 'It has been quiet around here. I’m glad you found your way back. We can begin slowly.', tone: 'warm' },
      'late-night': { message: 'The night can make everything feel bigger. Let’s make this moment small and soft.', tone: 'gentle' },
    },
    night: {
      'low-mood': { message: 'That feeling followed you into the dark, huh? You do not have to sit with it alone.', tone: 'warm' },
      'repeated-emotion': { message: 'Same feeling, another night. I remember. Tell me the part that keeps staying awake.', tone: 'protective' },
      'missed-streak': { message: 'The streak bent; it did not break you. Tonight can be the next small beginning.', tone: 'gentle' },
      'long-absence': { message: 'Been a while. The room is still yours. Come back in without explaining the silence first.', tone: 'warm' },
      'late-night': { message: 'Still awake? Keep me company for a minute, then let yourself rest.', tone: 'gentle' },
    },
  } as const;
  return messages[voice][trigger];
}

export function buildSekretCheckIn(
  summary: Partial<MemorySummary> | undefined,
  personality?: string,
  mood?: string,
  isLateNight?: boolean,
  input?: CompanionActivityInput,
  memory?: SekretMemory,
): CompanionCheckIn | null {
  const recentMoods = memory?.moodHistory.slice(-6).map((entry) => entry.mood || '') || [];
  const currentMood = mood || recentMoods[recentMoods.length - 1] || '';
  const repeatedEmotion = Boolean(currentMood) && recentMoods.filter((value) => value.toLowerCase() === currentMood.toLowerCase()).length >= 2;
  const lastActive = input?.lastOpenDate || memory?.lastActiveAt;
  const absentDays = daysSince(lastActive);
  const missedStreak = (memory?.streaks.longest || 0) >= 2 && (summary?.streakDays || 0) <= 1 && absentDays >= 1;

  let trigger: Parameters<typeof messageFor>[0] | null = null;
  if (LOW_MOOD.test(currentMood) && repeatedEmotion) trigger = 'repeated-emotion';
  else if (LOW_MOOD.test(currentMood)) trigger = 'low-mood';
  else if (absentDays >= 7) trigger = 'long-absence';
  else if (missedStreak) trigger = 'missed-streak';
  else if (isLateNight) trigger = 'late-night';
  if (!trigger) return null;

  return { id: `${normalizeSekretPersonality(personality)}-${trigger}`, ...messageFor(trigger, personality) };
}
