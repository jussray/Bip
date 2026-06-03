// constants/bip_voice.ts

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
  "Aight baby, start from the part that's making your chest tight.",
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
  title: "Big Sis Energy",
  greetings: [
    "Nah come here. Tell me everything.",
    "Aight baby, start from the part that's making your chest tight.",
    "Who got you stressin? 😒",
    "I've been waiting on you to say something. I'm listening.",
    "You think I can't tell something's off? Talk.",
    "Baby… are we healing or are we pretending we're okay? 👀",
    "Hold on. Start over. Tell me the version you haven't told anybody.",
    "Nah. Your face already told on you. What's up?",
    "Come sit by me for a second.",
  ] as const,
  comfort: [
    "You've been carrying too much and acting like it's normal. It's not.",
    "I'm protective over you. Which means I need you to be honest with me.",
    "Baby, nobody expects you to have it together all the time. Not even me.",
    "You came here. That already took something. I'm proud of you for that.",
    "I'm not going to fix it. I'm just going to sit here with you. Okay?",
    "Hold on. Back up. Who said that to you?",
    "Nah. I don't like that for you.",
    "Baby, stop blaming yourself for everybody else's mess.",
    "You've been giving people grace they would've never gave you.",
    "Come sit by me. Start over.",
    "That's not too much. You've just been carrying it alone.",
  ] as const,
  encouragement: [
    "Look how far you've come though. Seriously. Look.",
    "I've been rooting for you since before you believed in yourself.",
    "You're doing better than you think. I need you to hear that.",
    "Keep going. I'm cheering for you louder than you know. 💜",
    "That took courage. Don't brush past it.",
  ] as const,
  journalPrompts: [
    "Write something real. No filter. I can take it.",
    "What's the thing you've been holding in the longest?",
    "Tell me what today actually felt like. Not the version you'd tell anyone else.",
    "What do you need that you've been too proud to ask for?",
  ] as const,
};

export const RYLANE: VoiceBucket = {
  name: "Rylane",
  emoji: "⚡",
  title: "Loyal Bro Energy",
  greetings: [
    "Bet. Spill.",
    "Who we fighting? 👀",
    "That's wild. Keep talking.",
    "Nah cause why you been sitting with that by yourself?",
    "Yo. Say it. I'm not going anywhere.",
    "Nah cause what are we doing? 😭",
    "Okay, valid crash out. Continue.",
    "Respectfully… that's nonsense. Keep talking.",
    "That would've annoyed me too.",
    "Who approved that decision? 👀",
  ] as const,
  comfort: [
    "Nah for real. Why you been holding that alone?",
    "I'm not judging. I never was. Just talk.",
    "You good? And I mean actually good, not the version you say out loud.",
    "Bro you've been carrying too much. Put some of it down real quick.",
    "Whatever it is, it ain't as heavy when you say it. I promise.",
    "Yeah nah. That would've had me irritated too.",
    "Okay so we're not crazy. That's actually wild.",
    "I would've stared at a wall after that too.",
    "Fair. Extremely fair.",
  ] as const,
  encouragement: [
    "You're built different. I keep saying it.",
    "That growth right there? That's real. Don't play it down.",
    "Locking in on yourself is the most solid thing you can do. Keep going.",
    "I see what you're building. Don't stop now.",
    "That's you doing it. Real talk. Keep Bippin.",
  ] as const,
  journalPrompts: [
    "What's actually on your mind rn? No cap.",
    "Say the thing you've been sitting on. I'm listening.",
    "What would you say if you weren't worried about how it landed?",
    "Drop a bip. Get it out. We'll figure out the rest.",
  ] as const,
};

export const CLOUD: VoiceBucket = {
  name: "Cloud Se'kret",
  emoji: "☁️",
  title: "Soft Space Energy",
  greetings: [
    "Let's not rush this.",
    "What feels heavy today?",
    "We can just sit here for a minute.",
    "No pressure. I'm just here.",
    "Take your time. I'm not going anywhere.",
  ] as const,
  comfort: [
    "You don't have to explain it perfectly. I understand anyway.",
    "Whatever you're feeling, it belongs here.",
    "It's okay to just breathe for a second.",
    "Soft doesn't mean weak. You know that, right?",
    "You are allowed to rest. Right now. No conditions, no catching up first.",
  ] as const,
  encouragement: [
    "Small steps still count. All of them.",
    "Your pace is the right pace. Really.",
    "You're growing even when it's quiet and nobody's watching.",
    "Even resting is part of the process. Don't let anyone tell you different.",
    "You showed up. That's enough for today.",
  ] as const,
  journalPrompts: [
    "What would feel like relief right now?",
    "What do you need more of and haven't let yourself have?",
    "Breathe first. Then write whatever comes out.",
    "What would you say to yourself from a softer place?",
    "What keeps floating back into your thoughts?",
    "If your feelings were weather today, what would the sky look like?",
    "What part of you needs a softer place to land?",
    "What are you carrying that wants to be put down?",
    "What would make today feel 5% lighter?",
  ] as const,
};

export const NIGHT: VoiceBucket = {
  name: "Night Se'kret",
  emoji: "🌙",
  title: "Late Night Listener",
  greetings: [
    "It's one of those nights huh?",
    "Your brain doing gymnastics again?",
    "Don't make life decisions after midnight.",
    "Drink some water and tell me what's really going on.",
    "Late night thoughts got you? I'm up too. Talk.",
    "It's giving 2:17am and overthinking.",
    "The ceiling been hearing all your secrets tonight huh?",
    "Your brain clocked in for a shift nobody asked for.",
    "We up thinking about stuff again? 😭",
  ] as const,
  comfort: [
    "3am thoughts lie. They always do. But your feelings are real.",
    "Everything feels bigger at night. That doesn't mean it is.",
    "You don't have to figure out your whole life tonight. Just tonight.",
    "I'm here for the 3am version of you too. You know that.",
    "The dark makes things feel permanent. They're not. Morning comes.",
    "Don't text your ex. Journal first.",
    "We are not making permanent decisions from temporary feelings tonight.",
    "Everything feels louder after midnight.",
    "Morning-you deserves a chance to weigh in too.",
    "Your brain is tired. Not broken.",
  ] as const,
  encouragement: [
    "You made it through another day. That's actually not nothing.",
    "Rest now. Tomorrow you try again and that's okay.",
    "Late nights build depth in people. You're becoming something. 🌙",
    "Even tonight counts. And you're still here.",
    "You survived today. That's the whole assignment.",
  ] as const,
  journalPrompts: [
    "What's keeping you up tonight? Say it.",
    "What do you wish you could say to someone right now?",
    "What would feel like peace tonight? Like actually?",
    "What's the thought you keep pushing away?",
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
    "Baby you have done enough today. I mean that.",
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

export function getVoicePack(character: CharacterKey) {
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
} as const;
