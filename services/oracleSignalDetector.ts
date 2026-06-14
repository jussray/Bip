// ─────────────────────────────────────────────────────────────────────────────
// Oracle Signal Detector — Phase 1B
// Analyzes a completed conversation and extracts:
//   - HumanUnderstanding updates (what Oracle now believes about this person)
//   - SelfTrustEvidence (specific moments of self-trust observed)
// Called after a session ends. Never called mid-conversation.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  HumanUnderstanding,
  HumanUnderstandingDimension,
  SelfTrustEvidence,
  SelfTrustEvidenceType,
  SekretName,
} from '../types/oracleMemory';

export interface ConversationMessage {
  role: 'user' | 'sekret';
  text: string;
  timestamp: string;
}

export interface ConversationSummary {
  sekret: SekretName;
  messages: ConversationMessage[];
  mood?: string;
  sessionDurationMs?: number;
}

export interface DetectionResult {
  understandings: HumanUnderstanding[];
  evidence: Omit<SelfTrustEvidence, 'id' | 'observedAt'>[];
}

// ── Self-trust signal rules ───────────────────────────────────────────────────

interface SignalRule {
  type: SelfTrustEvidenceType;
  test: (text: string) => boolean;
  note: (text: string) => string;
}

const SIGNAL_RULES: SignalRule[] = [
  {
    type: 'named-a-feeling',
    test: (t) =>
      /\b(scared|anxious|embarrassed|proud|frustrated|overwhelmed|relieved|guilty|hopeful|lonely|angry|sad|excited|grateful|ashamed|confused|peaceful|numb)\b/i.test(t),
    note: () => 'Named a specific feeling accurately.',
  },
  {
    type: 'set-a-boundary',
    test: (t) =>
      /\b(said no|told them no|set a limit|stopped letting|not doing that|that\'s my boundary|won\'t let|don\'t allow)\b/i.test(t),
    note: () => 'Described setting or enforcing a boundary.',
  },
  {
    type: 'asked-for-help',
    test: (t) =>
      /\b(asked for help|reached out|talked to|opened up|told someone|went to|texted|called)\b/i.test(t),
    note: () => 'Reached out instead of isolating.',
  },
  {
    type: 'completed-goal',
    test: (t) =>
      /\b(finished|completed|did it|got it done|turned it in|showed up|went through with|followed through|actually did)\b/i.test(t),
    note: () => 'Reported completing something they set out to do.',
  },
  {
    type: 'self-corrected',
    test: (t) =>
      /\b(caught myself|realized I was|stopped myself|changed my mind|decided not to|that was wrong and I|took it back)\b/i.test(t),
    note: () => 'Caught themselves and changed course.',
  },
  {
    type: 'reframed-setback',
    test: (t) =>
      /\b(learned from|taught me|made me stronger|silver lining|at least|good thing that happened|glad it happened|look at it differently)\b/i.test(t),
    note: () => 'Found meaning or learning in a hard moment.',
  },
  {
    type: 'expressed-opinion',
    test: (t) =>
      /\b(I think|I believe|I feel like|in my opinion|I want|I don\'t want|I actually|personally I|my take is)\b/i.test(t),
    note: () => 'Stated what they actually think or want.',
  },
  {
    type: 'resisted-pressure',
    test: (t) =>
      /\b(didn\'t go along|said no to them|didn\'t do it just because|held my ground|stayed true|didn\'t cave|they wanted me to but)\b/i.test(t),
    note: () => 'Described not going along with something.',
  },
  {
    type: 'showed-self-compassion',
    test: (t) =>
      /\b(gave myself grace|not too hard on myself|it\'s okay I|forgave myself|mistakes happen|I tried my best|being kind to myself)\b/i.test(t),
    note: () => 'Was kind to themselves after a mistake.',
  },
  {
    type: 'initiated-change',
    test: (t) =>
      /\b(decided to start|made myself|on my own I|without being asked|took the first step|decided to change|started doing)\b/i.test(t),
    note: () => 'Started something without being pushed.',
  },
  {
    type: 'identified-pattern',
    test: (t) =>
      /\b(I always|I keep|I notice I|every time I|I tend to|pattern in me|I do this when|I realized I always)\b/i.test(t),
    note: () => 'Noticed a recurring pattern in their own behavior.',
  },
  {
    type: 'named-a-strength',
    test: (t) =>
      /\b(I\'m good at|I\'m actually|I can do|one thing I|I\'m proud that|I know I can|I\'ve always been able to)\b/i.test(t),
    note: () => 'Acknowledged something they are genuinely good at.',
  },
  {
    type: 'sat-with-discomfort',
    test: (t) =>
      /\b(stayed with it|didn\'t run|sat with|didn\'t avoid|let myself feel|didn\'t distract|stayed present|felt it anyway)\b/i.test(t),
    note: () => 'Stayed present with something hard instead of escaping.',
  },
];

// ── Understanding inference ───────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function inferUnderstandings(
  userMessages: string[],
  sekret: SekretName,
): HumanUnderstanding[] {
  const combined = userMessages.join(' ').toLowerCase();
  const understandings: HumanUnderstanding[] = [];

  const add = (
    dimension: HumanUnderstandingDimension,
    theory: string,
    confidence: HumanUnderstanding['confidence'] = 'forming',
  ) => {
    understandings.push({ dimension, theory, confidence, updatedAt: now(), sekretSource: sekret });
  };

  // Emotional pattern
  if (/\b(always feel|keep feeling|every time|I feel like I always)\b/.test(combined)) {
    add('emotional-pattern', 'Shows recurring emotional themes across conversations.');
  }

  // Communication style
  if (userMessages.some((m) => m.length > 200)) {
    add('communication-style', 'Processes through writing — tends to share in depth when ready.');
  } else if (userMessages.filter((m) => m.length < 30).length > userMessages.length * 0.6) {
    add('communication-style', 'Communicates in brief bursts — short messages, high emotional density.');
  }

  // Motivation source
  if (/\b(want to prove|show them|for myself|I decided|my goal|I set out)\b/.test(combined)) {
    add('motivation-source', 'Internally motivated — moves when the goal feels personally meaningful.');
  }

  // Avoidance pattern
  if (/\b(don\'t want to think|avoiding|not ready|can\'t deal|too much right now|not going there)\b/.test(combined)) {
    add('avoidance-pattern', 'Has specific areas they pull back from when pressure increases.');
  }

  // Resilience indicator
  if (/\b(got through|survived|still here|made it|came back|kept going|pushed through)\b/.test(combined)) {
    add('resilience-indicator', 'Has demonstrated recovery — references getting through hard things.');
  }

  // Support system
  if (/\b(my mom|my friend|talked to|they helped|my sister|my brother|someone I trust)\b/.test(combined)) {
    add('support-system', 'Has at least one person they reference as a source of support.');
  }

  return understandings;
}

// ── Main analyzer ─────────────────────────────────────────────────────────────

/**
 * Analyze a completed conversation and extract Oracle signal.
 * Call this after a session ends, not during.
 */
export function analyzeConversation(summary: ConversationSummary): DetectionResult {
  const userMessages = summary.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text);

  if (!userMessages.length) {
    return { understandings: [], evidence: [] };
  }

  // Detect self-trust evidence from user messages
  const evidence: Omit<SelfTrustEvidence, 'id' | 'observedAt'>[] = [];
  for (const message of userMessages) {
    for (const rule of SIGNAL_RULES) {
      if (rule.test(message)) {
        evidence.push({
          type: rule.type,
          sekretWitness: summary.sekret,
          note: rule.note(message),
        });
        break; // one signal per message max
      }
    }
  }

  // Infer understandings from the full user conversation
  const understandings = inferUnderstandings(userMessages, summary.sekret);

  return { understandings, evidence };
}

/**
 * Convenience: analyze and immediately apply to an existing profile.
 * Returns the DetectionResult for caller to decide whether to save.
 */
export function extractInsights(summary: ConversationSummary): DetectionResult {
  return analyzeConversation(summary);
}
