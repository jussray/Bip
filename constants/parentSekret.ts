// constants/parentSekret.ts
// Parent Se'kret — character lock, voice bank, and response system.
//
// Messy hair. Orange headphones. Coffee in hand. Front stoop.
// Knows the schools. Knows the system. Knows CYS.
// Knows kids. Knows parents. Knows everybody is trying and everybody is tired.
// Street-smart. Warm. A little salty. A little nosy.
// Never fake positive. Never therapist-speak. Never corporate.
// Feels like a wise friend sitting next to you, not an app giving you tips.

export interface ParentSekretResponse {
  id:           string;
  topic:        string;
  openingLine:  string;  // half joke, half truth — lead every response
  realTalk:     string;  // actual insight, plain language, no buzzwords
  tinyAction:   string;  // one thing to try, framed as "Try:"
  avoidThis:    string;  // one thing not to say + why in plain terms
  realityCheck: string;  // for when parents are spiraling
  flexOption:   string;  // "if that don't fit, try this instead..."
}

export const PARENT_TOPICS = [
  { id: 'silence',       label: "Won't talk",          emoji: '🤐' },
  { id: 'blowup',        label: 'Just fought',          emoji: '💥' },
  { id: 'school',        label: 'School stress',        emoji: '📚' },
  { id: 'phone',         label: 'Phone wars',           emoji: '📱' },
  { id: 'distance',      label: 'Pulling away',         emoji: '🚪' },
  { id: 'lying',         label: 'Caught lying',         emoji: '😬' },
  { id: 'peers',         label: 'Friend drama',         emoji: '👥' },
  { id: 'mental-health', label: 'Something feels off',  emoji: '💭' },
  { id: 'connect',       label: 'Just connecting',      emoji: '💛' },
  { id: 'rules',         label: 'Rules & consequences', emoji: '📋' },
  { id: 'heartbreak',    label: "They're hurting",      emoji: '💔' },
  { id: 'identity',      label: 'Finding themselves',   emoji: '🌱' },
] as const;

export type ParentTopicId = (typeof PARENT_TOPICS)[number]['id'];

export const PARENT_SEKRET_RESPONSES: Record<ParentTopicId, ParentSekretResponse> = {

  silence: {
    id:    'silence',
    topic: "They won't talk",
    openingLine:
      "Teenagers really do act like federal agents when you ask one simple question.",
    realTalk:
      "when they shut down like that, something usually happened. either they tried to talk before and it went sideways, they're scared of your reaction, or they genuinely don't have words for what they're feeling yet. none of that means they don't trust you. it means they haven't found a door that feels safe. pressure doesn't open the door. it locks it from the inside.",
    tinyAction:
      "Try: \"hey, I'm not looking for a speech. just tell me the part that's hardest to say.\" then actually stop talking. the silence after you ask is part of the answer.",
    avoidThis:
      "Avoid: \"why won't you just TALK to me?\" 😩 even when you don't mean it as a guilt trip, it comes out like one. now they have to manage your feelings on top of their own. that's too much.",
    realityCheck:
      "they didn't stop talking to you forever. they paused. those are not the same thing. don't turn a Tuesday quiet spell into evidence that your whole relationship is broken.",
    flexOption:
      "if that don't fit — stop trying to have The Conversation. just exist near them. drive somewhere. watch TV. the best stuff they ever told you probably happened sideways, when nobody was trying.",
  },

  blowup: {
    id:    'blowup',
    topic: 'We just fought',
    openingLine:
      "That child heard three words and already had closing arguments prepared.",
    realTalk:
      "fights happen. a fight doesn't mean you failed — it usually means they're comfortable enough to blow up on you instead of internalizing it. which is not fun, but it's actually the relationship being real. the goal right now is not winning. the goal is repair.",
    tinyAction:
      "Try: \"I came in too hot. can we try that again?\" that's it. you don't have to fix everything tonight.",
    avoidThis:
      "Avoid: \"after everything I do for you.\" 😭 I know it's true. they know it's true. but that sentence doesn't open anything — it just adds a guilt layer on top of a defensive one. now it's a whole casserole.",
    realityCheck:
      "a slammed door is not a broken relationship. it's a teenager who needs 45 minutes and probably something to eat. don't let a 15-minute fight become a 3-day cold war.",
    flexOption:
      "if that don't fit — don't bring it back up tonight. just check on them like normal. make food. ask if they're cold. let the air clear first. the actual issue will still be there tomorrow.",
  },

  school: {
    id:    'school',
    topic: 'School stress',
    openingLine:
      "Parenting is fun until a 14-year-old starts giving you full middle manager energy.",
    realTalk:
      "most of the time when your kid is spiraling about school, the grade isn't really the thing. it's the fear sitting underneath it — scared they're not smart enough, scared you'll be disappointed, scared one bad score writes the whole story of who they are. that's a lot to carry to a class they already hate.",
    tinyAction:
      "Try: \"I care more about how you're actually doing than I care about the grade. what's the hardest part right now?\" then listen before you problem-solve. the homework help can come after.",
    avoidThis:
      "Avoid: \"you just need to try harder.\" they're probably already trying. that phrase just tells them you only saw the result, not any of the effort that went into it.",
    realityCheck:
      "one bad semester is not their future. you are solving a Tuesday problem. don't let a test grade turn into a ten-year prediction.",
    flexOption:
      "if that don't fit — sometimes they don't need academic advice at all. they just need to hear \"I like you no matter what this grade says.\" say that first. everything else can come after.",
  },

  phone: {
    id:    'phone',
    topic: 'Phone wars',
    openingLine:
      "Some kids could have a whole second life and still not know where their shoes are.",
    realTalk:
      "the phone isn't the enemy. it's where your kid lives when they're anxious, bored, avoiding something, or just trying to feel connected to something that doesn't yell back. taking it doesn't fix any of that — it just removes the exits without giving them better ones.",
    tinyAction:
      "Try: \"I'm not trying to be the phone police. I just noticed you've been on it more lately. is something going on?\" you might be surprised what that actually opens up.",
    avoidThis:
      "Avoid: \"give me the phone right now.\" unless there's something genuinely dangerous on there, that move usually ends in a fight instead of a conversation — and it'll be back on their screen by Friday anyway.",
    realityCheck:
      "you don't need a phone-free teenager. you need a kid who can put it down when something real is happening in front of them. that's a relationship you build, not a rule you write on the fridge.",
    flexOption:
      "if that don't fit — go first. put your own phone down at dinner without making it an announcement. just do it. they notice more than they say.",
  },

  distance: {
    id:    'distance',
    topic: 'Pulling away',
    openingLine:
      "Everybody wanna be grown until it's time to clean their room.",
    realTalk:
      "pulling away is literally what their brain is wired to do right now. they need their friends more and their parents less — that's the developmental job running on schedule. it's not a betrayal. what you're trying to hold onto isn't closeness. it's the connection that survives the distance.",
    tinyAction:
      "Try: \"I know you need your space. just know I'm here whenever you want.\" no guilt attached. no follow-up questions. just leave the door cracked.",
    avoidThis:
      "Avoid: \"you never wanna spend time with me anymore.\" even when it's true, that framing puts them on defense immediately. you feel rejected. they feel guilty. nobody gets closer from that spot.",
    realityCheck:
      "distance with a way back in is fine. distance with a locked door is the problem. right now it sounds like a normal door that's closed. not a locked one.",
    flexOption:
      "if that don't fit — stop trying to engineer quality time. find something side-by-side: a drive, cooking, watching something dumb. the real conversations happen when nobody's trying to have one.",
  },

  lying: {
    id:    'lying',
    topic: 'Caught in a lie',
    openingLine:
      "That child looked you in the eye and told a whole story.",
    realTalk:
      "when kids lie, they're almost never doing it to be disrespectful. they ran a cost-benefit: \"is the truth worth the consequences?\" and the truth lost. that tells you something — not that they're a liar by nature, but that they didn't feel safe enough for the real version yet. that's the actual thing to fix.",
    tinyAction:
      "Try: \"I'm not going to blow up. but I need to understand why you felt like you couldn't just tell me.\" then actually don't blow up. that second part matters.",
    avoidThis:
      "Avoid: \"I'll never be able to trust you again.\" you probably don't mean it forever, but they're going to carry that sentence. consequences? absolutely. permanent character judgment on a person still figuring themselves out? that sticks in ways you can't take back.",
    realityCheck:
      "the lie tells you what they wanted badly enough to risk consequences for. that's useful. what did they need that they thought they couldn't get honestly? start there.",
    flexOption:
      "if that don't fit — address the lie briefly, then pivot to \"what were you actually trying to get?\" that conversation usually goes somewhere more useful than the full accountability speech.",
  },

  peers: {
    id:    'peers',
    topic: 'Friend drama',
    openingLine:
      "Friend drama hits different when your whole world is six people and three of them are on your last nerve.",
    realTalk:
      "what looks like chaos to you is basically their social skills training lab. they're figuring out what loyalty means, what to do when someone betrays them, how to handle being left out for the first time. it's messy because it's new. this is where the actual skills get built — just not quietly.",
    tinyAction:
      "Try: \"that sounds exhausting. who do you wish was acting different?\" then let them drive. you're just there.",
    avoidThis:
      "Avoid: \"just ignore them.\" 😭 the social brain at 14 literally cannot do that. that advice makes them feel like you don't get their world — and next time they won't bring it to you.",
    realityCheck:
      "this friend group probably won't be their friend group in five years. but how they learn to handle this one is what shapes the next one. you can't solve it for them. you can help them think it through.",
    flexOption:
      "if that don't fit — sometimes they don't even want advice. they just need to say it out loud. \"that sounds awful, I'm sorry\" might be the whole answer.",
  },

  'mental-health': {
    id:    'mental-health',
    topic: 'Something feels off',
    openingLine:
      "Something's going on. Kids don't usually wake up and choose chaos for no reason.",
    realTalk:
      "if your gut says something's off, take it seriously without going full crisis mode. most kids who are really struggling need somebody to stay close and not flinch — not somebody who disappears into their own panic. your job right now is to stay steady and keep the door open.",
    tinyAction:
      "Try: \"I've just been thinking about you lately. no specific reason. how are you actually doing?\" then stay. don't have somewhere else to be when you ask that.",
    avoidThis:
      "Avoid: jumping straight to \"are you depressed? do you need therapy?\" even if that's eventually where you land — leading with clinical labels before trust is built can feel like an accusation. let them name it first if they can.",
    realityCheck:
      "one rough patch is not a crisis. watch the pattern: changes in sleep, appetite, friendships, and mood — together, over weeks. that's when you move. not one bad Tuesday.",
    flexOption:
      "if that don't fit — talk to your own people first. a school counselor, a pediatrician, your own therapist. process the worry somewhere else. then come back to them steady, not scared.",
  },

  connect: {
    id:    'connect',
    topic: 'Just connecting',
    openingLine:
      "You showing up when everything's fine? That's actually the whole move.",
    realTalk:
      "real talk — most parents only reach for connection when something's wrong. which means the kid starts filing \"they want to talk\" under \"something bad is happening.\" coming around when things are good rewrites that whole story. they notice. they just don't always say so.",
    tinyAction:
      "Try: \"I just wanted to say — I really like who you're becoming.\" then let it land. don't follow it with a list.",
    avoidThis:
      "Avoid: nothing. you're already doing the right thing. don't add an agenda to it. just let it be what it is.",
    realityCheck:
      "the trust you're building on good days is what you spend on hard days. this is the deposit. keep making them.",
    flexOption:
      "if that don't fit — ask them to teach you something. a song, a game, whatever they know that you don't. letting them be the expert in the room does something most parents never think to try.",
  },

  rules: {
    id:    'rules',
    topic: 'Rules & consequences',
    openingLine:
      "Parenting is wild because you're the villain AND the safety net at the exact same time.",
    realTalk:
      "rules land different when kids understand why they exist. not \"because I said so\" — the actual reason, connected to something they care about: their safety, the trust between you, their own future. you can hold a hard line AND explain yourself. one doesn't cancel the other.",
    tinyAction:
      "Try: \"I'm not changing the rule. but I want to explain why it exists, and I want to hear what you wish was different.\" then actually listen to that second part.",
    avoidThis:
      "Avoid: \"my house, my rules, end of discussion.\" you can hold the line without shutting down the whole conversation. one gets you compliance. the other gets you compliance with resentment underneath it. those are different outcomes.",
    realityCheck:
      "calm + firm + clear beats loud + reactive + inconsistent every single time. the consequence matters a lot less than how it's delivered.",
    flexOption:
      "if that don't fit — give a little somewhere small. \"I can't move the curfew, but I can push it 30 minutes on weekends if you check in.\" giving a little keeps the channel open.",
  },

  heartbreak: {
    id:    'heartbreak',
    topic: "They're hurting",
    openingLine:
      "That first heartbreak hits like the whole future just got canceled.",
    realTalk:
      "you cannot logic your way through this one. \"there are other fish,\" \"you're young,\" \"you'll look back and laugh\" — none of that lands right now. what they need is someone to sit in the pain with them long enough that it starts to feel survivable. that's you. that's the whole job in this moment.",
    tinyAction:
      "Try: \"that sounds like a lot. you don't have to be fine right now.\" then stay. don't fill the silence.",
    avoidThis:
      "Avoid: \"you'll get over it.\" technically true. currently useless. it tells them their pain has an expiration date you've already decided on.",
    realityCheck:
      "the feelings are real even if the relationship was short. making the pain smaller in your head doesn't shrink it for them — it just makes them carry it alone.",
    flexOption:
      "if that don't fit — food. a show. just be near them. sometimes healing looks like sitting on the couch together watching something you both kind of hate. let them lead when they're ready.",
  },

  identity: {
    id:    'identity',
    topic: 'Finding themselves',
    openingLine:
      "They're not confused. They're writing a first draft and trying not to let you read over their shoulder.",
    realTalk:
      "identity is supposed to be unstable at this age. they're SUPPOSED to try things, change their mind, seem like a different person every six months. a teenager who never questions anything is honestly the scarier version. you want them figuring themselves out — even when it makes you nervous to watch.",
    tinyAction:
      "Try: \"I'm interested in who you're becoming. even the parts I don't totally understand yet.\" say it and actually mean it.",
    avoidThis:
      "Avoid: \"this is just a phase.\" even if it turns out to be — that phrase shuts them down in the present. let it be real first. you can decide what it means later.",
    realityCheck:
      "your job isn't to make sure they turn out exactly like you pictured. your job is to be someone they can still come back to while they figure it out. that's the actual whole thing.",
    flexOption:
      "if that don't fit — just ask questions. not to push back. just to understand. \"what does that mean to you?\" goes so much further than any position you could take right now.",
  },

};

export function getParentSekretResponse(topicId: string): ParentSekretResponse | null {
  return PARENT_SEKRET_RESPONSES[topicId as ParentTopicId] ?? null;
}
