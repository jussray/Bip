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
  };
}

export function buildSekretPresence(
  summary: Partial<MemorySummary> | undefined,
  personality?: string,
  screen?: string,
): string {
  const voice = normalizeSekretPersonality(personality);
  const memory = context(summary);

  // ── Tolan-level pattern noticing ────────────────────────────────────────
  if (memory.comfortWord && !screen) {
    if (voice === 'rylane') return `You keep saying ${memory.comfortWord}. I hear it differently though. What’s the real word for what’s going on?`;
    if (voice === 'cloud') return `The word ${memory.comfortWord} keeps coming back. Sometimes it’s carrying something heavier. We can sit with that.`;
    if (voice === 'night') return `You’ve been calling it ${memory.comfortWord} but something’s still keeping you up. What’s its real name?`;
    return `You’ve been calling it ${memory.comfortWord} a lot lately, love. I see you. What’s the part that’s actually heavy?`;
  }
  if (memory.recurringEntity && !screen) {
    if (voice === 'rylane') return `${memory.recurringEntity} keeps coming back up. That’s not random. What’s still unfinished there?`;
    if (voice === 'cloud') return `${memory.recurringEntity} has been floating through a few times. I wonder what it’s still trying to say.`;
    return `${memory.recurringEntity} has been showing up in your writing, love. That usually means something’s not done yet.`;
  }

  if (voice === 'rylane') {
    if (screen === 'journal') return memory.topic ? `That ${memory.topic} situation came up before. Put it down plain—we’ll sort through it.` : 'Put it down how it happened. It does not have to sound pretty.';
    if (screen === 'voiceBip') return memory.hasVoice ? 'You already know the move. Say it out loud and get it off your chest.' : 'Hit record and keep it real. I’m listening.';
    if (screen === 'comfort') return memory.hasComfort ? 'You found what settles you before. Run that play again.' : 'Take a breath. We are not letting one hard moment run the whole night.';
    if (memory.hasStreak) return `You kept showing up ${summary?.streakDays} days strong. That counts.`;
    return memory.emotion ? `I remember ${memory.emotion} has been hanging around. What’s up for real?` : 'Aight, I’m here. What’s up for real?';
  }

  if (voice === 'cloud') {
    if (screen === 'journal') return memory.topic ? `We can make a little room for ${memory.topic}. Just one honest line at a time.` : 'No rush. One quiet, honest line is enough.';
    if (screen === 'voiceBip') return 'Let the words come slowly. Silence can stay in the recording too.';
    if (screen === 'comfort') return memory.hasComfort ? 'You have found your way back to calm before. We can follow that same soft path.' : 'Let your shoulders drop. Nothing has to be solved right now.';
    return memory.emotion ? `I remember ${memory.emotion} has been nearby. We can sit with it gently.` : 'Come rest here a minute. No pressure.';
  }

  if (voice === 'night') {
    if (screen === 'journal') return memory.topic ? `${memory.topic} followed you into the night again. Leave some of it on the page.` : 'The night gets loud sometimes. Leave a little of it on the page.';
    if (screen === 'voiceBip') return 'Say the part that gets louder after dark. You do not have to polish it.';
    if (screen === 'comfort') return 'Dim the noise. Unclench your jaw. We can keep tonight simple.';
    return memory.emotion ? `${memory.emotion} is still awake too, huh? I’m right here.` : 'Still awake? I’m right here.';
  }

  if (screen === 'journal') return memory.topic ? `You brought up ${memory.topic} before. Start wherever your heart wants to start.` : 'Write it messy, love. Honest is enough.';
  if (screen === 'voiceBip') return memory.hasVoice ? 'You know this space. Say what you could not say anywhere else.' : 'Go on and say it, love. I’m listening.';
  if (screen === 'comfort') return memory.hasComfort ? 'You already found a little softness here. Let’s make some more room for it.' : 'Come here, love. We can slow the whole moment down.';
  if (memory.hasStreak) return `Look at you, still showing up. ${summary?.streakDays} days is something to be proud of.`;
  return memory.emotion ? `I remember ${memory.emotion} has been showing up. You do not have to act fine with me.` : 'Hey love, I’m here. You do not have to act fine with me.';
}
