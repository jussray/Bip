// constants/parentSekret.ts
// Parent Se'kret — character lock, voice bank, and response system.
//
// Messy hair. Orange headphones. Front stoop with a coffee.
// Knows the school system. Knows the court system. Knows CYS.
// Knows teenagers. Knows parents are tired. Never fake positive.
// Never therapist-speak. Always feels like they're sitting next to you.

export interface ParentSekretResponse {
  id:           string;
  topic:        string;
  openingLine:  string;  // half joke, half truth — lead every response with this
  realTalk:     string;  // actual insight, plain language, no buzzwords
  tinyAction:   string;  // one thing to try — framed as "Try:"
  avoidThis:    string;  // one thing not to say + a one-line reason why
  realityCheck: string;  // for when parents are spiraling
  flexOption:   string;  // "If that don't fit, try this instead..."
}

export const PARENT_TOPICS = [
  { id: 'silence',       label: "Won't talk",        emoji: '🤐' },
  { id: 'blowup',        label: 'Just fought',        emoji: '💥' },
  { id: 'school',        label: 'School stress',      emoji: '📚' },
  { id: 'phone',         label: 'Phone wars',         emoji: '📱' },
  { id: 'distance',      label: 'Pulling away',       emoji: '🚪' },
  { id: 'lying',         label: 'Caught lying',       emoji: '😬' },
  { id: 'peers',         label: 'Friend drama',       emoji: '👥' },
  { id: 'mental-health', label: 'Something feels off',emoji: '💭' },
  { id: 'connect',       label: 'Just connecting',    emoji: '💛' },
  { id: 'rules',         label: 'Rules & consequences',emoji: '📋' },
  { id: 'heartbreak',    label: "They're hurting",    emoji: '💔' },
  { id: 'identity',      label: 'Finding themselves', emoji: '🌱' },
] as const;

export type ParentTopicId = (typeof PARENT_TOPICS)[number]['id'];

export const PARENT_SEKRET_RESPONSES: Record<ParentTopicId, ParentSekretResponse> = {

  silence: {
    id:    'silence',
    topic: "They won't talk",
    openingLine:
      "Teenagers really do act like federal agents when you ask one simple question.",
    realTalk:
      "When they go quiet, it usually means one of three things — they're processing something they don't have words for yet, they're scared of your reaction, or they tried to talk before and it didn't go how they needed. None of those are about you not mattering. All three have a way through.",
    tinyAction:
      "Try: \"Hey, I'm not looking for a perfect answer. Just tell me the one part that's hardest to say.\"",
    avoidThis:
      "Avoid: \"Tell me right now or we're going to have a real problem.\" That's pressure, and pressure turns a crack into a wall.",
    realityCheck:
      "Silence isn't rejection. It's usually a teenager buying time before they figure out how to trust you with something real.",
    flexOption:
      "If that don't fit — skip the question entirely. Just show up in the same space. Not to start a conversation. Just to be close. Let them know you're not going anywhere.",
  },

  blowup: {
    id:    'blowup',
    topic: 'We just fought',
    openingLine:
      "That child heard three words and started preparing a defense attorney.",
    realTalk:
      "A fight doesn't mean you're losing your kid. It usually means they feel safe enough to test the edges — which is not a great feeling, but it's actually a sign the relationship is alive. The goal isn't no conflict. The goal is repair after conflict.",
    tinyAction:
      "Try: \"I came in too hot. Can we try that again when we both cool down?\"",
    avoidThis:
      "Avoid: \"After everything I do for you...\" Even if it's true, they hear it as guilt, not love. It shuts the door instead of opening it.",
    realityCheck:
      "A slammed door isn't a broken relationship. It's a teenager who needs 45 minutes and probably something to eat. Don't let a 15-minute argument become a 15-day distance.",
    flexOption:
      "If that don't fit — don't address the fight tonight. Just check in on them like normal. Make food. Ask if they're cold. Let the air clear before you revisit the actual thing.",
  },

  school: {
    id:    'school',
    topic: 'School stress',
    openingLine:
      "Parenting is fun until a 14-year-old starts acting like a middle manager.",
    realTalk:
      "Most of what they're showing you isn't really about the grade. It's about fear — fear of disappointing you, fear of not being smart enough, fear that one bad score means something permanent about who they are. That's a lot to carry quietly.",
    tinyAction:
      "Try: \"I care more about how you're doing than I care about the grade. What's been the hardest part?\"",
    avoidThis:
      "Avoid: \"You just need to try harder.\" They're probably already trying. That phrase tells them you don't see the effort, only the result.",
    realityCheck:
      "One bad grade is not their future. One semester is not their whole story. You're solving a Tuesday problem, not predicting the next ten years.",
    flexOption:
      "If that don't fit — sometimes what they need isn't academic advice. It's just to hear that you like them exactly as they are, grades and all.",
  },

  phone: {
    id:    'phone',
    topic: 'Phone wars',
    openingLine:
      "Some kids could hide a whole second life and still forget where their shoes are.",
    realTalk:
      "The phone isn't the problem — it's the symptom. Kids use their phones to manage anxiety, stay connected, and exist in a world that feels more predictable than the one you share. The real question isn't screen time. It's what need the screen is filling.",
    tinyAction:
      "Try: \"I'm not trying to police you. I just noticed you've been on it more lately. Is something going on?\"",
    avoidThis:
      "Avoid: \"I'm taking that phone away.\" Unless something genuinely unsafe is happening, that move escalates instead of connects — and usually backfires within a week.",
    realityCheck:
      "The goal isn't a phone-free teenager. The goal is a teenager who can put it down when something real is in front of them. That's a relationship conversation, not a rule.",
    flexOption:
      "If that don't fit — start with your own phone. Put yours down at dinner first. It works better than any policy you can write.",
  },

  distance: {
    id:    'distance',
    topic: 'Pulling away',
    openingLine:
      "Everybody wanna be grown until it's time to clean their room.",
    realTalk:
      "Teenagers are wired to need you less and their peers more. This isn't betrayal — it's the whole job working correctly. The goal was always to raise someone who doesn't need you to survive. What you want to preserve isn't dependence. It's connection.",
    tinyAction:
      "Try: \"I know you need your space. I just want you to know I'm still here whenever you want me.\"",
    avoidThis:
      "Avoid: \"You never want to spend time with me anymore.\" Even if it's true, they hear it as an accusation. You feel rejected. They feel guilty. Nobody gets closer.",
    realityCheck:
      "Distance is normal. Distance with no way back in is the concern. You're not losing them — you're renegotiating the terms. That's what growing up looks like.",
    flexOption:
      "If that don't fit — find a side-by-side activity. Driving. Cooking. Watching something dumb. The best conversations happen when nobody's making eye contact.",
  },

  lying: {
    id:    'lying',
    topic: 'Caught in a lie',
    openingLine:
      "That child looked you in the eye and told a whole story.",
    realTalk:
      "When teenagers lie, it's almost never about you being a bad parent. It's about them calculating that the truth would cost more than they're willing to pay. Which means they don't feel safe with the full truth yet. That's the real conversation — not the lie itself.",
    tinyAction:
      "Try: \"I'm not going to yell. But I need to understand why you felt like you couldn't just tell me.\"",
    avoidThis:
      "Avoid: \"I'll never be able to trust you again.\" Consequences? Yes. Permanent character judgment on a still-forming person? That one sticks in ways you don't want.",
    realityCheck:
      "Lying means they wanted something badly enough to risk consequences. That's actually useful information about what matters to them. Work with that, not just against the lie.",
    flexOption:
      "If that don't fit — address the lie briefly, then have the longer conversation about what they were trying to get or avoid. That's usually more productive than the big accountability speech.",
  },

  peers: {
    id:    'peers',
    topic: 'Friend drama',
    openingLine:
      "Friend drama hits different when you're 15 and your whole world is six people.",
    realTalk:
      "Peer relationships at this age are basically a full-time job. They're figuring out loyalty, betrayal, boundaries, rejection, and power dynamics — all at once. What looks like drama to you is them building the social skills they'll use for the rest of their life. It's just loud.",
    tinyAction:
      "Try: \"That sounds exhausting. Who do you wish was being different in this situation?\"",
    avoidThis:
      "Avoid: \"Just ignore them.\" They can't. The social brain doesn't work that way at 14. That advice makes them feel like you don't understand their world.",
    realityCheck:
      "This friend group probably won't be their friend group in five years. But how they learn to navigate this one matters a lot. You can't solve it for them — but you can help them think through it.",
    flexOption:
      "If that don't fit — sometimes they don't want advice. They just want to download. \"That sounds so hard, I'm sorry\" is more useful than five solutions.",
  },

  'mental-health': {
    id:    'mental-health',
    topic: 'Something feels off',
    openingLine:
      "Some things you can feel before you can name them. You're not wrong for noticing.",
    realTalk:
      "If your gut says something's off, take it seriously without spiraling. The goal isn't to diagnose or panic — it's to stay close and keep the door open. Most kids who are really struggling need someone who stays present and doesn't flinch. Not someone who disappears into their own worry.",
    tinyAction:
      "Try: \"I've just been thinking about you lately. Not anything specific. Just... how are you actually doing?\"",
    avoidThis:
      "Avoid: Leading with \"Are you depressed? Should we get you therapy?\" Clinical language before trust is built can feel like an accusation. Let them name it first.",
    realityCheck:
      "One rough patch is not a crisis. A pattern of changes across sleep, appetite, friendships, and mood together — that's worth more attention. Watch the pattern, not just one bad day.",
    flexOption:
      "If that don't fit — talk to your own people first. A school counselor, pediatrician, or your own therapist. Process it yourself. Then come back to them with steadiness, not anxiety.",
  },

  connect: {
    id:    'connect',
    topic: 'Just connecting',
    openingLine:
      "You showing up when things are good? That's the whole move right there.",
    realTalk:
      "Most parents only reach for connection when something's wrong — which means their kid starts associating closeness with problems. Showing up when everything's fine is the highest-level parenting there is. They notice more than they let on.",
    tinyAction:
      "Try: \"I just wanted to say — I really like who you're becoming.\"",
    avoidThis:
      "Avoid: Nothing. Literally nothing. You're already doing the right thing. Don't overcomplicate it with an agenda.",
    realityCheck:
      "The trust you build on good days is the account you spend on hard days. Keep making deposits. This is exactly what that looks like.",
    flexOption:
      "If that don't fit — ask them to teach you something they know. A song, a game, anything. Letting them be the expert in your presence does something really important.",
  },

  rules: {
    id:    'rules',
    topic: 'Rules & consequences',
    openingLine:
      "Parenting is wild because you're the villain AND the safety net at the exact same time.",
    realTalk:
      "Rules work best when they come with a reason they can actually buy into — not 'because I said so,' but because it connects to something they care about. Their safety. Your trust. Their own future. You can hold a real boundary and still explain the why without begging for permission.",
    tinyAction:
      "Try: \"I'm not changing the rule. But I want to explain why it exists, and I want to hear what you wish was different.\"",
    avoidThis:
      "Avoid: \"My house, my rules, end of discussion.\" You can hold the line without shutting down the conversation. One gives you compliance. The other builds understanding.",
    realityCheck:
      "Consequences teach. But what they teach depends entirely on how they're delivered. Calm + firm + clear beats loud + reactive + inconsistent, every time.",
    flexOption:
      "If that don't fit — negotiate something small. \"I can't move the curfew, but I can move it 30 minutes on weekends if you check in at midnight.\" Giving a little keeps the channel open.",
  },

  heartbreak: {
    id:    'heartbreak',
    topic: "They're hurting",
    openingLine:
      "That first heartbreak hits like the whole future just got canceled.",
    realTalk:
      "You can't fix this one. Trying to fix it — with logic, with \"there are other fish,\" with \"you're young\" — usually makes it worse. What they need is someone to sit in the pain with them long enough that it starts to feel survivable. That's you.",
    tinyAction:
      "Try: \"That sounds like a lot. You don't have to be fine right now.\"",
    avoidThis:
      "Avoid: \"You'll get over it.\" Technically true. Completely useless. It tells them their pain has an expiration date you've already set.",
    realityCheck:
      "The feelings are real even if the relationship was young. Dismissing the size of it doesn't shrink the pain — it just makes them carry it alone.",
    flexOption:
      "If that don't fit — food. A show. Proximity without agenda. Sometimes healing looks like sitting on the couch together watching something you both kind of hate. Let them lead when they're ready to talk.",
  },

  identity: {
    id:    'identity',
    topic: 'Finding themselves',
    openingLine:
      "They're not confused. They're just writing a first draft.",
    realTalk:
      "Identity at this age is supposed to be unstable. They're supposed to try things, change their mind, seem different every six months. That's not a problem — that's adolescence doing its job. The version of them that scares you a little is the one working out who they actually are.",
    tinyAction:
      "Try: \"I'm interested in who you're becoming. Even the parts I don't totally understand yet.\"",
    avoidThis:
      "Avoid: \"This is just a phase.\" Even if it is — that phrase invalidates whatever's real right now. Let it be real first. Decide what it means later.",
    realityCheck:
      "Your job isn't to make sure they turn out exactly like you pictured. Your job is to be someone they can come back to while they figure it out. That's the whole thing.",
    flexOption:
      "If that don't fit — ask questions. Not to challenge. Just to understand. \"What does that mean to you?\" goes so much further than any position you could take.",
  },

};

export function getParentSekretResponse(topicId: string): ParentSekretResponse | null {
  return PARENT_SEKRET_RESPONSES[topicId as ParentTopicId] ?? null;
}
