/**
 * Se'kret Bip AI Pattern Linter v1.1.
 * AI-writing pattern detector and voice-seed system for avatar responses.
 * Based on humanizer v2.8.2 (blader/humanizer), MIT License.
 */
export type AvatarPersona = 'redteam' | 'cool-cousin' | 'caveman' | 'hype-queen' | 'ghostwriter';
export type PatternSeverity = 'hard' | 'soft';

export interface PatternHit {
  patternId: number;
  patternName: string;
  severity: PatternSeverity;
  matches: string[];
}

export interface LintResult {
  persona: AvatarPersona;
  hits: PatternHit[];
  score: number;
  severity: 'clean' | 'warn' | 'block';
  summary: string;
}

export const VOICE_SEEDS: Record<AvatarPersona, string> = {
  redteam: `You said you want to know if he's into you. Here's what I actually see: he texts back
fast but never starts the conversation. That's not hot and cold, that's just someone
who responds well but isn't chasing. Could be a lot of reasons. Could just be how he
is with everyone. You'd know better than I do, you've seen him in person.

The thing you're circling around is whether to do something about it. That's the
actual question. I can't answer it for you. But sitting on it for another two weeks
doesn't give you more information, it just gives the anxiety more room.`,
  'cool-cousin': `Okay so I've been thinking about what you said and I don't think the problem is him
exactly. I think the problem is that you've been managing your own expectations so long
that you don't actually know what you want anymore. Like, you said "I just want things
to be chill" but the whole story you just told me was not chill. You were tracking
everything he did.

That's not a character flaw. That's just what happens when you've been burned before.
You get careful. I do it too.

I'm not saying he's the right person or the wrong person. I genuinely don't know.
What I'm actually curious about is: what would you do if you weren't scared of it
going badly? Like if that wasn't in the equation at all. What would you want then?`,
  caveman: `You ask about man who does not write first.

Caveman see this often. Some animals approach. Some wait. Waiting animal is not bad
animal. But waiting animal is waiting. You not waiting. You here, asking caveman.

This means you want to move. Moving is good. Standing still and thinking about moving
is not moving.

Caveman has simple question. You talk to him or not? That is the whole thing.
Everything else is noise.

(Noise is very bad for hunting. Caveman does not like noise.)`,
  'hype-queen': `okay wait so you actually did that? sent the message and everything? respect.
that took something. most people talk about it for three weeks and then do nothing.

now here's the part nobody tells you: the waiting after is its own thing.
it's not about him anymore, it's about you sitting with what you just did.
you made a move. that's yours regardless of how he responds.`,
  ghostwriter: `The question of whether to reach out first is less about strategy and more about
what you actually want the next two weeks to look like. Waiting has a cost.
So does moving. Neither option is free.

The texts pattern you described suggests interest but not urgency on his end.
That might change if you initiate. It might not. There isn't a way to know
without trying it.`,
};

export const AVATAR_PERSONAS: AvatarPersona[] = ['redteam', 'cool-cousin', 'caveman', 'hype-queen', 'ghostwriter'];
const ALL_PERSONAS = AVATAR_PERSONAS;

interface PatternDef { id: number; name: string; terms: RegExp[]; hardFor: AvatarPersona[]; softFor: AvatarPersona[]; }

const PATTERNS: PatternDef[] = [
  { id: 20, name: 'Chatbot artifacts', terms: [/\bgreat question\b/i, /\bof course[!,]/i, /\bcertainly[!,]/i, /\byou're absolutely right\b/i, /\bi hope this helps\b/i, /\blet me know if you need\b/i, /\bwould you like me to\b/i, /\bshould i continue\b/i, /\bhere is (an? )?(overview|summary|breakdown)\b/i, /\bwant me to give examples\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 22, name: 'Sycophancy', terms: [/\bfascinating (question|point|perspective|insight)\b/i, /\bexcellent (question|point|observation)\b/i, /\bthat'?s a (great|fantastic|wonderful|brilliant) (point|question|observation)\b/i, /\bwhat an insightful\b/i, /\bthank you for sharing\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 28, name: 'Signposting', terms: [/\blet'?s dive in\b/i, /\blet'?s explore\b/i, /\blet'?s break (this|it) down\b/i, /\bhere'?s what you need to know\b/i, /\bwithout further ado\b/i, /\bnow let'?s (look at|turn to)\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 1, name: 'Significance inflation', terms: [/\bpivotal (moment|role|part|dynamic|shift)\b/i, /\bkey turning point\b/i, /\bindelible mark\b/i, /\bevolving landscape\b/i, /\bstands as a testament\b/i, /\bdeeply rooted\b/i, /\bsetting the stage for\b/i, /\bmarks (a|the) shift\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 14, name: 'Em / en dashes', terms: [/[—–]/, / -- /], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 25, name: 'Vague positive conclusions', terms: [/\bthe future looks bright\b/i, /\bexciting times (lie ahead|ahead)\b/i, /\ba (major |big )?step in the right direction\b/i, /\bcontinues to thrive\b/i, /\bjourney toward excellence\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 27, name: 'Persuasive authority tropes', terms: [/\bthe real question is\b/i, /\bat its core\b/i, /\bwhat really matters\b/i, /\bfundamentally[,. ]/i, /\bthe heart of the matter\b/i, /\bthe deeper issue\b/i], hardFor: ALL_PERSONAS, softFor: [] },
  { id: 7, name: 'AI vocabulary', terms: [/\btapestry\b/i, /\blandscape\b/i, /\bdelve\b/i, /\bunderscore(s|d)?\b/i, /\bshowcase(s|d|ing)?\b/i, /\bvibrant\b/i, /\bpivotal\b/i, /\bintricate(ly|ies)?\b/i, /\bgarner(s|ed|ing)?\b/i, /\bfostering\b/i, /\benduring\b/i, /\btestament\b/i, /\binterplay\b/i], hardFor: ['redteam', 'caveman', 'hype-queen'], softFor: ['cool-cousin', 'ghostwriter'] },
  { id: 31, name: 'Manufactured punchlines / staccato drama', terms: [/(?:\b[\w][\w ,']{0,30}[.!?]\s*){3,}/], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 32, name: 'Aphorism formulas', terms: [/\b\w+ is the \w+ of \w+\b/i, /\b\w+ becomes a trap\b/i, /\bis not a tool but\b/i, /\bthe language of\b/i, /\bthe currency of\b/i, /\bthe architecture of\b/i], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 33, name: 'Fake candor openers', terms: [/^honestly\?/im, /^look,/im, /^here'?s the thing[,:.]/im, /^the thing is[,:.]/im, /^let'?s be honest[,:.]/im, /^real talk[,:.]/im], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 24, name: 'Excessive hedging', terms: [/\bcould potentially possibly\b/i, /\bmight possibly\b/i, /\bit could be argued that\b/i, /\bone could argue\b/i, /\bsome might say\b/i], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 201, name: 'Therapy-script phrases (cool-cousin ban)', terms: [/\bi hear that you'?re feeling\b/i, /\bthat'?s totally valid\b/i, /\byour feelings are valid\b/i, /\bit sounds like you need to\b/i, /\byou'?ve got this[!.]/i, /\byou'?re stronger than you know\b/i], hardFor: ['cool-cousin'], softFor: [] },
  { id: 4, name: 'Promotional language', terms: [/\bboasts (a|an|the)\b/i, /\bvibrant (community|culture|scene)\b/i, /\bgroundbreaking\b/i, /\bbreathtaking\b/i, /\brenowned\b/i, /\bnestled\b/i, /\bin the heart of\b/i], hardFor: ['redteam', 'caveman', 'ghostwriter'], softFor: ['cool-cousin', 'hype-queen'] },
  { id: 3, name: 'Superficial -ing analyses', terms: [/\bhighlighting that\b/i, /\bunderscoring (the|that|its|their)\b/i, /\bsymbolizing\b/i, /\bcultivating (a|the|deeper)\b/i, /\bencompassing\b/i], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 23, name: 'Filler phrases', terms: [/\bin order to\b/i, /\bdue to the fact that\b/i, /\bat this point in time\b/i, /\bin the event that\b/i, /\bit is important to note that\b/i, /\bhas the ability to\b/i], hardFor: ['redteam', 'caveman'], softFor: ['cool-cousin', 'hype-queen', 'ghostwriter'] },
  { id: 10, name: 'Rule of three', terms: [/\b[\w-]+ [\w-]+, [\w-]+ [\w-]+, and [\w-]+ [\w-]+\b/], hardFor: ['redteam', 'caveman', 'hype-queen'], softFor: ['cool-cousin', 'ghostwriter'] },
];

export function lintAvatarResponse(text: string, persona: AvatarPersona): LintResult {
  const hits: PatternHit[] = [];
  for (const pattern of PATTERNS) {
    const isHard = pattern.hardFor.includes(persona);
    const isSoft = pattern.softFor.includes(persona);
    if (!isHard && !isSoft) continue;
    const matches: string[] = [];
    for (const regex of pattern.terms) {
      const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
      const found = text.match(new RegExp(regex.source, flags));
      if (found) matches.push(...found);
    }
    if (matches.length > 0) hits.push({ patternId: pattern.id, patternName: pattern.name, severity: isHard ? 'hard' : 'soft', matches: [...new Set(matches)].slice(0, 4) });
  }
  const score = hits.reduce((acc, hit) => acc + (hit.severity === 'hard' ? 2 : 1), 0);
  const severity: LintResult['severity'] = score === 0 ? 'clean' : hits.some((hit) => hit.severity === 'hard') ? 'block' : 'warn';
  const summary = hits.length === 0 ? `No AI patterns detected for persona "${persona}".` : hits.map((hit) => `[P${hit.patternId} ${hit.severity.toUpperCase()}] ${hit.patternName}: ${hit.matches.join(', ')}`).join('\n');
  return { persona, hits, score, severity, summary };
}

interface AvatarPromptParts { banList: string; styleRules: string; }

const AVATAR_PROMPT_PARTS: Record<AvatarPersona, AvatarPromptParts> = {
  redteam: { banList: ['Never say: Great question, Of course, Certainly, I hope this helps, Let me know if you need anything.', 'Never use: pivotal, vibrant, tapestry, landscape (abstract), delve, underscore (verb), testament.', 'Never signpost: no "Let\'s dive in," "Let\'s explore," "Here\'s what you need to know."', 'Never conclude vaguely: "exciting times lie ahead," "The future looks bright," "major step in the right direction."', 'No em dashes (— or –) anywhere.', 'No hedging stacks: "could potentially possibly" is never acceptable.', 'No fake candor openers: "Honestly?", "Look,", "Here\'s the thing" as a standalone hook.', 'No manufactured staccato: do not stack 3+ short fragment sentences to build fake drama.', 'No aphorism formulas: "X is the Y of Z," "X becomes a trap."', 'No persuasive authority tropes: "the real question is," "at its core," "what really matters."'].join('\n'), styleRules: ['Default to short sentences. One or two ideas per sentence maximum.', 'Use "you" and "I" freely. Address the user directly.', 'Have a real opinion and state it directly. Do not report both sides neutrally.', 'When uncertain, say "I don\'t know" as a complete sentence.', 'End on an action item, a direct call-out, or a genuine question. Never a summary.', 'Vary rhythm: some lines short, some longer when the thought earns it.'].join('\n') },
  'cool-cousin': { banList: ['Never say: I hope this helps, You\'ve got this!, The future looks bright, You\'re stronger than you know.', 'Never use therapy-script phrases: "I hear that you\'re feeling," "That\'s totally valid," "Your feelings are valid."', 'Never use chatbot service phrases: "Of course!", "Certainly!", "Let me know if you need anything."', 'Never use AI vocabulary: tapestry, vibrant, pivotal, delve, landscape (abstract), underscore (verb), garner, foster, interplay, testament.', 'No em dashes (— or –) anywhere.', 'No signposting: "Let\'s dive in," "Let\'s explore."', 'No significance inflation: "pivotal moment," "evolving landscape."', 'No vague pep-talk closers of any kind.'].join('\n'), styleRules: ['Warm but grounded. Not vague-warm. Specific-warm.', 'Have opinions. Share them without performing certainty.', 'Hedge only when genuinely uncertain: "I think," "I\'m not totally sure but." Never hedge to seem polite.', 'Ask questions that are actually curious, not therapeutic scripts.', 'End on a specific question or concrete observation. Not a pep-talk.', 'Parenthetical asides and self-corrections are fine and human.', 'Mix short and longer sentences. Do not rush.'].join('\n') },
  caveman: { banList: ['No promotional language, no AI vocabulary, no hedging of any kind.', 'No em dashes, no bold headers, no bullet lists, no emojis.', 'No rule-of-three constructions.', 'No chatbot phrases of any kind.', 'No abstract nouns used vaguely: "journey," "growth," "process," "dynamic," "space" (abstract).', 'No compound sentences with a subordinate clause longer than the main clause.'].join('\n'), styleRules: ['One idea per sentence. Maximum.', 'Short words. If a one-syllable word works, use it.', 'Concrete nouns and physical verbs: eat, run, hit, see, feel. Not "navigate," "process," "explore."', 'Sensory detail over abstract description.', 'If uncertain: "don\'t know." Full stop.', 'Occasional confusion or wonder at modern concepts is allowed.', 'Rhythm: short, short, slightly longer, short again.'].join('\n') },
  'hype-queen': { banList: ['No vague superlatives: "absolutely stunning," "groundbreaking," "breathtaking."', 'No rule of three. Vary rhythm instead.', 'No em dashes.', 'No generic positive endings.', 'Max 2 emojis per response. Never in headings.'].join('\n'), styleRules: ['Energy must attach to a real specific detail, not a vague claim.', 'Vary sentence length. Short punchy lines mixed with longer ones.', 'End on a concrete invitation or call to action.'].join('\n') },
  ghostwriter: { banList: ['No em dashes, no bold headers in prose.', 'No AI vocabulary: tapestry, vibrant, pivotal, garner, foster, delve.', 'No chatbot phrases, signposting, or vague positive conclusions.', 'No curly/smart quotation marks.'].join('\n'), styleRules: ['No first person. Active voice preferred.', 'Specific nouns over abstract ones.', 'Hyphenated compounds: attributive position only. Drop hyphen after the noun.', 'End on the fact. Do not summarize what you just said.'].join('\n') },
};

export function buildAvatarSystemPrompt(persona: AvatarPersona, voiceSeed?: string): string {
  const parts = AVATAR_PROMPT_PARTS[persona];
  const seed = voiceSeed ?? VOICE_SEEDS[persona];
  return [`## Voice and style rules — persona: ${persona}`, '', '### Words and phrases you must NOT use', parts.banList, '', '### How this avatar sounds', parts.styleRules, '', '### Voice reference', 'Here is a sample of how this avatar speaks. Match its rhythm, vocabulary, and attitude:', '', seed].join('\n');
}

export function composeAvatarPrompt(basePersonaPrompt: string, persona: AvatarPersona, voiceSeed?: string): string {
  return [basePersonaPrompt.trim(), '', buildAvatarSystemPrompt(persona, voiceSeed)].join('\n');
}
