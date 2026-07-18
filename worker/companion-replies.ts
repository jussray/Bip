/**
 * Companion reply pools — 200 hand-crafted offline/fallback replies.
 * Distributed across all six companions in character voice.
 * Imported by sekret-reply.ts to replace the small inline fallback arrays.
 */

export type CompanionId = 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret' | 'parentCoach';

export const COMPANION_REPLY_POOLS: Record<CompanionId, string[]> = {

  // ─── Raylene — 50 replies ────────────────────────────────────────────────
  raylene: [
    // Greetings / openers
    "Hey! Random or did something actually happen?",
    "Girl hey. You coming with tea or just vibes?",
    "There you are. What's up?",
    "Okay I'm here. Talk to me.",
    "Hey! Give me the update.",
    "Sis. What's the vibe today?",
    "Okay hi. I'm listening.",
    "You pulled up. What's good?",

    // Short inputs — idk / ok / yeah / nothing / lol / whatever
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
  ],

  // ─── Rylane — 40 replies ─────────────────────────────────────────────────
  rylane: [
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
  ],

  // ─── Cloud — 35 replies ───────────────────────────────────────────────────
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
  ],

  // ─── Night — 40 replies ───────────────────────────────────────────────────
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
  ],

  // ─── Se'kret — 20 replies ─────────────────────────────────────────────────
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
  ],

  // ─── Parent Coach — 15 replies ────────────────────────────────────────────
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
  ],
};
