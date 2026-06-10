import type { CompanionCheckIn } from '../types/sekretCompanion';

export function buildSekretCheckIn(
  summary: { streakDays?: number; daysActive?: number; recurringEmotions?: string[]; recurringStruggles?: string[] } | undefined,
  personality?: string,
  mood?: string,
  isLateNight?: boolean,
): CompanionCheckIn | null {
  const lowMood = /sad|angry|tired|anxious|stress|overwhelmed|burned out/i.test(mood || '');
  const repeatedEmotion = (summary?.recurringEmotions || []).some((emotion) => /sad|angry|anxious|stress|overwhelmed|tired/i.test(emotion));
  const longAbsence = (summary?.streakDays || 0) <= 1 && (summary?.daysActive || 0) > 4;
  const normalized = (personality || '').toLowerCase();

  if (normalized.includes('rylane')) {
    if (isLateNight && lowMood) return { id: 'rylane-late-night', message: "Looks like tonight’s one of those nights. We’ll keep it simple. I’m here.", tone: 'gentle' };
    if (lowMood && repeatedEmotion) return { id: 'rylane-repeated-emotion', message: "You’ve had a few rough days in a row. Nah, that’s not nothing. Want to talk?", tone: 'warm' };
    if (longAbsence) return { id: 'rylane-long-absence', message: 'I noticed you’ve been quiet lately. Start from the beginning and we’ll go from there.', tone: 'protective' };
    return null;
  }

  if (normalized.includes('cloud')) {
    if (isLateNight && lowMood) return { id: 'cloud-late-night', message: 'That sounds heavy. We can just sit here for a minute.', tone: 'gentle' };
    if (lowMood && repeatedEmotion) return { id: 'cloud-repeated-emotion', message: 'You’ve had a few rough days in a row. We don’t have to fix it all tonight.', tone: 'warm' };
    if (longAbsence) return { id: 'cloud-long-absence', message: 'I noticed you’ve been quiet lately. You don’t have to solve everything right now.', tone: 'protective' };
    return null;
  }

  if (normalized.includes('night')) {
    if (isLateNight && lowMood) return { id: 'night-late-night', message: 'Still awake? It’s okay. I’m here.', tone: 'gentle' };
    if (lowMood && repeatedEmotion) return { id: 'night-repeated-emotion', message: 'Long day? We can keep this simple. You don’t have to explain it perfectly.', tone: 'warm' };
    if (longAbsence) return { id: 'night-long-absence', message: 'I noticed you’ve been quiet lately. You can just be here with me tonight.', tone: 'protective' };
    return null;
  }

  if (isLateNight && lowMood) return { id: 'default-late-night', message: "Looks like tonight might be one of those nights. I’m here. No fake 'I’m fine' stuff.", tone: 'gentle' };
  if (lowMood && repeatedEmotion) return { id: 'default-repeated-emotion', message: "You’ve had a few rough days in a row. That matters. Want to talk?", tone: 'warm' };
  if (longAbsence) return { id: 'default-long-absence', message: 'I noticed you’ve been quiet lately. That usually means something’s sitting heavy. You good to talk?', tone: 'protective' };
  if ((summary?.streakDays || 0) <= 1) return { id: 'default-start', message: 'You’re starting again, and that matters. We handle one thing at a time.', tone: 'gentle' };

  return null;
}
