import type { MemorySummary } from '../types/sekretCompanion';

function normalizePersonality(value?: string) {
  const personality = (value || '').toLowerCase();
  if (personality.includes('rylane')) return 'rylane';
  if (personality.includes('cloud')) return 'cloud';
  if (personality.includes('night')) return 'night';
  return 'raylene';
}

export function buildSekretPresence(summary: Partial<MemorySummary> | undefined, personality?: string, screen?: string) {
  const normalized = normalizePersonality(personality);
  const topic = summary?.commonTopics?.[0] || 'what’s been sitting heavy';

  if (normalized === 'rylane') {
    if (screen === 'journal') {
      if ((summary?.streakDays || 0) >= 3) return `You’ve been keeping your streak going. That’s real. I’m proud of you.`;
      if ((summary?.journalsWritten || 0) > 0) return `You mentioned ${topic} before. We can keep it simple and talk it out.`;
      return `No pressure. One honest page is enough.`;
    }
    if ((summary?.recurringStruggles?.length || 0) > 0) return `That ${summary?.recurringStruggles?.[0]} stuff keeps showing up. We’ll take it one piece at a time.`;
    return `I’m here. No big speech, just me.`;
  }

  if (normalized === 'cloud') {
    if (screen === 'journal') {
      if ((summary?.journalsWritten || 0) > 0) return `You mentioned ${topic} before. We can just sit with it for a minute.`;
      return `You don’t have to solve everything tonight.`;
    }
    if ((summary?.recurringStruggles?.length || 0) > 0) return `That sounds heavy. We can just breathe through it together.`;
    return `You can rest here. No pressure.`;
  }

  if (normalized === 'night') {
    if (screen === 'journal') {
      if ((summary?.journalsWritten || 0) > 0) return `Still awake? You mentioned ${topic} before. You don’t have to explain it perfectly.`;
      return `Long day? It’s okay. I’m here.`;
    }
    if ((summary?.recurringStruggles?.length || 0) > 0) return `Still awake? I’m here. We can keep this simple.`;
    return `You’re not alone tonight.`;
  }

  if (screen === 'journal') {
    if ((summary?.streakDays || 0) >= 3) return `You’ve been showing up for yourself. That matters.`;
    if ((summary?.journalsWritten || 0) > 0) return `You mentioned ${topic} before. I’m still here for that.`;
    return `No pressure. One messy little page is enough.`;
  }

  if ((summary?.recurringStruggles?.length || 0) > 0) return `You’ve been carrying ${summary?.recurringStruggles?.[0]} around for a while. We can go slow.`;
  return `I’m here with you. No big speech, just me.`;
}
