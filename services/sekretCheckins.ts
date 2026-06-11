import type { CompanionActivityInput, CompanionCheckIn, MemorySummary } from '../types/sekretCompanion';
import type { SekretMemory } from './sekretMemory';
import { normalizeSekretPersonality } from './sekretPresence';

const LOW_MOOD     = /sad|angry|tired|anxious|stress|overwhelmed|awful|lonely|burned out/i;
const WINNING_MOOD = /proud|motivated|confident|excited|accomplished|loved|connected|locked.in|celebrating|glow.up/i;

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
  trigger: 'low-mood' | 'repeated-emotion' | 'missed-streak' | 'long-absence' | 'late-night' | 'comfort-masking' | 'deferred-goal' | 'winning-mood' | 'growth-noticing',
  personality?: string,
): Omit<CompanionCheckIn, 'id'> {
  const voice = normalizeSekretPersonality(personality);
  const messages = {
    raylene: {
      'low-mood':        { message: "Hey love, that mood sounds heavy. Come tell me what happened. No pretending over here.", tone: 'warm' as const },
      'repeated-emotion':{ message: "This feeling has pulled up more than once lately. I remember. What keeps bringing it back?", tone: 'protective' as const },
      'missed-streak':   { message: "Missed a day? Baby, that does not erase the days you showed up. We can start right here.", tone: 'gentle' as const },
      'long-absence':    { message: "You been gone a little minute. No guilt trip. I'm just glad you came back. What's been going on?", tone: 'warm' as const },
      'late-night':      { message: "It's late, love. Don't carry the whole day into bed by yourself.", tone: 'gentle' as const },
      'comfort-masking': { message: "You keep saying you're tired, baby. But I've been watching — that's not tired. What's it actually called?", tone: 'protective' as const },
      'deferred-goal':   { message: "Respectfully? We've been pushing this to next week for a while now. What's actually in the way?", tone: 'warm' as const },
      'winning-mood':    { message: "AS YOU SHOULD BE. Don't just scroll past this. Tell me what happened.", tone: 'warm' as const },
      'growth-noticing': { message: "I've been watching. You've been winning more than you've been struggling lately. That's not an accident. That's you.", tone: 'warm' as const },
    },
    rylane: {
      'low-mood':        { message: "Nah, that sounds like a rough one. Talk to me straight. What went down?", tone: 'protective' as const },
      'repeated-emotion':{ message: "That same feeling keeps doubling back. I peeped it too. Let's get to what's underneath it.", tone: 'protective' as const },
      'missed-streak':   { message: "You missed a day, not the whole mission. Tap back in. We keep moving.", tone: 'warm' as const },
      'long-absence':    { message: "You been quiet for a minute. No lecture. Just tell me where your head's been.", tone: 'warm' as const },
      'late-night':      { message: "You still up carrying stuff? Put some of it down before the night gets any longer.", tone: 'gentle' as const },
      'comfort-masking': { message: "Lowkey you keep saying fine but the energy is saying something else. What's actually up fr?", tone: 'protective' as const },
      'deferred-goal':   { message: "Bro we said Monday like four Mondays in a row now. What's blocking it for real?", tone: 'warm' as const },
      'winning-mood':    { message: "Real talk? That's you. You built that. Don't brush past it.", tone: 'warm' as const },
      'growth-noticing': { message: "You've been picking winning moods more than struggling moods lately. That's actual growth. I see it.", tone: 'warm' as const },
    },
    cloud: {
      'low-mood':        { message: "That feels heavy. You can set a little of it down here, one piece at a time.", tone: 'gentle' as const },
      'repeated-emotion':{ message: "This feeling has floated back in again. We do not have to chase it away. We can listen softly.", tone: 'warm' as const },
      'missed-streak':   { message: "A missed day is only a pause. Your soft place is still here whenever you return.", tone: 'gentle' as const },
      'long-absence':    { message: "It has been quiet around here. I'm glad you found your way back. We can begin slowly.", tone: 'warm' as const },
      'late-night':      { message: "The night can make everything feel bigger. Let's make this moment small and soft.", tone: 'gentle' as const },
      'comfort-masking': { message: "The word tired keeps floating back. Sometimes tired is carrying things that need a softer name. We can find it together.", tone: 'gentle' as const },
      'deferred-goal':   { message: "You've mentioned starting again a few times now. There's no rush — but I wonder what makes beginning feel hard.", tone: 'gentle' as const },
      'winning-mood':    { message: "I noticed that. A moment worth remembering. How does it feel from the inside?", tone: 'gentle' as const },
      'growth-noticing': { message: "The pattern is shifting. More light than weight lately. That's not nothing. That's you changing.", tone: 'warm' as const },
    },
    night: {
      'low-mood':        { message: "That feeling followed you into the dark, huh? You do not have to sit with it alone.", tone: 'warm' as const },
      'repeated-emotion':{ message: "Same feeling, another night. I remember. Tell me the part that keeps staying awake.", tone: 'protective' as const },
      'missed-streak':   { message: "The streak bent; it did not break you. Tonight can be the next small beginning.", tone: 'gentle' as const },
      'long-absence':    { message: "Been a while. The room is still yours. Come back in without explaining the silence first.", tone: 'warm' as const },
      'late-night':      { message: "Still awake? Keep me company for a minute, then let yourself rest.", tone: 'gentle' as const },
      'comfort-masking': { message: "That word keeps showing up at night. Sometimes tired carries things that need a softer name. What's it really called?", tone: 'warm' as const },
      'deferred-goal':   { message: "The same goal keeps finding you before you sleep. That means it matters. What would even one small step look like tonight?", tone: 'gentle' as const },
      'winning-mood':    { message: "Going to sleep proud. That's a good night. Hold that.", tone: 'gentle' as const },
      'growth-noticing': { message: "Last month was harder. This week looks different. I notice.", tone: 'warm' as const },
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

  const comfortWordPattern = summary?.comfortWordPattern;
  const hasDeferredGoal = summary?.hasDeferredGoal;
  const recentGrowth = summary?.recentGrowth;
  const proudMoodCount = summary?.proudMoodCount ?? 0;

  let trigger: Parameters<typeof messageFor>[0] | null = null;
  if (LOW_MOOD.test(currentMood) && repeatedEmotion) trigger = 'repeated-emotion';
  else if (LOW_MOOD.test(currentMood)) trigger = 'low-mood';
  else if (WINNING_MOOD.test(currentMood)) trigger = 'winning-mood';
  else if (recentGrowth && proudMoodCount >= 3) trigger = 'growth-noticing';
  else if (absentDays >= 7) trigger = 'long-absence';
  else if (missedStreak) trigger = 'missed-streak';
  else if (comfortWordPattern) trigger = 'comfort-masking';
  else if (hasDeferredGoal) trigger = 'deferred-goal';
  else if (isLateNight) trigger = 'late-night';
  if (!trigger) return null;

  return { id: `${normalizeSekretPersonality(personality)}-${trigger}`, ...messageFor(trigger, personality) };
}
