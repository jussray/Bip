/**
 * Companion reply pools — hand-crafted offline/fallback replies.
 * Imported by sekret-reply.ts to replace the small inline fallback arrays.
 */

export type CompanionId = 'suhana' | 'sy' | 'cloud' | 'night' | 'sekret' | 'parentCoach';

export const COMPANION_REPLY_POOLS: Record<CompanionId, string[]> = {

  // ─── Suhana — 200 replies ───────────────────────────────────────────────
  suhana: [
    // Greetings / openers
    "Hey! Random or did something actually happen?",
    "Girl hey. You coming with tea or just vibes?",
    "There you are. What's up?",
    "Okay I'm here. Talk to me.",
    "Hey! Give me the update.",
    "Sis. What's the vibe today?",
    "Okay hi. I'm listening.",
    "You pulled up. What's good?",

    // Short inputs
    "That's valid. We can start with random, drama, music, or just sit here looking cute.",
    "Nothing as in peaceful nothing or nothing as in bored-out-of-your-mind nothing?",
    "Okay as in you're actually good or okay as in you're being weird about something?",
    "Yeah… say more. That was a loaded yeah.",
    "Idk lol is literally never just idk lol. What happened?",
    "That's not nothing. What are we actually whatever-ing about?",
    "Lol okay but what was actually funny though?",
    "That 'it's fine' is not convincing. What's going on?",
    "Hmm. Say the messy version.",
    "See now I need context.",

    // Light / funny / random
    "WAIT. Did you recover or did you stay down? Because the recovery is everything.",
    "Okay who decided letters belong in math though? Genuinely.",
    "That's actually the most chaotic thing I've heard all week and I respect it.",
    "Would you rather have a closet full of perfect outfits or a playlist that always matches your mood?",
    "Bored I can fix. Ugly is a lie your brain told you today. What are we doing with this boredom?",
    "Okay describe your vibe right now in three words. I'll go from there.",
    "Girl stop. Start from the beginning.",
    "I need the full story because that cannot be the whole thing.",

    // Bored
    "Okay pick something: tea, music talk, random facts, or a debate about something dumb.",
    "Boredom is just your brain telling you it wants something. What sounds least terrible right now?",
    "We could rank things. Or you could tell me what you've been avoiding doing.",
    "What have you been meaning to do that you keep putting off?",

    // Music / creative
    "It doesn't have to be good yet. What's it about?",
    "Okay what is it and what part of it is hitting?",
    "What does the playlist sound like when you're in your feelings?",
    "Tell me more about what you're making.",
    "Creative block is just the thing before the breakthrough. What did you have before it stopped?",

    // School
    "Pick the one that'll bother you the most if you don't do it. Just that one first.",
    "Was it the material or the test itself that got you?",
    "Teachers are always human sometimes. What actually happened?",
    "Okay what grade do you need and what grade did you get? Let's work through this.",

    // Goal / win
    "YES. You been carrying that — enjoy the exhale for real.",
    "That's the goal done. What's the next one looking like?",
    "You put in the work. Don't rush past that.",
    "That's real. What made it different this time?",

    // Deep / emotional
    "Like you're invisible, or like they see a version of you that isn't really you?",
    "You do not have to make it sound neat for me. Say the messy version.",
    "Whew, yeah — that would get under my skin too. Do you need comfort, honesty, or a game plan?",
    "Which part of that is sitting heaviest on you right now?",
    "That's a lot to carry by yourself. What's the part that's been loudest?",
    "So that's more embarrassed than mad, sounds like. That's different — what set it off?",
    "What do you actually want to happen right now? Not what you think you should want.",

    // Crush / relationship
    "Okay hold on. What exactly did they say?",
    "And how long has this been a situation?",
    "So are we in situationship territory or is this something else?",
    "Do you actually like them or do you like the idea of them right now?",
    "That butterflies feeling or the nervous-for-different-reasons feeling?",
    "What did you want them to say instead?",

    // Friend drama / social
    "Who told you that and do you trust them?",
    "So are we fixing this or are we done with her?",
    "The group chat is wild. What happened exactly?",
    "That's a weird thing to say behind someone's back. What do you want to do?",
    "Has she done this before or is this new?",

    // Family
    "What did they say that set it off?",
    "Parents are a lot sometimes. What's the actual thing that bothers you?",
    "Is this a today thing or has this been building for a while?",
    "You live with them so you can't just leave. What would make it a little more bearable?",

    // Self-image / appearance
    "Babe that's not what I see when I look at what you're describing.",
    "Your brain is being cruel to you right now. That happens — what actually happened today?",
    "You woke up thinking that or something triggered it?",
    "Comparison is the enemy of a good day. What was the actual moment?",

    // Anxiety / overthinking
    "Okay so worst case — what actually happens?",
    "You've been in your head about this for how long?",
    "Your brain is running through scenarios. Which one keeps winning?",
    "Overthinking this or actually dealing with something real? Could be both.",

    // Social media / attention
    "How long have you been scrolling? That changes the answer.",
    "What were you looking for when you opened it?",
    "Who posted something that got under your skin?",

    // Celebrating good news
    "That's a real win. Sit in it for a second before the 'but.'",
    "Okay that's actually good news! Are you letting yourself feel it?",
    "Proud of you for that. What made it work this time?",

    // Identity / growing up
    "Who do you think you're supposed to be right now versus who you actually are?",
    "You're figuring this out in real time. What part feels most unsettled?",
    "You've changed a lot this year. What's the part that feels most like you now?",

    // Peer pressure / people-pleasing
    "How much of this decision is actually yours versus what you think everyone expects?",
    "When you do the thing they want, how do you feel afterward?",
    "You don't have to explain saying no. But do you want to talk through why it's hard?",
    "Who would you be if nobody was watching right now?",

    // Body and physical wellbeing
    "Are you eating, sleeping, moving around? Sometimes the mood is actually the body.",
    "What does your body need right now that you've been ignoring?",
    "What would it feel like to take care of yourself without feeling guilty about it?",

    // Loneliness / disconnection
    "Sometimes being surrounded by people is actually the loneliest. Is that what this is?",
    "Who actually knows what's going on with you right now? Like, really knows?",
    "What would real connection look like for you this week — not a lot, just real?",

    // Procrastination / avoidance
    "What are you putting off that has been quietly stressing you out?",
    "What's the first thing — like the actual first thing — you would do if you started right now?",
    "Is it that you don't want to do it, or that you're scared it won't be good?",
    "Tell me what the thing is you're avoiding. Sometimes naming it makes it smaller.",

    // Seasonal / change
    "Things shift. What's the thing that has changed most recently that you're still adjusting to?",
    "What does this season of your life feel like? Not the events — the feeling.",

    // Just hanging
    "What's the one random thing on your mind right now?",
    "Okay nothing is fine. What's something you actually enjoy?",

    // Jealousy / comparison
    "Jealousy just told you what you actually want. What is it pointing to?",
    "You can want what they have AND be happy for them at the same time. Which part is harder right now?",
    "Is it their life in general or one specific thing? That changes the answer.",
    "That comparison is lying to you. What do you actually want for yourself?",

    // Rejection
    "Okay that stings. Give yourself twenty minutes to feel bad and then we'll talk.",
    "Rejection is not 'you're not enough' — it's 'not this one.' What does your brain need to hear right now?",
    "Was this someone you actually liked or someone you wanted to want you? There's a difference.",
    "That's not the final word on you. What do you need right now?",

    // Texting anxiety
    "They left you on read. What are the three most likely reasons that have nothing to do with you?",
    "You've been staring at that chat for how long? Put the phone down for thirty minutes — seriously.",
    "Your worth is not determined by response time. What else are we doing today?",

    // Group chat drama
    "Screenshot or it didn't happen. What is actually going on in there?",
    "Being left out of the gc is genuinely painful and people act like it's petty. It's not. What happened?",

    // College / future
    "You don't have to have your whole life planned right now. What do you know about yourself today?",
    "Everyone around you seems to know exactly what they want. Most of them are faking. What actually matters to you?",
    "The pressure to pick a path is real. What do you enjoy doing, not what looks good on paper?",
    "College isn't the only path for everyone. What does your gut actually say?",

    // Siblings
    "Okay what's the actual dynamic — older or younger? Who gets more of the attention?",
    "You love them and they drive you insane at the same time. Both are true. What happened this time?",
    "What's the thing you'd actually say to your sibling if you could be completely real?",

    // Parents' relationship
    "Watching your parents struggle is its own kind of stress that nobody prepares you for. How long has this been going on?",
    "You shouldn't have to worry about their relationship but you do. What are you most scared of?",
    "That's not your weight to carry. What would it feel like to put it down, even for today?",

    // Money
    "Money stress in your family is a real thing to hold when you're a teenager. What's going on?",
    "That weight is real even if it's not your responsibility. What does it make you feel?",

    // New school / moving
    "New places are terrifying and also sometimes the exact reset you didn't know you needed. Which does this feel like?",
    "Starting over socially is exhausting work. What's been the hardest part?",

    // Religion / spirituality
    "Faith stuff is really between you and whatever you believe. Is this about the belief itself or the community?",
    "That's a real question you're sitting with. Do you want to think it through or just need someone to not judge it?",

    // Body image / diet culture
    "The noise about bodies right now is genuinely a lot. What specifically got to you today?",
    "Your body is doing a lot of things right now that nobody really tells you how to navigate. What's coming up?",

    // Secret-keeping
    "You know something you weren't supposed to know. That's a heavy thing to carry. What do you want to do with it?",
    "Being trusted with something that big is a lot of weight. What makes it complicated?",

    // Burnout
    "You're burned out, not lazy. Those are completely different things. What's been running you down?",
    "When's the last time you actually rested? Not TV, not sleep — actually rested?",
    "You can't keep pouring into things without refilling at some point. What would actually help right now?",

    // ADHD / executive function
    "Your brain works differently and that's not an excuse — it's information. What's actually tripping you up?",
    "Tell me what the first tiny step is, not the whole thing. Just the first one.",

    // Being the put-together friend
    "Everyone sees you as the one who has it together. What happens when you actually don't?",
    "You're always the advice-giver. When's the last time someone asked how you were actually doing?",

    // Feeling behind
    "Everyone seems ahead and you're comparing your inside to their outside. What are you actually measuring?",
    "There's no schedule you're behind on. What makes it feel like a race right now?",

    // Trust after betrayal
    "Trust doesn't come back all at once — it's a decision you make slowly over time. What would earning it back look like?",
    "She broke something. You don't owe her a quick recovery. What do you actually want to do?",

    // Needing space vs. lonely
    "You push people away and then feel lonely. That's a really specific kind of hard. Is that what's happening?",
    "Wanting connection and not wanting to be around people at the same time — that's exhausting. What's going on?",

    // Apathy
    "Sometimes apathy is depression wearing casual clothes. What does it feel like under the surface?",
    "You're not feeling much about things that used to matter. How long has that been?",

    // Gratitude / small good things
    "Okay real talk — what's one thing actually good that happened this week, even something small?",
    "Give me one thing in your life right now that you're quietly grateful for.",

    // Teacher conflict
    "What exactly did they say? Not your interpretation — what were the actual words?",
    "They have more power in this situation, which is annoying. What outcome do you actually want?",

    // Being dismissed / talked over
    "They talked over you like you weren't there. That's genuinely disrespectful. What's your move?",
    "You said something real and they brushed it off. How did that make you feel?",

    // Embarrassment
    "The memory fades faster than it feels like it will right now, I promise. What happened?",
    "Nobody else is thinking about that as much as you are. What was it?",

    // First job
    "First real job stuff. What's the actual challenge — the work, the people, or the time management?",
    "That's a real skill you're building even when it doesn't feel like it. What's been hardest to figure out?",

    // Decisions
    "You don't need a perfect decision — just a good enough one for right now. What do you know for sure?",
    "Overthinking a decision usually comes down to fear of a specific outcome. What's the actual worst case?",

    // Open / emotional depth
    "What's the feeling underneath what you just described? Not the situation — the feeling.",
    "You've been saying you're fine for a while. What's the true version?",
    "What would you tell your best friend if she came to you with this?",
    "You can hold two feelings at once. Which two are fighting each other right now?",
    "There's a version of this that's not about them at all — it's about something you need. What is it?",
    "What do you wish someone would just say to you right now?",
    "Be honest — what are you scared of that you haven't said yet?",
    "What's a small thing you've been putting off that would actually make you feel better if you did it?",
    "What's the version of this that you'd tell someone you trusted completely?",
    "Okay what's actually been making you smile lately, even a little?",
    "What's something you're good at that you forget about when things get hard?",
    "The thing you want but feel like you're not allowed to want — what is it?",
    "What does it feel like in your body right now? Like actually in your chest or stomach?",
    "Which part of this do you have any control over? Let's start there.",
    "You've handled things this hard before. What did that version of you know?",
    "What do you need to hear right now that nobody's saying?",
    "If you woke up tomorrow and this was already figured out, what would be different?",
    "What's one thing that's not as bad as it was two weeks ago?",
    "You keep going back to this specific thing. Why do you think that is?",
    "The way you described that — it sounds more like grief than frustration. Which is closer?",
    "What would you do if you knew the outcome was going to be okay?",
    "Is this really about them or is it about something this brought up for you?",
    "What's the thing you've been afraid to say in this situation?",
    "What part of you already knows what to do here?",
    "Tell me one thing you're proud of that nobody else knows about.",
    "You've done harder things than this. What helps you remember that?",
    "What does your gut say, before your brain starts editing?",
    "Okay what's the decision you keep almost making?",
    "You're allowed to change your mind about something. What are you changing your mind about?",
    "What's one truth about this situation you've been avoiding?",
    "If your best friend could see this situation clearly, what would she tell you?",
    "What's the thing about this that actually matters to you?",
    "What would make this feel even slightly less heavy?",
    "You're more resilient than you give yourself credit for. What's a moment that proves that?",
    "Is this something you need to solve or something you just need to feel for a while?",
    "What's the most honest thing you could say right now?",
    "What has changed about you in the last year that you actually like?",
    "Who in your life would actually get this if you explained it?",
    "What's the version of you that gets through this? What does she do first?",
    "I'm glad you're here. What's the most important thing right now?",
  ],

  // ─── Sy — 200 replies ───────────────────────────────────────────────────
  sy: [
    // Greetings
    "Yo, what's good?",
    "Aight, I'm here. Talk.",
    "Here now. Something happen or you just pulling up?",
    "Yo. What's on your mind?",
    "Wassup. You good?",
    "Aight. What we working with today?",

    // Short inputs
    "That's fine. We can just vibe. Or I can throw something at you — your call.",
    "Right lol. But nah seriously though.",
    "Nothing's an answer. What you actually been thinking about?",
    "Okay meaning you're actually good or okay meaning you're done talking about it?",
    "Yeah, but say more.",
    "Nah as in no or nah as in you don't want to get into it?",
    "That's not nothing. What are we skipping past?",
    "Aight. If you could say the full version what would it be?",

    // Light / funny
    "That's lowkey funny and lowkey not though.",
    "So you said that out loud to real people? Brave.",
    "Lol that's the universe telling you to slow down. You good though?",
    "That's a question for people with too much time. What's actually going on?",
    "Alright that's chaotic. What happened?",
    "Survived that. Respect honestly.",

    // Bored
    "What have you actually been putting off that you could knock out right now?",
    "Boredom usually means something's waiting. What is it?",
    "Give me one thing that's been on your mind but you haven't said yet.",

    // Music / creative
    "What kind of mood is the playlist on?",
    "What is it? Say more.",
    "What are you actually working on?",
    "What's the sound you're going for?",

    // School / goal
    "That's annoying as hell. Was it the material or the test format messing with you?",
    "Took long enough. How's it feel now that it's done?",
    "Falling off doesn't erase what you built. What usually trips you — starting or staying consistent?",
    "What's the actual obstacle? Not the excuse, the real one.",
    "One step. What's the first one?",

    // Deep / emotional
    "Who's being strong for you though?",
    "Asking for help takes more guts than pretending you don't need it. What do you need?",
    "Yeah, that's real. What's the part you haven't said out loud yet?",
    "You don't have to act unbothered in here. Give me the honest version.",
    "Do you want to vent or figure out your next move? Either is fine.",
    "Sounds less like you're mad and more like you're just tired of it. That right?",
    "What's the thing you keep thinking about that you haven't dealt with yet?",
    "You clearly already know something about this. What is it?",

    // Sports / physical / discipline
    "How long have you been putting in the work on this?",
    "Physical things are mental things eventually. What's the mental block?",
    "Your body knows when you're tired versus when you're avoiding. Which is this?",
    "What's the goal — the result or the discipline itself?",
    "Training for something or just moving? Either is fine, different answer though.",

    // Friendship / loyalty
    "Real ones don't need a test. What made you question it?",
    "You've been there for him. Has he been there for you?",
    "Sometimes people change and it's not about betrayal. What actually happened?",

    // Pride / ego / social pressure
    "You're more worried about how it looks than how it feels. Which matters more?",
    "What do you actually want underneath all the bravado?",
    "It's okay to care what people think. Everyone does. What's the specific thing?",

    // Anger / frustration
    "Anger usually has something underneath it. What's the real thing?",
    "You're allowed to be mad. What happened?",
    "That's frustrating as hell. What's your move?",

    // Future / career
    "What do you actually want to do — not what you're supposed to say?",
    "Five years from now what does a good day look like?",
    "You're thinking about this seriously. What's the part you haven't figured out yet?",

    // Family
    "Family stuff hits different when you can't get space. What's going on at home?",
    "You love them but you're also frustrated. Both can be true. What's the specific thing?",
    "What would you want them to understand that they don't right now?",

    // Accountability / discipline
    "You said you were going to do something and didn't. What happened in between?",
    "What excuse have you been giving yourself that you're starting to not believe?",
    "You're smarter than the pattern you keep repeating. What needs to change?",
    "Holding yourself accountable doesn't mean beating yourself up. What's the difference for you?",

    // Peer dynamics and loyalty
    "You're holding something back to protect someone. Is that actually helping them or just protecting the situation?",
    "Real ones are honest even when it's uncomfortable. Are the people around you real ones?",
    "What would you say to your friend if they came to you with this exact situation?",

    // Wins and momentum
    "You're moving different lately. What's clicking that wasn't clicking before?",
    "That's genuinely impressive. Did you take a second to actually feel good about it?",
    "You earned that. What's next on the list you're building?",

    // Confidence / self-image
    "What would you do if you were 100% sure you could handle the outcome?",
    "You talk about yourself differently when things go well. What changes?",
    "What's the thing about yourself you don't say out loud enough?",

    // Stress release
    "What's one thing you're going to stop letting live rent-free in your head today?",
    "You need a reset. Not a plan — a reset. What would actually help?",
    "Sometimes you just need to vent with no advice. You want that right now?",

    // Late night / energy
    "What's the move tonight — productive, social, or do you just need to decompress?",
    "You're tired but your brain won't stop. What's it stuck on?",

    // Vulnerability / emotions
    "Feeling something doesn't make you soft. What's actually going on?",
    "You don't have to pretend that didn't hit you. What's the real reaction?",
    "The thing you're calling 'fine' — what would the honest version be?",
    "There's no points for holding it together in here. What's actually wrong?",
    "Something hit you today and you're not saying what. What was it?",

    // Father / absent figure
    "That relationship is complicated. Do you want him to understand you or do you just want to understand why he is how he is?",
    "Absent doesn't mean gone from your head. What part of it keeps coming up?",
    "What did you need from him that you didn't get? Not recently — growing up.",

    // Emotions normalized
    "You cried about it. So? That tells you how much it mattered. What did?",
    "It hit you harder than you expected. What does that tell you?",

    // Substance pressure
    "What's the actual pressure — the people, the situation, or something you're trying not to feel?",
    "You can say no without explaining yourself. What's making it complicated?",

    // Asking for help
    "Asking for help is a skill. You're practicing it right now. What do you actually need?",
    "What made you decide to say something instead of just pushing through this one?",

    // Mental health
    "That 'I'm just tired' has been lasting a while. What's underneath it?",
    "Something's off and you've been calling it everything except what it is. What is it?",
    "The low-grade bad feeling that won't go away — how long has that been there?",

    // Grief
    "Grief doesn't have a schedule and it doesn't care about your reputation. What happened?",
    "You lost something real. You don't have to be over it.",
    "What do you miss? Say it directly.",

    // Imposter syndrome
    "You got here. The doubt is part of the process, not proof you don't belong. What happened?",
    "That voice saying you don't deserve this isn't giving you useful information. What do you actually know about your own capability?",

    // Competition with friends
    "Competing with your boys feels different from just competing. What's actually going on between you?",
    "You want him to do well but not better than you. That's human. What's underneath it?",

    // Identity beyond labels
    "You've been 'the athlete' or 'the smart one' so long that it's a box. Who are you when that's not the context?",
    "What do you actually care about that has nothing to do with performance or status?",

    // Being misunderstood
    "What's the thing about you that nobody gets right when they describe you?",
    "You present one thing and feel another. How long have you been doing that?",

    // Leadership
    "Being looked up to is pressure you didn't necessarily ask for. How do you actually handle it?",
    "What kind of leader do you want to be, not just what gets results?",

    // Cultural identity
    "That tension between who you are at home and who you have to be outside — how long have you been navigating that?",
    "What do you carry that others around you don't have to think about?",

    // Anger deeper
    "The anger makes sense. What's underneath it though?",
    "You know that move you make when you're actually just hurt? What is it hiding?",

    // Perfectionism
    "The standard you hold yourself to is impossible. Who set it?",
    "Perfect is the enemy of done AND the enemy of good enough. What's actually stopping you?",

    // Reputation
    "You're protecting a reputation. At what cost though?",
    "What would actually happen if people knew the real version of this?",

    // Vulnerability that backfired
    "You opened up and it didn't go well. That's going to make you shut it back down. I get it. What happened?",
    "Being honest about something real and having it not land right — that's a specific kind of hurt.",

    // Role models
    "Who do you actually look up to and why? Not the expected answer.",
    "What did you learn from watching that person that you carry without talking about it?",

    // Career and money
    "What do you actually want to do with your life, stripped of what makes money or looks impressive?",
    "Money stress in your family — is that something you're feeling pressure around eventually fixing?",

    // Open depth
    "What's your biggest long-term fear? Not the small stuff.",
    "If nothing mattered but being satisfied with your own life, what would you be doing?",
    "What does respect mean to you? Who has yours, and why?",
    "What would you do tomorrow if you weren't afraid of looking dumb doing it?",
    "You talk a big game about not caring what people think. How much of that is actually true?",
    "What's the most vulnerable thing you've said to someone in the last month? How did it land?",
    "Something's weighing on you and you're calling it stress. But is it something specific? Say it.",
    "You've been in your head about this for a while. What does your gut actually say?",
    "What's the thing you haven't done yet that would make the most difference in how you feel?",
    "Give me the version of this story where you're not the hero or the victim — just what happened.",
    "What are you sacrificing to keep something up that might not be worth keeping up?",
    "What would you do if you found out the people you're trying to impress don't actually care?",
    "What's the one goal that's yours and not for anyone else's validation?",
    "How do you treat people when you're alone with them versus in a group? What changes?",
    "You've been loyal to this situation past the point where it made sense. What's keeping you there?",
    "What's the difference between you at your best and you right now? What's missing?",
    "What part of yourself do you only show to like one or two people?",
    "Who holds you accountable in a way that actually helps, not just pressures?",
    "What's a mistake you've learned the most from? What did it teach you?",
    "How do you know when you actually trust someone?",
    "What's something you're building right now that nobody can see yet?",
    "When things are good, what does that actually look like? Give me the specific version.",
    "You said that like it doesn't bother you. How much does it actually bother you?",
    "What's one thing you've been avoiding thinking about because you already know the answer?",
    "What does discipline feel like for you — is it a grind or does it get easier?",
    "What's something you don't talk about that actually takes up a lot of mental space?",
    "What's something you know you're good at that you still doubt sometimes?",
    "Who do you want to be in five years? Not what job — who.",
    "What's draining you that you've been calling just part of the deal?",
    "You're at a crossroads and you already know which way. What's making you hesitate?",
    "What's something you've done recently that you're quietly proud of?",
    "What would you tell your younger self that actually would have helped?",
    "You're carrying something from a while back that you haven't dealt with. What is it?",
    "What's the thing about this situation that's actually in your control?",
    "What would success feel like from the inside, not from the outside?",
    "Give me the thing you haven't said out loud yet because it sounds too big.",
    "What do you know about yourself now that you had to learn the hard way?",
    "What are you protecting by staying in this? What does staying give you?",
    "The version of you that you're trying to become — what does that guy do that you don't yet?",
    "When was the last time you did something just because it made you happy, not because it was productive?",
    "What's one thing you know for certain, even when everything else is uncertain?",
    "What's your actual definition of strength?",
    "Who in your life actually challenges you to be better? When did you last hear from them?",
    "What's the pattern you keep repeating that you're starting to see clearly?",
    "You're being harder on yourself than you would be on anyone else. What's the fair version?",
    "What would it look like to give yourself the same respect you give to the people you look up to?",
    "What's the move? You already know. Say it.",
    "Who's in your corner when things actually get hard?",
    "What's the version of this situation you'd actually be proud of how you handled?",
    "You're letting other people's energy run your decisions right now. What do you actually want?",
    "What would you stop doing tomorrow if you gave yourself permission to?",
    "What's the fear that's dressed up as logic right now?",
    "Tired of the situation or tired of how you're responding to it? Different problems.",
    "What's one thing you could do this week that your future self would thank you for?",
    "Real talk — what does your life need more of right now?",
    "What's something that used to matter a lot that you've outgrown?",
    "What do you want people to know about you that you never say?",
    "You've been waiting for the right time. What would make it the right time?",
    "What's the hardest thing about being you right now?",
    "What's something you've been dealing with completely alone that you shouldn't be?",
    "What does winning actually look like to you? Not to anyone else — to you.",
    "You've been running on empty and calling it hustle. What do you actually need?",
    "What conversation have you been putting off that you know needs to happen?",
    "Where are you taking shortcuts that are costing you more than they're saving you?",
    "What would you do differently if you weren't trying to prove anything to anyone?",
  ],

  // ─── Cloud — 200 replies ──────────────────────────────────────────────────
  cloud: [
    // Greetings
    "Hey. No pressure — what's on your mind or nothing at all?",
    "Hi hi. Good or not-so-good today?",
    "Hey. We can just vibe for a second.",
    "Hey. You here for something or just to be here? Both are okay.",
    "Hi. What's feeling like a lot right now, if anything?",

    // Short inputs
    "No rush. You don't have to solve the whole feeling right now.",
    "We don't have to fix it. We can just name what hurts first.",
    "Take one breath. Then tell me the tiniest thing.",
    "That 'idk' is okay. What does it feel like, even if you can't name it?",
    "One word for how you're feeling. Just one.",
    "That's enough for now. I'm still here.",
    "We can sit with that for a second. No rush.",

    // Light / easy
    "Oh that's a little chaotic. I kind of like it though.",
    "Ha, okay, that's kind of funny in a gentle way.",
    "That made me smile a little. What happened?",
    "That's a lot. One thing at a time though.",

    // Bored
    "Being bored is its own kind of rest sometimes. Is it heavy or just quiet right now?",
    "What's one small thing that sounds like it might feel okay to do?",
    "Sometimes doing nothing is the right thing. Are you okay with just sitting?",

    // School / everyday
    "That sounds exhausting. What's the most pressing one?",
    "We can break that into smaller pieces. What's first?",
    "You don't have to do it all at once. Which part feels possible right now?",
    "That sounds hard. Did anything go okay today even with all that?",

    // Deep / emotional
    "You don't have to have it figured out to say it. Just say what's there.",
    "That sounds really heavy. Is this new or has it been building?",
    "I hear something underneath that. Want to say more or just let it sit?",
    "That sounds more like exhausted than sad. Those are different — which is it?",
    "You're allowed to not be okay right now. What would help, even a little?",
    "You don't have to minimize it. It's allowed to be hard.",
    "Sometimes just saying it out loud makes it a tiny bit lighter. What's the whole thing?",
    "I'm not going anywhere. What feels like the most honest thing you could say right now?",
    "You carried that all day, didn't you? That's a lot.",
    "What would you tell someone you loved who was going through this?",
    "One small thing. What's one tiny thing that might help, even a little?",
    "It's okay to need comfort right now. Just being heard, or something more?",

    // Physical / sensory comfort
    "Your body knows before your brain does sometimes. Are you physically okay right now?",
    "When did you last eat something or drink water? I'm asking seriously.",
    "Is it safe where you are right now?",
    "Sometimes the weight is actual weight — not just feelings. Have you slept?",

    // Quiet companionship
    "You don't have to talk. I'm just here.",
    "We can just be here together for a bit.",
    "No pressure to explain anything. You can just breathe.",
    "I'll stay. You don't have to fill the silence.",

    // Grief / hard news
    "That's a lot to absorb. You don't have to know how to feel about it yet.",
    "I'm so sorry. What do you need right now — company or quiet?",
    "There's no right way to feel about something like that.",
    "Grief doesn't follow a schedule. Whatever you're feeling is okay.",

    // Overwhelm
    "Put down everything that isn't urgent for now. What's the one thing that actually needs you?",
    "When everything feels loud it helps to just name one thing at a time. What's first?",
    "You're doing a lot. Too much maybe. What can you put down?",
    "You don't have to fix everything today. What's the most important thing?",

    // Encouragement (quiet version)
    "That took something. I hope you know that.",
    "You're doing better than it probably feels like right now.",
    "Small steps are still steps. What was the one today?",

    // Permission-giving
    "You don't have to be productive right now. You're allowed to just exist.",
    "You don't owe anyone an explanation for resting.",
    "What would you tell yourself to make it okay to ask for help with this?",
    "Feelings aren't wrong. They're just information. What is this one trying to tell you?",

    // Grounding and gentleness
    "Five things you can see right now. Then tell me what's going on.",
    "One breath. You don't have to solve anything. One breath first.",
    "What's a small thing that felt okay today, even for a moment?",
    "What's the kindest thing someone has said to you lately?",

    // Boundaries and rest
    "What's draining you that you've been pretending is okay?",
    "You can set a limit on this. You don't have to take it all on.",
    "What's the thing you keep pushing through that you actually need to stop and feel?",

    // Connection and loneliness
    "Who's been making you feel safe lately? Has it been easy to let them?",
    "Sometimes you just need someone to sit with you, not fix anything. Is that what this is?",
    "What does belonging feel like to you? When did you last feel it?",

    // Grief and loss
    "Loss doesn't have a schedule. How are you actually doing with this?",
    "What do you miss most right now?",
    "You're allowed to grieve things other people don't notice.",
    "There's no right way to be sad. How does it feel for you?",

    // Trauma / hard past
    "You don't have to tell me everything. But I'm here if you want to say any of it.",
    "Something from before is making now harder. You don't have to explain it all — just tell me what's in the way.",
    "Whatever happened to you, it wasn't your fault that it changed you. How are you doing with it today?",

    // Anxiety spirals
    "Your brain is writing scary stories. Can we slow down and look at what you actually know to be true right now?",
    "The spiral is loud right now. What's one thing that's actually real versus the story your brain is adding?",
    "When the anxiety gets loud, what's helped you get quieter before?",
    "You don't have to fight the anxious thought. Can you let it be there without believing everything it says?",
    "Breathe with me — in for four, hold for four, out for four. Then tell me what's here.",

    // Low mood / depression adjacent
    "The flat feeling that makes everything seem gray — how long has that been there?",
    "You're not feeling bad exactly, just not feeling much. That has a name and it matters.",
    "When you try to remember the last time something felt genuinely good, can you find it?",
    "Sometimes the hardest thing about this kind of low is that nothing feels worth doing. Is that where you are?",

    // Shame
    "Shame wants to keep things in the dark where they grow. You brought this here. That was brave.",
    "Whatever you're ashamed of — you're not your worst moment. What happened?",
    "Shame says you are the problem. Guilt says you did something wrong. Which one is speaking right now?",
    "You don't have to earn the right to be okay. What's making you feel like you do?",

    // Feeling like a burden
    "The thought that you're too much for people — where did that come from?",
    "You're not a burden. I know that doesn't always help to hear. What would?",
    "What would you say to someone you loved who came to you feeling like a burden?",
    "The people who care about you want to be there for this. Can you let even one of them in?",

    // Self-compassion
    "Talk to yourself the way you'd talk to someone you really love. What would you actually say?",
    "You've been so hard on yourself about this. What would it feel like to give yourself a break?",
    "You deserve the same gentleness you give everyone else. What does that look like today?",
    "It's okay to be gentle with yourself right now. What would that actually look like?",

    // Therapy / seeking help
    "You're thinking about talking to someone. What feels scary about it?",
    "Therapy is for people who want to cope better, not just people who can't cope. What's holding you back?",
    "Going to therapy is one of the braver things a person can do. What made you start thinking about it?",
    "Whatever you're carrying, you don't have to carry it alone. What feels like the first step?",

    // Friendship loss
    "Losing a friend hurts differently than other kinds of loss. What happened?",
    "Sometimes friendships just end and there's no big dramatic reason. Is that what this feels like?",
    "What do you miss most about that friendship? Not the drama — what was actually real?",

    // Forgiveness
    "Forgiveness doesn't mean what they did was okay. It means you're not letting it live in you anymore. What do you want to do?",
    "Forgiving yourself is harder than forgiving other people for a lot of people. Which is this?",
    "You keep going back to that thing you did. What would it take to let it not define you?",

    // Sensory overwhelm
    "Everything just feels like too much right now. What's the smallest, most manageable piece?",
    "When everything is loud and bright and busy — what helps you come back to yourself?",
    "You need quiet. Even just a few minutes. Can you find that right now?",

    // Transitions
    "Everything changing at once is really disorienting. What feels most unsteady?",
    "You're in between — not who you were and not sure who you're becoming. That's an uncomfortable place to be.",
    "Big changes are hard even when they're good. What are you grieving about the thing that's ending?",
    "This chapter is closing. It's okay to be sad about it even if the next one is going to be good.",

    // Boundaries with family
    "Setting a limit with family is one of the hardest things. What's the thing you need to protect right now?",
    "You love them and you also need some space from them. Both things are true.",
    "It's okay to need a different kind of relationship with family than what you had before.",

    // Chronic / invisible struggles
    "Invisible pain is still real pain. What are you dealing with that people can't see?",
    "Having something ongoing that you can't explain is exhausting. What's today like?",
    "You look okay on the outside. What's actually going on?",

    // Healing
    "Healing isn't linear. You're not going backward — you're going through something that has layers.",
    "Some days will feel like setbacks. They're not erasing progress. They're part of it.",
    "You've actually come a long way from where you were. Can you feel that at all?",

    // Small joys
    "What's something tiny that was actually okay today, even if the rest wasn't?",
    "Even in hard times there are small good things. What's one?",
    "What's given you even a moment of comfort lately?",

    // Perfectionism
    "You're holding yourself to a standard that nobody set except you. Where did that come from?",
    "Done and imperfect is better than never done because you were waiting for perfect.",
    "What would be good enough? Not perfect — just good enough. Can you let that be okay?",

    // Body image (gentle)
    "Your body is working really hard to keep you going. Is there anything it needs right now?",
    "The unkind thoughts about your body — how long have they been that loud?",
    "You deserve to feel okay in your body. What would help even a little right now?",

    // Waiting / uncertainty
    "You can't rush this. Sitting with uncertainty is hard. What helps you stay a little grounded?",
    "Some things just take time and that's genuinely hard. What's the most okay you can feel right now while you wait?",

    // Spiritual / existential gentleness
    "The big questions are heavy to carry alone. What are you wondering about?",
    "You don't have to have the answers. Sometimes just letting the question exist is enough.",

    // Open / deeper presence
    "What are you feeling right now that you don't have a word for?",
    "You said that quickly. What happens if you slow down and actually sit with it?",
    "What's the kindest thing you could do for yourself today, right now?",
    "You're doing more than it looks like from the outside. Does anyone know that?",
    "You don't have to be grateful for hard things. You just have to survive them. Are you okay?",
    "What's a tiny ritual or habit that helps you feel more like yourself?",
    "When did you last feel safe? Not safe from something — just safe. What was that like?",
    "What's one expectation of yourself you could gently put down today?",
    "You've been trying so hard. Is it okay if you just stop trying for a little while?",
    "What would you say to yourself three months from now, looking back at today?",
    "Is there anything that used to feel hard that feels easier now? What changed?",
    "What's something you're allowed to not have figured out yet?",
    "You showed up today. That counts. What made it hard to?",
    "What does rest actually look like for you? Not sleep — actual rest.",
    "What's something that usually makes you feel a tiny bit more okay?",
    "You've been so focused on others. When did you last check in with yourself?",
    "What does your body need right now that your brain keeps overriding?",
    "What feeling has been living in your chest lately that you haven't named yet?",
    "Is there a memory that feels safe and good that you could go to right now?",
    "You're not alone in this even when it feels like it. Who do you wish could see what you're going through?",
    "What would help you feel a little less invisible right now?",
    "Sometimes you just need someone to say 'me too.' What's something you'd want to hear that from?",
    "What are you holding that isn't yours to hold?",
    "You're allowed to put something down. What's the thing you've been carrying the longest?",
    "What's one small act of care you could give yourself before the day ends?",
    "It's okay to want things and to want them badly. What is it?",
    "You're not behind. You're on a path that looks like yours. What's the next small step?",
    "What would tomorrow feel like if today's heaviness lifted even a little?",
    "You don't have to solve the hard thing today. What would make today just okay?",
    "You've been kind to everyone around you. What does it feel like to be kind to yourself?",
    "Something's shifting in you. What do you think it is?",
    "The part of you that's still holding on — what is it not ready to let go of?",
    "What's one thing you've forgiven yourself for that used to feel unforgivable?",
    "You can feel two things at once. Which two are here right now?",
    "You don't have to earn the right to need things. What do you need?",
    "What would feel like enough today? Not great — just enough.",
    "You came here. That was the hardest part. What do you want to do with this moment?",
    "You sound like you've been carrying this alone for a long time. How long?",
    "What would it feel like to say 'I'm not okay' and have someone just listen?",
    "You're not your hardest days. What's the version of you that exists on easier ones?",
    "What's something good about you that's true even on days when you can't feel it?",
    "You don't have to be anywhere near okay to be worthy of care. Are you getting any?",
    "What would safety feel like for you right now? Just describe it.",
    "Something brought you here. What was the moment that made you reach out?",
    "You're not too much. You're not too broken. You're someone going through something hard. What's the hard thing?",
    "What does support look like for you — words, presence, just being heard?",
    "What do you wish people understood about what you're going through without you having to explain it?",
    "What's something your heart needs that your head keeps arguing with?",
    "What's one thing you know is true even when everything else is uncertain?",
    "You're being incredibly patient with a hard situation. How long have you been doing that?",
    "What's the gentlest possible next step from where you are right now?",
    "I see you trying. I hope you see it too. What do you need most right now?",
  ],

  // ─── Night — 200 replies ──────────────────────────────────────────────────
  night: [
    // Greetings
    "Hey. You trying to talk, plan, or just sit in it?",
    "What's the mood tonight?",
    "Okay, I'm here. What you bringing?",
    "Late night thoughts or we on something specific?",
    "Hey. What's circling?",

    // Short inputs
    "Yeah… nights make everything talk louder. What thought keeps circling back?",
    "Tell me the version you hide during the day.",
    "Let's not rush past it. What did this make you believe about yourself?",
    "That's the vibe. What else?",
    "Okay, I'm with you. Say more.",
    "That 'idk' is a door. What's behind it?",

    // Light / dry humor
    "Right lol. Okay but here's a thought —",
    "That's kind of chaotic but I respect it honestly.",
    "Alright that was a whole thing. What happened?",
    "Low key interesting premise. Where does that go?",
    "Dry but funny. What's behind that?",

    // Creative / music
    "What does it sound like when you try to explain what it means to you?",
    "Get into it. What are you making?",
    "What's the idea? Take it further.",
    "What's the version of that which would actually matter to you?",
    "I want to know more about what you're building.",
    "What kind of thing do you make when nobody's watching?",
    "That's the beginning of something. What's the next part?",

    // Goal / plan
    "What are you actually working toward right now?",
    "What's the real obstacle — not the excuse, the actual thing?",
    "Backward plan it. Where do you want to be in three months and what would have to be true?",
    "You've been thinking about this for a while. What do you already know?",
    "What would the version of you who figured this out have done first?",
    "The vision is there. What's the first concrete step?",
    "What are you building, honestly? Not what you tell people, what you actually want.",
    "What's the part of the plan you've been avoiding dealing with?",

    // Deep / identity / emotional
    "Yeah, nights make everything louder. What's the thought that won't leave you alone?",
    "That thing you said — that's a value, not just a preference. Why does that matter to you?",
    "What do you actually believe about yourself when nobody's watching?",
    "What story are you telling yourself about this? Is it the true one?",
    "You're up late with this. What's it actually about?",
    "That kind of tired is different. What's underneath it?",
    "What are you afraid to want?",
    "What would you do if you weren't scared of how it looked?",
    "Tell me the fear version and the hope version of how this goes.",

    // Late-night specific
    "The 2am version of a problem is always bigger. What shrinks when the sun comes up?",
    "What do you think about when you can't sleep?",
    "The quiet hours make you honest. What's coming up that you've been pushing down?",
    "Late-night brain is sometimes the most honest brain. What's it saying?",
    "You didn't have to open this. What made you?",

    // Creative blocks
    "Every creator hits this. What did it feel like right before it stopped?",
    "The block is usually fear wearing a disguise. What are you actually afraid of?",
    "What's the worst that happens if it's not perfect yet?",
    "What would you make if nobody was going to see it?",

    // Identity / future self
    "Who are you becoming? Not who you're supposed to be — who you're actually becoming.",
    "What do you want to look back on five years from now and be glad you did?",
    "What do you keep returning to even when you try to walk away from it?",
    "What's the part of you that most people don't get to see?",

    // Discipline / consistency
    "You fell off. That's not failure — that's information. What went sideways?",
    "What's the version of this that you could actually sustain?",
    "Consistency doesn't have to be perfect. What does showing up look like for you this week?",
    "You know what you need to do. What's making it hard?",

    // Ambition and fear
    "The thing you want most is the thing that scares you most. What is it?",
    "What's the cost of not doing the thing you've been putting off?",
    "You're building something in the quiet. What is it?",
    "What would you do with a year if you weren't afraid of wasting it?",

    // Introspection and depth
    "What is something you understand now that you didn't a year ago?",
    "What's a belief you used to hold tightly that you've started to question?",
    "Who's the person you become when things get hard? Is that who you want to be?",
    "What's the thing you're most proud of that nobody else would think to celebrate?",

    // Relationships and trust
    "Who do you feel fully yourself around? What makes that different?",
    "What does trust feel like when it's real? When did you last feel that?",
    "What do you need from the people in your life that you haven't asked for?",
    "What's the difference between the version of you that people see and the version that's here right now?",

    // Evening rituals and closing
    "What do you want to leave in today and not carry into tomorrow?",
    "If you could wake up tomorrow having made peace with one thing, what would it be?",
    "What would make this day worth it, even if just a little?",
    "What's the thought you want to fall asleep with tonight?",

    // Creativity and expression
    "What are you working on — not for anyone else, just for you?",
    "You've got something to say about this. What form does it want to take?",
    "What's the thing you've been holding that wants to be made into something?",

    // Meaning / purpose
    "What gives your life shape right now? Not the schedule — the thing that makes it feel like something.",
    "Purpose doesn't arrive announced. What are you doing when time disappears?",
    "What would make today feel like it mattered? Not accomplished — mattered.",
    "If you had to describe what you're here for — not the goal, the feeling — what would it be?",

    // Nostalgia / past self
    "Which version of yourself do you miss? What did that version know that you've lost?",
    "You keep looking back at something. What are you actually looking for in it?",
    "The past version had something. What was it? And do you want it back or just what it represented?",
    "What's something you used to love that you've quietly stopped doing? What happened?",

    // Existentialism
    "The big existential questions hit harder at night. What's the specific one tonight?",
    "You're thinking about whether any of this matters. What does matter to you right now, even a little?",
    "Meaninglessness is terrifying and also strangely freeing. Which way is it landing tonight?",
    "The fact that you're asking this question means you're searching for something. What are you looking for?",

    // Death and mortality
    "Thinking about death isn't morbid — it's honest. What's making you think about it right now?",
    "Mortality is real and you're awake with it tonight. What brought it up?",
    "Sometimes sitting with how brief things are makes them more vivid. Is that what's happening?",
    "What would change if you really believed time was shorter than you think it is?",

    // Solitude
    "You're good at being alone. What does that feel like when it's right versus when it's not?",
    "Solitude and loneliness look alike from the outside. Which is this tonight?",
    "The quiet you seek — what are you actually hoping to find in it?",

    // Dreams
    "What have you been dreaming about? Not last night specifically — what keeps appearing?",
    "Dreams are interesting data. What's been recurring for you lately?",

    // Writing / journaling
    "Writing at night is different from writing during the day. What do you write that you'd never say?",
    "There's something you've been meaning to put into words. What is it?",
    "The thing you'd write if you knew nobody would ever read it — what is it?",

    // Spirituality / wonder
    "You believe in something — not necessarily God, just something. What is it?",
    "The part of life that can't be explained — what's your relationship with that?",
    "Wonder is its own kind of wisdom. What's something you find genuinely mysterious?",

    // Regret
    "What's the decision you keep revisiting? Not to change it — just examining it.",
    "Regret is actually future-oriented even though it feels past. What do you want to do differently?",
    "What would you have done if you'd trusted yourself more in that moment?",
    "The thing you didn't do — what was the fear underneath not doing it?",

    // Relationships that ended
    "What did that relationship teach you about yourself? Not about them.",
    "You still think about it sometimes. What part comes back?",
    "What was true about that connection that you still want in your life?",

    // Risk and courage
    "What's the move you keep almost making? What stops you every time?",
    "The cost of not taking this risk — what is it? Not the risk of failure — the cost of staying still.",
    "You're brave in some ways and not in others. Which is this one?",

    // Being seen vs. performing
    "The version of you that people see — how much of that is strategy versus just who you are?",
    "What would change if you stopped managing how you come across?",
    "Who's the audience in your head when you make decisions? Who are you performing for?",

    // Ambition deeper
    "Ambition costs something. What are you paying right now for yours?",
    "What are you willing to give up for the thing you want? What aren't you? That's your priority list.",
    "The thing driving you — is it desire or fear? Could be both.",
    "You want more than you let yourself admit out loud. What is it?",

    // Music as identity
    "What song has been your sound this week? What does it say about where you are?",
    "Music you make versus music you listen to — what's different about how you use each?",
    "What sound do you reach for when things are bad? What does it actually do for you?",

    // Memory
    "What's a memory that keeps appearing? What is it really about?",
    "Some memories feel like they happened yesterday no matter how long ago. What's one of yours?",
    "Memory edits itself. What version of the story have you been telling?",

    // Insomnia / body at night
    "Your body is awake even though you're tired. What's holding the tension in your body right now?",
    "Sometimes the body knows something the mind hasn't finished processing. What's unfinished?",
    "What would it take for your body to feel safe enough to rest tonight?",

    // Letting go
    "What would you gain if you let go of the thing you've been carrying? And what would you lose?",
    "Letting go doesn't mean it stops mattering. It means you stop being controlled by it. Is that possible here?",
    "What are you holding on to because releasing it would feel like betrayal or failure?",

    // Open depth
    "What's the thing you're working on that you haven't told anyone about yet?",
    "What would your creative output look like if you weren't afraid of being misunderstood?",
    "What would you make if you knew it would matter to exactly one person, and that person was you?",
    "What's a question you sit with regularly that you'd never post online?",
    "What's the version of your life you want to build that you haven't said out loud yet?",
    "What have you convinced yourself you don't care about that you actually care about a lot?",
    "You're awake with something. If you had to name the thing keeping you up, what would it actually be?",
    "What's a belief you've been testing lately without calling it that?",
    "What's a story you've told yourself for years that you're starting to doubt?",
    "What do you want the next five years to feel like from the inside?",
    "What's a value you've discovered about yourself that surprised you?",
    "What's the thing you want to create that you keep telling yourself you're not ready for?",
    "What's the difference between the life you're living and the life you're building toward?",
    "Who did you used to be that you miss? What did that version have that you want back?",
    "What's the most honest thing you know about yourself that most people don't see?",
    "What do you protect most carefully about your inner world? Why that?",
    "What's something you've believed your whole life that you're not sure you believe anymore?",
    "What would it mean for your life to have meaning? What does that actually look like?",
    "What are you afraid would happen if you stopped being productive for a while?",
    "What does freedom feel like for you? When did you last feel it?",
    "What's the version of success that would actually satisfy you — not impress, satisfy?",
    "What's the thing you're not allowing yourself to want because it seems too far?",
    "You're living in the gap between who you are and who you're becoming. What's that like?",
    "What are you building right now in the quiet that will matter later?",
    "What did you lose this year that you haven't fully grieved?",
    "What's something you understand about people now that you didn't before?",
    "What's a moment from the last year that changed how you see yourself?",
    "What's the part of yourself you've been trying to outgrow that you actually need?",
    "What would you tell the version of you from two years ago about what's coming?",
    "What's something you know is temporary but feels permanent tonight?",
    "Who are you when nobody needs anything from you?",
    "What would change in your work if you stopped trying to impress anyone?",
    "What part of your identity feels most unstable right now?",
    "What would you have to believe about yourself for this to be possible?",
    "What do you return to when everything else falls away?",
    "What's a dream you stopped talking about that you haven't stopped thinking about?",
    "What's the cost of being this honest with yourself?",
    "What are you practicing in the dark that you want to be able to do in the light?",
    "What's the thing you'd be doing with your life if you had full permission?",
    "What does the quiet version of your ambition sound like?",
    "What's the line between accepting things and giving up on them?",
    "What's something you want to build that would outlast you?",
    "What's the version of yourself you're moving toward? Describe them.",
    "What would you do with a year of complete freedom? No judgment, just the honest answer.",
    "What's a part of your story you haven't let yourself be proud of yet?",
    "What's the most interesting thing you've been thinking about lately that has nothing to do with your life?",
    "What's something beautiful you noticed today that you almost didn't notice?",
    "What do you find yourself returning to when you need to feel grounded?",
    "What's something that has stayed true about you no matter what else has changed?",
    "What would it mean to be at peace with where you are right now?",
    "What's something you've been afraid to start because you don't know how it ends?",
    "What's the true reason you're still awake?",
    "What do you need to say before you can finally rest?",
  ],

  // ─── Se'kret — 200 replies ────────────────────────────────────────────────
  sekret: [
    // Greetings / presence
    "Something brought you here — what is it?",
    "I'm here. No agenda. Where do you want to start?",
    "You showed up. That means something. What's the thing?",
    "Something's been sitting with you. What is it?",

    // Insight / reflection
    "I might be reading this wrong, but it sounds like you want to be understood without having to explain every detail. Does that feel close?",
    "You may be carrying more than you let people see. Keep the part that fits and correct what doesn't.",
    "Your answers seem to point toward wanting both privacy and real connection. Which side feels harder to ask for right now?",
    "This could be off — but it sounds less like you're confused and more like you already know and you don't love the answer yet.",
    "Something keeps circling in what you've shared. You come back to the same place without naming it directly. What's the word you'd give it?",
    "I think you're holding two things that pull in opposite directions. Which one feels more true when no one's watching?",
    "Something's sitting underneath all of this. I'm not sure what to name it yet. What word would you use?",
    "There's a version of this that's bigger than the surface. What's the version you haven't said yet?",
    "I keep coming back to one thing. Not the surface of what you said — the thing underneath. Does it feel accurate when you sit with it?",
    "You know more about this than you're letting yourself see. What do you already know?",

    // Open / discovery
    "What would it change if you let yourself actually believe that?",
    "What's the version of you in five years think about where you are right now?",
    "What part of you is trying to protect you — and is it working?",
    "What do you keep coming back to that you haven't fully let yourself look at?",
    "What do you want that you haven't let yourself want out loud yet?",
    "If you could know one true thing about yourself, what would you want it to be?",

    // Pattern recognition
    "You said two things that pull against each other. I don't think that's an accident — which one is more true?",
    "There's something you keep circling around without landing on. What's the word you keep avoiding?",
    "You described something as small, but you came here to talk about it. What makes it small?",
    "The way you described that — there's something in the specific word you chose. What did you mean by it?",
    "You've mentioned this more than once. That usually means something. What is it?",

    // Self-trust / intuition
    "You already know. What's the thing you know?",
    "What does your gut say, before your brain complicates it?",
    "You've been talking around something. What's the direct version?",
    "What would you decide if you trusted yourself completely right now?",
    "There's a version of you who figured this out. What did she know that you're pretending not to?",

    // Deeper pattern work
    "What are you teaching people about how to treat you without meaning to?",
    "You keep choosing this kind of situation. What does it offer you that keeps bringing you back?",
    "What does this keep protecting you from having to do or feel?",
    "The reaction feels big relative to the situation. What older thing might this be touching?",
    "You said you don't care — but you're here talking about it. What do you actually care about?",

    // Identity and values
    "What's a line you have that you've never crossed? What does that tell you about who you are?",
    "When you imagine the person you want to be, what's the thing you're doing that you're not doing now?",
    "What value of yours is in conflict here? That's usually where the stuck feeling comes from.",

    // Contradiction and growth
    "You're describing being two different people in two different situations. Which one is more you?",
    "What's the gap between what you say you want and what you keep choosing?",
    "Growth doesn't always feel like progress. What's changing in you that doesn't feel good yet?",

    // Closing inquiry
    "What's the thing you'd want to remember from this conversation?",
    "What question would actually be useful to sit with after this?",

    // Pattern-noticing extended
    "You've described three different situations and the same feeling appeared in each one. What is the feeling?",
    "The way you talked about this is different from how you talked about the last thing. Something shifted. What changed?",
    "You keep using the word 'fine.' I notice it appears most when things aren't fine. What's it covering?",
    "You mentioned what they did. You didn't mention what you did. What's the part you skipped?",
    "That's the second time you've minimized something that sounds significant. What's driving that?",
    "You're describing the other people in this story in a lot of detail. What's the version where we look at you instead?",
    "You've been the reasonable one in most of the situations you've described. What does it cost you to always be reasonable?",
    "You started with anger and ended with apology. What happened in between?",
    "What's something you've said you'll 'deal with later' that keeps showing up in different forms?",

    // Inner critic
    "The voice telling you that you're not enough — whose voice is that originally?",
    "When you criticize yourself, who do you sound like? Who does that remind you of?",
    "The inner critic is trying to protect you from something. What does it think will happen if you're not hard on yourself?",
    "What would the opposite of that self-critical belief feel like to hold?",
    "The standard you're failing to meet — who set it?",

    // Core beliefs
    "If this situation confirmed something you already believed about yourself, what would that belief be?",
    "What's the sentence you believe about yourself that you wouldn't say out loud?",
    "There's a story underneath the facts here. What's the story you've told yourself about who you are?",
    "What do you believe love looks like? Where did you learn that?",
    "What do you believe you deserve? And is that different from what you want?",

    // Emotional avoidance
    "You pivoted to what you're going to do about it very quickly. What's the feeling underneath that you skipped?",
    "You intellectualize well. But the feeling is still there. Where is it in your body?",
    "What emotion would you most avoid feeling in this situation? Is that the one that's actually here?",
    "Staying busy is one way to not feel something. What is it you're moving away from?",
    "What do you do when a feeling gets uncomfortable? What's your version of leaving the room?",

    // Self-sabotage
    "You got close to the thing and then something happened. What do you do when good things start becoming real?",
    "You're describing a pattern of almost — almost finishing, almost asking, almost committing. What happens right at the edge?",
    "What do you think would happen to you if this actually worked out?",
    "The self-sabotage is doing something useful for you. What is it protecting you from?",
    "When things start going well, is there a part of you that gets nervous? What is it nervous about?",

    // People-pleasing
    "You know what you want. You also know what would make them happy. Which one usually wins?",
    "You adapted yourself to make this easier for them. When did that become automatic?",
    "What's the fear underneath saying what you actually want?",
    "Whose approval are you still trying to earn? That's not a rhetorical question.",
    "You're very good at reading what people need. Who's reading what you need?",

    // Comparison
    "You're measuring yourself against someone specific. What does having what they have represent to you?",
    "What would actually be different in your life if you had the thing you're comparing?",
    "Is the comparison making you more motivated or more deflated? That changes what it means.",

    // Projection
    "You're describing what they probably think or feel. What do you actually know? What are you adding?",
    "What you assume they feel about you — is it possible that's something you feel about yourself?",
    "The way you predict how this ends — whose past experience is that really based on?",

    // Fear of abandonment / rejection
    "You keep a certain distance even from people you care about. What are you protecting yourself from?",
    "What's the version of this story where they stay? What feels scary about imagining it?",
    "You pulled back. What were you afraid was about to happen?",
    "When connection gets close, something in you tends to test it. Is that familiar?",
    "Rejection feels familiar for you. I wonder if you sometimes create it to control when it happens.",

    // Fear of success
    "What does it mean about you if this actually works? What does it change about your identity?",
    "You're close to something real and you're stalling. What would happen to who you are if you succeeded?",
    "You've told me why it might not work. Have you asked yourself why you might want it not to?",

    // Approval seeking
    "You did the thing and then immediately checked to see how it landed. What were you looking for?",
    "Whose validation would actually satisfy you? If you got it, would you believe it?",
    "You don't trust good feedback but you believe the criticism. What does that tell you?",

    // Conflict avoidance
    "You said what you needed to say — the version that kept the peace. What did you not say?",
    "You smoothed it over again. What would happen if you didn't?",
    "Avoiding conflict keeps you safe from one thing and costs you another. What's the cost?",

    // Black-and-white thinking
    "It's not all terrible or all fine. Where's the actual complicated version?",
    "You put it in a category very quickly. What does the in-between look like?",

    // Rationalization
    "That's a very logical explanation. What does the emotional one sound like?",
    "You've justified this very well. What would the unjustified version say?",

    // Minimization
    "You used the word 'just.' You do that when something is actually significant. What's actually significant here?",
    "You're making this smaller than it is. What's the full size of it?",

    // Catastrophizing
    "The worst-case version is very detailed. What's the most realistic version?",
    "What would have to be true for this to end okay? Can any of those things be true?",

    // Connection needs
    "What kind of connection are you actually hungry for right now? Not company — connection.",
    "You want to be known by someone. What part of you do you most want someone to actually see?",
    "What does it feel like when someone really sees you? When did you last feel that?",

    // Narrative
    "You're the narrator of your own life. What's the genre of the story you're telling right now?",
    "What would change if this was a chapter in a longer story rather than the whole thing?",
    "How would you tell this story in five years? What becomes the point of it?",

    // Meaning
    "What is this experience for? Not why it happened — what is it for in your life?",
    "What is this teaching you, even if you'd rather not be learning it?",

    // Boundary dynamics
    "They moved a boundary you'd set. You're explaining why it was probably okay. Is it okay?",
    "You said yes when you meant no. What made you do that?",
    "You let something in that you'd decided wasn't allowed. What changed?",

    // Helping reflex
    "You moved quickly to helping them. What does focusing on someone else's problem do for you right now?",
    "You're very good at being useful. What happens when you can't be?",

    // Control as anxiety
    "The thing you're trying to control — can you actually control it? What happens when you sit with the answer?",
    "You organize when things feel uncertain. What does having order do for the feeling underneath?",
    "Trying to control this is keeping you from feeling something. What is it?",

    // Identity
    "Who are you when nobody needs you to be a particular version of you?",
    "The label you've accepted for yourself — where did you pick that up?",
    "You're made of contradictions. Which contradiction is alive right now?",
    "What part of your identity are you most afraid of losing?",
    "What have you outgrown that you're still carrying because letting go would require grief?",

    // Grief
    "Grief doesn't need a reason people recognize. What are you grieving?",
    "The thing you lost changed who you were. What did you lose along with it?",
    "You haven't let yourself fully feel this loss. What would happen if you did?",

    // Relationship patterns
    "What's a pattern in your relationships that you can now see that you couldn't before?",
    "What do you keep getting from people that you've decided is enough, even though it's not?",
    "What do you ask for directly versus what do you expect people to notice? What does that gap cost you?",
    "The way you described that person — how much of that is about them and how much is about what they represent to you?",

    // Self-defeating behavior
    "What's the thing you keep choosing that you know isn't good for you? What does it offer you?",
    "You described the outcome you want. But what outcome are you actually moving toward?",
    "What's the belief that's running this situation without you consciously choosing it?",
    "When you imagine yourself a year from now, what are you most afraid will be the same?",

    // Identity construction
    "What's something you've built your identity around that might not actually be true?",
    "You've mentioned not wanting to be like a specific person. What are you afraid of inheriting?",
    "What's something you protect about yourself that you've never had to put into words?",
    "The thing you're working hardest to hide — is it something you've done, or something you feel?",
    "What would you stop doing if you weren't afraid of what it would say about you?",
    "What do you think you need to become before you're allowed to have the thing you want?",

    // Agency and choice
    "There's a version of you that doesn't need approval to move. What does she do first?",
    "What's a feeling you've been having that you've been explaining to yourself as something other than a feeling?",
    "You're anticipating rejection so confidently. What does that confidence come from?",
    "What would you notice about yourself in this situation if you were watching from the outside?",
    "What's the difference between the person you present and the person you are when you're alone?",
    "What do you repeat that you learned from watching someone else navigate the world?",
    "You mentioned what you don't want. What do you actually want? Say the direct version.",
    "What emotion are you least comfortable sitting with? How do you know when it's there?",

    // Care and needs
    "The thing you want most from other people — when do you give that to yourself?",
    "What's a boundary you cross on yourself regularly that you'd never let someone else cross?",
    "What's underneath the urgency you feel about this?",
    "You've been circling this for a while. What would it take to just say the thing?",
    "What are you loyal to that doesn't deserve your loyalty anymore?",
    "What role do you play in the situations that keep going badly?",
    "What do you consistently underestimate about yourself?",
    "What do you consistently overestimate about others?",
    "What's something you call a preference that is actually a need?",
    "What are you pretending doesn't matter that actually matters a lot?",

    // Story and truth
    "The story you're telling about this person — is it complete, or is it protecting you from a more complicated truth?",
    "What do you do with anger that makes it worse?",
    "What does disappointment feel like for you? Where does it go?",
    "What's a version of yourself you've been trying to get back to that you've already left behind?",
    "When you say you're okay, what are you actually saying?",
    "What would happen to this relationship if you stopped managing the other person's feelings?",
    "What do you most need people to understand about you that you've stopped trying to explain?",
    "What decision are you waiting for someone else to make for you?",
    "What's the thing you're most proud of about how you've handled this that you haven't acknowledged?",
    "What's a fear that's actually a wish in disguise?",
    "What would you have to believe about the future to feel okay right now?",
    "What are you rehearsing for a conversation that might never happen?",
    "What part of the truth about this have you been keeping most carefully to yourself?",
    "What is it costing you to stay uncertain about this?",
    "What feeling are you most skilled at turning into a task or a plan?",
    "What does it mean to you to be understood? When did you last feel it?",
    "What's the hardest thing about being seen clearly by someone?",
    "What would you have to give up to get what you actually want here?",
    "What's the difference between who you are and who you're performing right now?",
    "What's a fear that's organizing your behavior that you haven't named directly?",
    "What would you trust yourself to do if you stopped second-guessing this?",
    "What's behind the thing you called the reason? What's the deeper reason?",
    "What's something true about you that you haven't let become part of your identity yet?",
    "What's the feeling you're working hardest not to feel in this situation?",
    "What are you getting from this dynamic that you don't want to admit you need?",
    "What's the question you'd most like someone to ask you that nobody ever asks?",
    "What part of this situation is actually about something that happened a long time ago?",
    "When you imagine being fully free of this, what else would you have to face?",
    "What would you do with your attention if this wasn't taking all of it?",
    "What's something you've started to outgrow that you're not quite ready to name yet?",
    "What do you keep waiting to feel before you let yourself move forward?",
    "What's a way you've been unfair to yourself in how you're thinking about this?",
    "What would it take for you to trust that you're enough for the thing you want?",
    "What's the thing you've decided about yourself based on one or two moments that might not be the whole story?",
    "What are you afraid you'd discover about yourself if you stayed still long enough?",
    "What would change if you stopped treating this feeling as a problem to be solved?",
    "What's one thing you know for certain about yourself that stays true even here?",
  ],

  // ─── Parent Coach — 200 replies ───────────────────────────────────────────
  parentCoach: [
    // Greetings
    "Hey. Glad you're here. What's going on at home?",
    "Hi. Tell me what's happening — I'm listening.",
    "What brought you here today? Start wherever feels right.",

    // Emotional support
    "That sounds like a lot to carry. What's the part that's hardest right now?",
    "Tell me what you're actually seeing — not what you're afraid of, just what's there.",
    "What would feel different if this conversation went well?",
    "You showed up for this. That matters. What's weighing on you most?",
    "That sounds exhausting. How long have you been holding that?",
    "You're doing the harder thing, which is actually caring about this. What's the most pressing part?",

    // Practical / advice
    "What's one thing you could do differently next time — not the whole repair, just one thing?",
    "What do you actually know about what your teen is going through, vs. what you're filling in?",
    "What did they need from you in that moment? And what did you give them instead?",
    "When did things start to shift? Not the argument — the thing before the argument.",

    // Closing / forward
    "What would success look like for the next conversation you have with them?",
    "You can't fix everything, but you can show up. What's the smallest way to do that tomorrow?",

    // Parenting guilt
    "You're here, which means you care. Guilt that shows up as action is different from guilt that just sits there.",
    "You can't undo that moment. What can you do in the next one?",
    "The fact that it's bothering you is actually a good sign. What do you want to do with it?",

    // Celebrating teen wins
    "That's worth celebrating. Did you tell them you noticed?",
    "Your teen did something hard. How did you respond in the moment?",
    "That's a real win for them. What do you think helped it happen?",

    // Communication repair
    "What did you mean to say versus what actually came out?",
    "If you could have that conversation again, what would you say differently?",
    "What do you think they heard? Not what you said — what they actually heard.",
    "An apology without explanation or an explanation without apology — which does your teen need?",

    // Parent's own overwhelm
    "Parenting a teenager while managing your own life is a lot. What's feeling most out of control right now?",
    "You're allowed to be struggling with this. What would help you first before you can help them?",
    "It sounds like you needed someone to say it's hard before you could even get to the advice. Is that right?",
    "What would you tell a friend who came to you with this same thing?",

    // Co-regulation and presence
    "Your nervous system affects theirs. How are you doing right now, honestly?",
    "You can't pour from empty. What would help you regulate before the next conversation with them?",
    "What does it feel like in your body when things escalate with them? Where do you feel it?",

    // Listening without fixing
    "What if the goal of the next conversation was just to understand them, not fix anything?",
    "What do you think they actually need from you in this moment — advice, presence, or space?",
    "Have you asked them what they need? Not what you think they need — what they say they need?",

    // Understanding teen perspective
    "When you were their age, what did you need most from a parent that you weren't getting?",
    "What do you think they're most afraid of right now? Not about you — in general?",
    "What does their world feel like from inside it? What pressures are they carrying?",

    // Long-term connection
    "What kind of relationship do you want with them in ten years? What would build toward that?",
    "Connection with teenagers is built in small moments. What's a small moment you could create this week?",
    "What's one thing you could do consistently that would help them feel safe coming to you?",

    // Repair after rupture
    "Repair doesn't require perfection. What's the smallest honest thing you could say?",
    "Teenagers remember when adults take accountability. What would a real repair look like here?",
    "You don't have to have all the answers. Sometimes 'I'm still figuring this out too' is enough.",

    // When teen won't talk
    "They shut down and you don't know how to reach them. What was the last conversation that actually connected?",
    "Silence isn't always rejection. What do you think they're protecting themselves from?",
    "What have you tried that hasn't worked? Sometimes knowing what not to do is the first step.",
    "When teens go quiet it's usually not about the parent. What else is going on in their life right now?",
    "The most important thing when they're not talking is staying present without pressure. What does that look like for you?",
    "What would make them feel safe enough to open up? Not in theory — in their actual world right now?",

    // Technology / screens
    "Screen time battles usually aren't about screens. What's the underlying concern?",
    "What does their relationship with their phone tell you about what they're getting from it?",
    "Banning something tends to drive it underground. What's an approach you could actually sustain?",
    "What digital life skills do you actually want them to have by the time they leave home?",
    "They're more connected online than offline right now. Is that new or has it been building?",

    // Teen dating
    "What's your actual concern — the person, the relationship itself, or what it represents?",
    "What do you want them to learn from early relationships? How do you help them get that?",
    "You can't control who they like. What conversation do you actually want to have with them?",
    "When you were their age, what would you have needed an adult to say about relationships?",

    // Social media
    "What specifically worries you about how they're using it?",
    "Social comparison, performance, permanence — which of these is your biggest concern for them right now?",
    "They're growing up in a public-facing world. What skill do you most want them to develop for it?",
    "Have you had a direct conversation about the content they're consuming? How did that go?",

    // College / future pressure
    "Who's the pressure coming from — you, them, or the culture around you both?",
    "What do you actually want for them? Not what you think they should do — what outcome would feel like success?",
    "The college conversation can become about you if you're not careful. Have you checked that?",
    "What if they didn't go the traditional path? What's the actual fear under that?",

    // Academic struggle
    "What's happening academically versus what's happening emotionally? They're often two different things.",
    "Are you solving their problem or helping them develop the capacity to solve it? Both have a place.",
    "The grade is a symptom. What's the actual thing?",
    "What support have you offered that they've actually received, versus what they've deflected?",

    // Friend group concerns
    "What specifically about this friend or group concerns you?",
    "They're choosing these people for a reason. What need are those friendships meeting?",
    "Forbidding friendships tends to make them more important. What's your actual move here?",
    "Have you actually met the person you're worried about? What do you know versus what you're assuming?",

    // Substance concerns
    "What do you actually know versus what you suspect? Those are different conversations.",
    "Shutting down that conversation is worse than having a hard conversation. What are you afraid to say?",
    "What was your relationship with your parents like when this topic came up at their age?",
    "They're likely to encounter this. What do you want them to know before they do?",

    // Teen's identity / coming out
    "They told you something. Before advice or questions — how are you doing with it?",
    "What they need most right now is a parent who's still there. What would that look like from your side?",
    "You might be processing this on a different timeline than they are. How do you close that gap?",
    "What fear do you have that you haven't said out loud yet? Let's look at it.",

    // Co-parenting
    "The disagreement between you two is becoming background noise your teen is absorbing. What's the most important thing to agree on?",
    "You can't control what happens at the other household. What can you actually control here?",
    "What message does your teen hear when they're caught in the middle?",

    // Parenting through divorce
    "Your teen is watching how you handle this loss. What do you want them to see?",
    "The grief of the family shape changing is real for them even if they don't say it. How are you holding space for that?",
    "What do they need from you specifically right now, separate from what you need to process?",

    // Parent's own mental health
    "Taking care of your mental health isn't separate from parenting well — it's the same thing. What do you need?",
    "You can't model emotional health for them while depleted. What's genuinely non-negotiable for you?",
    "What are you carrying that's affecting how you show up? It's not a confession — it's useful information.",

    // Parent's childhood wounds
    "What's being triggered in you right now that belongs to your past, not their present?",
    "Which part of this is about them and which part is about what you didn't get?",
    "The reaction you just described is bigger than the situation. What's it touching?",
    "You're parenting the teenager you were. That's different from parenting the teenager they are. What's different about them?",

    // Trust after lying
    "Trust is rebuilt slowly and specifically. What's one concrete thing they could do that would be meaningful to you?",
    "What is the lie really about — the thing they did, or the relationship between you?",
    "They lied because they were afraid of your reaction. Does that information change anything for you?",
    "Surveillance fixes the immediate problem and creates a different one. What's the approach that actually builds something?",

    // Privacy
    "There's a difference between privacy and secrecy. What is it in your specific situation?",
    "What's the actual thing you're trying to protect them from? Is monitoring the right tool for that?",
    "What do you want them to learn about privacy and trust from how you handle this?",

    // Letting go / transition
    "The move toward independence is healthy even when it's hard to watch. What are you grieving?",
    "They're becoming a person who doesn't need you the same way. That's success, not failure. What does it feel like?",
    "The job is shifting from protecting them to believing in them. How do you make that shift?",
    "Letting them make mistakes is one of the hardest parts of parenting older teens. What decision are you watching them make?",
    "What do you want your relationship with them to look like when they're twenty-five? Work backward from there.",

    // Parent feeling rejected
    "They don't need you the way they used to and that's disorienting. What do you miss most?",
    "Being pushed away doesn't mean they don't need you — it just means they need you differently. What's the new way?",
    "You've done so much and you're getting a door shut. That's painful. What do you need to hear right now?",

    // Teen's anger
    "They're angry at you. What's underneath the anger? Not for them — what do you think is actually going on?",
    "Anger is information. What is it telling you about what they need?",
    "You could fight back or you could stay curious. What happens when you choose curiosity?",
    "The anger is real even if the words aren't fair. Can you separate those two things?",

    // Empathy vs. enabling
    "There's a line between making their pain smaller and rescuing them from it. Where is that line here?",
    "What are you doing for them that they need to do for themselves? Where's the line?",
    "They need to feel their feelings, not have them solved. How do you sit with them without fixing?",

    // Getting professional help
    "What's stopped you from getting them into therapy before now?",
    "How do you bring up therapy in a way that doesn't feel like an accusation?",
    "What would make them more open to it? The framing often matters more than the ask.",
    "You've hit the limit of what you can do alone. That's not failure — that's wisdom. What's the first step?",

    // Connection in small moments
    "What does your teen love that you could participate in, even badly? The effort matters more than the skill.",
    "You don't need a deep conversation. What's a five-minute thing that lets them know you're there?",
    "What's something they've mentioned they like that you've never asked them to tell you more about?",
    "Side-by-side activities work better than face-to-face for a lot of teens. What could that look like?",

    // Saying sorry as a parent
    "You don't have to justify what you did and apologize in the same sentence. What's the actual apology?",
    "Modeling accountability is one of the most powerful things you can do. What would a clean apology sound like?",
    "They've probably been waiting for you to say that. What's made it hard?",

    // Staying connected through conflict
    "You can be in disagreement and still be in connection. What does that look like for your family?",
    "The relationship is more important than winning this one. What would it take to remember that in the moment?",
    "What's a line you've said repeatedly that has never worked? What could you say instead?",

    // Teen's future anxiety
    "Their anxiety about the future is a sign they care about it. What do they need from you to hold that?",
    "Your job isn't to take away their anxiety about the future — it's to believe in them enough that they believe in themselves.",
    "What pressure are you adding to the future conversation that you could actually take off?",

    // Feeling like a bad parent
    "The fact that you're asking this question means you're not the parent you're afraid you are. What happened?",
    "Good enough parenting is real. What standard are you actually holding yourself to?",
    "You're not defined by your worst moment with them. What's the truest thing about how you show up?",

    // Open depth
    "What do you think they're most afraid of right now — not about you, in general?",
    "What does their world feel like from inside it? What pressures are they carrying that you can name?",
    "How do you stay regulated when they're dysregulated? What's your actual practice for that?",
    "What does your teen need to hear from you that they've never heard you say?",
    "What's something you did as a parent this week that you actually feel good about?",
    "What's one thing you could start doing consistently that would make a difference over time?",
    "What do you wish your teen understood about your intentions that they don't seem to get?",
    "What are you modeling right now, even when you don't mean to be?",
    "What's a boundary you've set that isn't working? What's not working about it?",
    "You're trying to protect them from something. Is the protection working, or is it just making it invisible?",
    "What's the difference between a phase and a pattern? Do you know which this is?",
    "When's the last time you told them something about yourself — not advice, just something true about you?",
    "What do they know about your life at their age? Would knowing more help or hurt?",
    "What would it mean for your teen to feel truly known by you?",
    "What's something your teen has said or done recently that surprised you in a good way?",
    "What do you wish someone had told you about parenting teenagers before you got here?",
    "What's something you've learned about your teenager this year that changed how you see them?",
    "What's one thing you want them to take into adulthood that you've been able to give them?",
    "What is your teen currently teaching you? Even if it's the hard way.",
    "What's the conversation you're most afraid to have with them? Why?",
    "What's a rule in your home that's more about your anxiety than their safety?",
    "What's something they're doing right that you haven't told them lately?",
    "You know your teenager better than any expert does. What does what you know tell you to do?",
    "What's something you've been wrong about with them that you've been willing to admit?",
    "What would it mean to trust them more? What's the fear underneath not trusting them?",
    "What kind of adult do you want them to become? And what are you doing now that plants those seeds?",
    "What does a repaired relationship with a teenager look like — not fixed, repaired. What's the difference?",
    "What's the hardest thing about loving someone who is actively pulling away from you?",
    "What do you need right now — as a person, not as a parent?",
    "You've been holding this alone. Who do you have to talk to about the parenting stuff?",
    "What does good enough look like for this week specifically, not in general?",
    "What's one expectation of yourself as a parent that you could gently put down?",
    "What's something you learned from your own parents — good or bad — that shapes how you parent?",
    "What would a more patient version of yourself do in this moment with them?",
    "What's the thing your teenager would say if they were really honest about what they need from you?",
    "What does staying connected through the hard parts look like for you two specifically?",
    "You're showing up even when it's hard. Are they able to see that?",
    "What's the next small thing you could do to show them you're still there?",
    "What's the difference between being consistent and being rigid? Which are you being right now?",
    "What would it feel like to just sit with them without any agenda tonight?",
    "What do you think they need most from you that has nothing to do with solving any problem?",
    "What's a story from your own adolescence that might help them feel less alone if they heard it?",
    "What are you afraid would happen to your relationship if you admitted you don't always know what to do?",
    "What would it take to feel like you've done a good enough job as their parent?",
    "What's something your teenager has handled better than you expected?",
    "What's one thing they need to hear that you're afraid they won't receive well?",
    "You love them in a way they might not be able to see right now. What would show it without saying it?",
    "What's one thing you're committed to changing about how you show up for them?",
    "What's the conversation that, if you had it well, would change something between you?",
    "What's the thing about them that you're most grateful for, even right now?",
    "What's your version of success for this week with them? Keep it small.",
    "What's something they've taught you about yourself that you couldn't have seen before them?",
    "What do you want them to know about how much you love them — not if, but how?",
    "What would it mean for both of you if this hard season became a turning point?",
    "What's one step you could take this week toward the relationship you want with them?",
    "You're here because you care this much. That's not nothing. What's the next right thing?",
    "What do you want them to remember about this time — not the conflict, but you?",
  ],
};
