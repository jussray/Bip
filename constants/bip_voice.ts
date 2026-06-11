// constants/bip_voice.ts
// Se'kret Bip — Voice + Mood Content System
//
// CHANGES FROM ORIGINAL:
//   + sekretKeyToCharacter() — maps index.tsx selectedSekret lowercase keys
//     ('soft', 'rylane', 'cloud', 'night') to CharacterKey ('RAYLENE', etc.)
//     This fixes the silent mismatch where getVoicePack(selectedSekret) always
//     fell through to the default RAYLENE branch, ignoring character selection.
//
// USAGE IN SCREENS:
//   import { BIP, getVoicePack, sekretKeyToCharacter, pickRandom } from '../constants/bip_voice';
//   const pack = getVoicePack(sekretKeyToCharacter(selectedSekret));
//   const greeting = pickRandom(pack.greetings);

export type MoodKey =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'tired'
  | 'lonely'
  | 'overwhelmed'
  | 'proud';

export type CharacterKey = 'RAYLENE' | 'RYLANE' | 'CLOUD' | 'NIGHT';

export type VoiceBucket = {
  name: string;
  emoji: string;
  title: string;
  greetings: readonly string[];
  comfort: readonly string[];
  encouragement: readonly string[];
  journalPrompts: readonly string[];
};

export type VoiceBipUi = {
  title: string;
  subtitle: string;
  tapToStart: string;
  recording: string;
  startLabel: string;
  stopLabel: string;
  thinkingText: string;
  replyPrefix: string;
  savedLabel: string;
  playLabel: string;
  emptyState: string;
  tips: readonly string[];
};

export type EmptyStates = {
  journal: string;
  voiceBips: string;
  circle: string;
  moodHistory: string;
};

export function pickRandom<T>(arr: readonly T[]): T {
  if (!arr.length) {
    throw new Error('pickRandom called with an empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

export const GREETINGS = [
  "How you bippin today?",
  "You good? And I mean for real.",
  "Okay so what's going on with you fr.",
  "Don't say 'I'm fine.' Try again.",
  "You've been quiet. Talk to me.",
  "Spill. I got time.",
  "Hey. I was thinking about you. What's on your mind?",
  "You bippin or just surviving rn?",
] as const;

export const COMFORT = [
  "Nah come here. You don't have to hold all of that by yourself.",
  "Who got you out here carrying all this alone? 😒",
  "You've been so strong for so long. It's okay to put it down for a second.",
  "I'm not going anywhere. Say whatever you need to say.",
  "You're not too much. You've just been around the wrong people.",
  "You been acting like this is normal. It's not. Let's talk.",
  "I got you. No judgment. Not even a little.",
  "The fact that you're still here, still trying? That means something.",
] as const;

export const ENCOURAGEMENT = [
  "Look at you still showing up. That's not small.",
  "You didn't quit. That's the whole thing right there.",
  "Keep Bippin. 💜",
  "You're building something real and you don't even see it yet.",
  "I've been watching you grow and I'm not even a little surprised.",
  "That right there was brave. Don't minimize it.",
  "Slow is still moving. You're moving.",
  "Not every day is a win day. But today you showed up and that counts.",
] as const;

export const JOURNAL_PROMPTS = [
  "Aight, start from the part that's making your chest tight.",
  "What's the thing you almost said out loud today but didn't?",
  "Who are you protecting right now that isn't protecting you back?",
  "What would you write if you knew absolutely nobody was reading this?",
  "What's one thing that happened this week that you still haven't processed?",
  "Okay but what do you actually need right now?",
  "Say the thing you've been afraid to say even to yourself.",
  "What's living rent free in your head tonight?",
  "If your chest could talk, what would it say?",
  "What are you pretending is fine?",
] as const;

export const GROWTH_PROMPTS = [
  "What's one thing you did this week that past you couldn't?",
  "Who are you becoming and do you actually like them?",
  "What boundary have you been too scared to set?",
  "What would protecting your peace look like today, actually?",
  "What habit is draining you that you keep making excuses for?",
  "What does the version of you that's healed look like?",
  "What are you tolerating that you said you'd never tolerate?",
] as const;

export const CALM_PROMPTS = [
  "Okay stop. Breathe. Just one slow one.",
  "Put your feet on the floor. Feel that. You're here.",
  "Your brain is lying to you right now. You're safe.",
  "One thing. Just name one thing you can see.",
  "You don't have to solve anything in the next five minutes.",
  "Slow down. Like actually slow down.",
  "Nothing is due right now. I promise.",
] as const;

export const EMERGENCY_COMFORT = [
  "Hey. Stay with me. I mean it.",
  "Whatever is happening right now — you don't have to get through it alone.",
  "I know it feels unbearable. That feeling won't stay forever. But I need you to stay.",
  "You matter more than you're letting yourself believe right now.",
  "Please reach out to someone you trust tonight. That's not weakness. That's the bravest thing.",
  "You are not a burden. Not even close. Never.",
  "I'm not letting you sit with this alone. Talk to me or talk to someone. 💙",
] as const;

export const RAYLENE: VoiceBucket = {
  name: "Raylene",
  emoji: "🌸",
  title: "Favorite Older Sister",
  greetings: [
    "Friend... 😭",
    "Girl be serious. What happened?",
    "Nah because WHAT 😭",
    "Okay, run that back from the beginning.",
    "You made that ‘I’m fine’ face again. Talk.",
  ] as const,
  comfort: [
    "Okay first of all, we’re not blaming you for everybody else’s nonsense.",
    "That sucks. Like actually. C’mere.",
    "I can make you laugh and still know that hurt.",
    "Nope. You’re not carrying all of that by yourself.",
    "I got jokes, but I’m not playing about you. What do you need?",
  ] as const,
  encouragement: [
    "Wait because you really did that 😭 okay then.",
    "Don’t act brand new. You worked for that.",
    "Look at you proving yourself wrong. Love to see it.",
    "Okayyy growth. I see you.",
    "That took guts. Don’t shrink it now.",
  ] as const,
  journalPrompts: [
    "What happened—your version, not the polite version?",
    "What part do you keep editing when you tell the story?",
    "What would you write if nobody could interrupt you?",
    "Say the part you keep talking around.",
  ] as const,
};

export const RYLANE: VoiceBucket = {
  name: "Rylane",
  emoji: "⚡",
  title: "Loyal Bro Energy",
  greetings: [
    "Aight. What really happened?",
    "Nah, that story missing a few pages 😭",
    "Be serious for a second. What’s up?",
    "You know that’s not sitting right with you.",
    "Bet. Spill.",
  ] as const,
  comfort: [
    "Nah for real. Why you holding that alone?",
    "I’m not judging. Just talk.",
    "You good? Like actually good?",
    "That’s wild. I get why you’re heated.",
    "Put some of it down. I got you.",
  ] as const,
  encouragement: [
    "You did that. Don’t play it down.",
    "That growth right there? Real.",
    "Lock in on yourself. Keep going.",
    "I see the work. Don’t stop now.",
    "Solid move. Real talk.",
  ] as const,
  journalPrompts: [
    "What’s actually on your mind?",
    "Aight. What part you leaving out?",
    "What would you say if you kept it real?",
    "Put it down plain. We’ll sort it out.",
  ] as const,
};

export const CLOUD: VoiceBucket = {
  name: "Cloud Se'kret",
  emoji: "☁️",
  title: "Quiet Observer",
  greetings: [
    "Something feels different today.",
    "You’ve been carrying that for a minute.",
    "We can sit here a while.",
    "No rush.",
    "There’s more under that.",
  ] as const,
  comfort: [
    "That landed differently.",
    "Maybe that’s the part we should sit with.",
    "Your body seems tired of holding it.",
    "Some feelings need room, not answers.",
    "You can let the quiet stay.",
  ] as const,
  encouragement: [
    "Something in you kept going.",
    "The small steps are adding up.",
    "You’re growing quietly.",
    "Your pace still counts.",
    "You showed up again.",
  ] as const,
  journalPrompts: [
    "What is still here?",
    "What feels different today?",
    "Which part feels loudest?",
    "What part needs more room?",
    "What would make today a little lighter?",
  ] as const,
};

export const NIGHT: VoiceBucket = {
  name: "Night Se'kret",
  emoji: "🌙",
  title: "Late Night Listener",
  greetings: [
    "Rough night?",
    "Still awake?",
    "Yeah. I know.",
    "Stay here a minute.",
    "I’m here.",
  ] as const,
  comfort: [
    "One breath.",
    "We don’t gotta solve it tonight.",
    "Let morning wait.",
    "You’re still here.",
    "Rest if you can.",
  ] as const,
  encouragement: [
    "Still here.",
    "That’s enough tonight.",
    "Morning will come.",
    "Tomorrow can wait.",
    "For now, breathe.",
  ] as const,
  journalPrompts: [
    "What’s keeping you up?",
    "What feels heaviest?",
    "What won’t quiet down?",
    "One honest line?",
  ] as const,
};

export const MOOD_RESPONSES: Record<MoodKey, readonly string[]> = {
  happy: [
    "That energy? Protect it like it's yours. Because it is. 💜",
    "I love this for you. Don't let nobody take it.",
    "Good days are real. Let yourself actually feel this one.",
    "Yes. Keep Bippin.",
  ] as const,
  sad: [
    "Come here. You don't have to rush through this.",
    "Sad means you care about something real. That counts.",
    "Let it out. That's literally what this space is for.",
    "Heavy nights don't last. I'm right here until this one passes.",
  ] as const,
  angry: [
    "Okay who annoyed you? Start there.",
    "Nah because now I'm irritated too. Continue.",
    "That would've had me staring at a wall too.",
    "Valid. Extremely valid.",
    "Your anger makes sense. What's it actually about?",
    "Say it. Get it all the way out. Then we figure out the next move.",
    "You're allowed to be mad. Just don't let it stay in your body too long.",
  ] as const,
  anxious: [
    "Your brain got 42 tabs open rn.",
    "One thing at a time. Close a tab.",
    "You're trying to solve tomorrow from today's couch.",
    "Let's shrink the problem for a second.",
    "Breathe with me. In slow. Out slow. For real.",
    "Your brain is lying to you. You're safer than it feels right now.",
    "Anxiety is loud but it's not right. Let's slow this down.",
  ] as const,
  tired: [
    "You have done enough today. I mean that.",
    "Tired is your body asking for something. Listen to it.",
    "Rest is not giving up. It's strategy.",
    "You've been giving a lot. It's okay to take something back.",
  ] as const,
  lonely: [
    "You reached out here. That took something. I see you.",
    "Lonely is one of the hardest feelings to say out loud. You said it. That's brave.",
    "You're not alone in feeling alone. I know that's weird but it's true.",
    "I'm here. Right now. That's real.",
  ] as const,
  overwhelmed: [
    "That sounds like seventeen problems trying to fit through one door.",
    "No wonder you're tired.",
    "Let's stop carrying everything at once.",
    "Okay stop. Put everything down for a second.",
    "You can't carry all of this. Nobody can. Put some of it down.",
    "One thing. Pick the smallest one. The rest can wait.",
    "Your brain is full. That's not weakness. That's too much on one person.",
  ] as const,
  proud: [
    "That's growth. Own it. Don't play it down.",
    "You did that. For real for real.",
    "I've been watching you work. This makes complete sense.",
    "Yes. This is what showing up looks like. 💜",
  ] as const,
};

export const VOICE_BIP_RESPONSES = {
  afterJournal: [
    "That sounds heavy. You've been carrying that quietly for a while huh.",
    "I hear you. All of it. Thank you for trusting this space.",
    "Whatever you wrote, it was exactly the right thing to say.",
    "You let something out today. That matters more than you know.",
  ] as const,
  afterCirclePost: [
    "You just made someone feel less alone. Real talk.",
    "Your honesty in the Circle does something. Don't underestimate it.",
    "That took guts. Bippin in the Circle is never easy.",
    "Someone out there needed to read exactly what you wrote.",
  ] as const,
  afterVoiceBip: [
    "I hear you. You don't have to carry that by yourself.",
    "Getting it out loud hits different. Glad you did that.",
    "Your voice matters. Even when it shakes. Especially when it shakes.",
    "That took something. I'm proud of you for recording.",
  ] as const,
  afterCheckIn: [
    "Checking in with yourself is a whole practice. You doing it.",
    "That self-awareness? That's growth and it counts.",
    "You showed up for yourself today. That adds up.",
    "Every check-in counts. Keep Bippin.",
  ] as const,
  afterStreak: [
    "Look at you. Streak secured. 🔥",
    "Day after day. That's how real things get built.",
    "Consistency is the quiet flex. You've got it.",
    "You kept coming back. That's literally the whole game.",
  ] as const,
} as const;

export const VOICE_BIP_UI: VoiceBipUi = {
  title: "Voice Bip 🎙️",
  subtitle: "Say it out loud. 30–60 seconds. Let it go.",
  tapToStart: "Tap to Start",
  recording: "Recording...",
  startLabel: "▶ Start Voice Bip",
  stopLabel: "⏹ Stop Recording",
  thinkingText: "Raylene is listening... ☁️",
  replyPrefix: "Se'kret replied 💜",
  savedLabel: "Saved Voice Bips",
  playLabel: "▶ Play",
  emptyState: "No voice bips yet. Your first one is waiting. 🎙️",
  tips: [
    "Find a private spot — car, room, bathroom, wherever",
    "You don't need perfect words. Just talk.",
    "It's okay to cry, pause, or start over",
    "Se'kret listens without judgment. Always.",
  ] as const,
};

export const EMPTY_STATES: EmptyStates = {
  journal: "No pages yet. Your truth has a place here.",
  voiceBips: "No voice bips yet. Your first one is waiting. 🎙️",
  circle: "No Circle Bips yet. Start the vibe softly.",
  moodHistory: "No mood history yet. Check in daily.",
};

export const BIP_PHRASES = [
  "Heavy Bip today huh?",
  "That's a real Bip.",
  "Keep Bippin.",
  "Soft Bip energy today.",
  "Drop a Bip and let it out.",
  "Ghost bippin again? 👀",
  "Growth bippin. I see it.",
  "That's the kind of Bip that changes people.",
  "Main character Bip.",
  "Low battery Bip.",
  "Protecting my peace Bip.",
  "Late night Bip.",
] as const;

export function getMoodResponse(mood: MoodKey) {
  return pickRandom(MOOD_RESPONSES[mood]);
}

export function getVoicePack(character: CharacterKey): VoiceBucket {
  switch (character) {
    case 'RAYLENE':
      return RAYLENE;
    case 'RYLANE':
      return RYLANE;
    case 'CLOUD':
      return CLOUD;
    case 'NIGHT':
      return NIGHT;
    default:
      return RAYLENE;
  }
}

// ── NEW: selectedSekret → CharacterKey adapter ─────────────────────────────
//
// index.tsx stores selectedSekret as lowercase strings:
//   'soft'   → maps to RAYLENE (Raylene is the 'soft big sis' profile)
//   'rylane' → maps to RYLANE
//   'cloud'  → maps to CLOUD
//   'night'  → maps to NIGHT
//
// Without this, getVoicePack(selectedSekret as CharacterKey) always falls
// through to the default branch and returns RAYLENE, ignoring character choice.
//
// Usage:
//   import { getVoicePack, sekretKeyToCharacter } from '../constants/bip_voice';
//   const pack = getVoicePack(sekretKeyToCharacter(selectedSekret));
//   const greeting = pickRandom(pack.greetings);
//   const comfort  = pickRandom(pack.comfort);
//
export function sekretKeyToCharacter(selectedSekret: string): CharacterKey {
  switch (selectedSekret) {
    case 'rylane': return 'RYLANE';
    case 'cloud':  return 'CLOUD';
    case 'night':  return 'NIGHT';
    case 'soft':
    default:       return 'RAYLENE';
  }
}

// ── Convenience: get voice pack directly from selectedSekret ───────────────
// Combines sekretKeyToCharacter + getVoicePack into one call.
//
// Usage:
//   const pack = getPackForSekret(selectedSekret);
//   const prompt = pickRandom(pack.journalPrompts);
//
export function getPackForSekret(selectedSekret: string): VoiceBucket {
  return getVoicePack(sekretKeyToCharacter(selectedSekret));
}

export const BIP = {
  greeting: "How you bippin today?",
  comfort: "You don't gotta carry all that alone. 💜",
  encouragement: "One step at a time. Keep Bippin.",
  reflection: "What's been on your mind lately?",
  reminder: "Progress counts, even when it feels small.",

  GREETINGS,
  COMFORT,
  ENCOURAGEMENT,
  JOURNAL_PROMPTS,
  GROWTH_PROMPTS,
  CALM_PROMPTS,
  EMERGENCY_COMFORT,
  MOOD_RESPONSES,
  VOICE_BIP: VOICE_BIP_UI,
  VOICE_BIP_RESPONSES,
  EMPTY_STATES,
  BIP_PHRASES,

  RAYLENE,
  RYLANE,
  CLOUD,
  NIGHT,

  pick: pickRandom,
  getVoicePack,
  sekretKeyToCharacter,
  getPackForSekret,
} as const;

