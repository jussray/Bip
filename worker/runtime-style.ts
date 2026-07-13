import type { NamedCompanionId } from '../src/features/sekret/identityContract';
import {
  buildCompanionStyleRequest,
  buildSekretPresenceStyleRequest,
  type StyledReplyRequest,
} from '../src/features/sekret/companionStyleEngine';
import { isNamedCompanionId } from '../src/features/sekret/styleProfiles';

export type ReplyActorId = NamedCompanionId | 'sekret' | 'parentCoach';
export type ReplySurface =
  | 'journal'
  | 'voiceBip'
  | 'comfort'
  | 'circle'
  | 'parentBridge'
  | 'selfDiscovery'
  | 'parentCoach';

export type RuntimeActorRole = StyledReplyRequest['role'] | 'parent-coach';

export interface RuntimeStyleContract {
  actorId: ReplyActorId;
  role: RuntimeActorRole;
  textStyleVersion: string;
  speechStyleVersion: string;
  systemPromptAddendum: string;
  speechInstructions: string;
  maxQuestions: number;
  forbiddenPhrases: readonly string[];
}

export interface StyledResponseMetadata {
  actorId: ReplyActorId;
  actorRole: RuntimeActorRole;
  textStyleVersion: string;
  speechStyleVersion: string;
  questionBudget: number;
  styleEnforced: true;
  styleRepaired: boolean;
  styleViolationCodes: string[];
}

const PARENT_COACH_STYLE: RuntimeStyleContract = Object.freeze({
  actorId: 'parentCoach',
  role: 'parent-coach',
  textStyleVersion: 'parent-coach-text-v1',
  speechStyleVersion: 'parent-coach-speech-v1',
  systemPromptAddendum:
    'Speak to the parent as Se’kret Coach: grounded, warm, concise, never clinical, never teen-coded, and never positioned against the teen. Offer at most one useful question.',
  speechInstructions:
    'Warm, grounded parent-coach delivery. Calm, real, and quietly knowing. Never sound like a wellness app, lecturer, teenager, or clinical narrator.',
  maxQuestions: 1,
  forbiddenPhrases: Object.freeze([
    'As an AI language model',
    "That's a great question",
    'How can I assist you today',
    'I understand your concern',
    'Oracle',
  ]),
});

const FORBIDDEN_REPLACEMENTS: readonly (readonly [RegExp, string])[] = [
  [/\bas an ai language model\b/gi, ''],
  [/\bthat(?:’|'| i)s a great question\b/gi, ''],
  [/\bhow can i assist you today\b/gi, 'Tell me what is happening today'],
  [/\bi understand your concern\b/gi, 'That matters'],
  [/\bi remember when you told me\b/gi, 'Something in this conversation stands out'],
  [/\boracle\b/gi, "Se'kret"],
] as const;

export function normalizeReplyActor(value: unknown): ReplyActorId | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toLowerCase().replace(/[’']/g, '').replace(/[\s_-]+/g, '');

  if (raw === 'raylene' || raw === 'soft' || raw === 'star') return 'raylene';
  if (raw === 'rylane' || raw === 'bro') return 'rylane';
  if (raw === 'cloud' || raw === 'cloudsekret') return 'cloud';
  if (raw === 'night' || raw === 'nightsekret') return 'night';
  if (raw === 'sekret' || raw === 'secret' || raw === 'oracle') return 'sekret';
  if (raw === 'parentcoach' || raw === 'sekretcoach') return 'parentCoach';
  return null;
}

export function normalizeReplySurface(value: unknown): ReplySurface {
  if (value === 'voiceBip' || value === 'comfort' || value === 'circle' || value === 'parentBridge') return value;
  if (value === 'selfDiscovery' || value === 'parentCoach' || value === 'journal') return value;
  if (value === 'pages' || value === 'chat' || value === 'home') return 'journal';
  return 'journal';
}

export function validateActorSurface(actorId: ReplyActorId, surface: ReplySurface): string | null {
  if (actorId === 'parentCoach' && surface !== 'parentCoach') {
    return 'parentCoach actor requires the parentCoach surface';
  }
  if (actorId !== 'parentCoach' && surface === 'parentCoach') {
    return 'parentCoach surface requires the parentCoach actor';
  }
  return null;
}

export function resolveRuntimeStyle(actorId: ReplyActorId): RuntimeStyleContract {
  if (actorId === 'parentCoach') return PARENT_COACH_STYLE;

  const request = isNamedCompanionId(actorId)
    ? buildCompanionStyleRequest(actorId)
    : buildSekretPresenceStyleRequest();

  return Object.freeze({
    actorId,
    role: request.role,
    textStyleVersion: request.textStyleVersion,
    speechStyleVersion: request.speechStyleVersion,
    systemPromptAddendum: request.systemPromptAddendum,
    speechInstructions: request.speechInstructions,
    maxQuestions: request.constraints.maxQuestions,
    forbiddenPhrases: request.constraints.forbiddenPhrases,
  });
}

export function buildRuntimeStyleInstruction(style: RuntimeStyleContract): string {
  const questionRule = style.maxQuestions === 0
    ? 'Ask no direct questions. A sentence that invites reflection must still be declarative, not phrased as a question.'
    : `Ask no more than ${style.maxQuestions} direct question${style.maxQuestions === 1 ? '' : 's'}.`;
  const forbidden = style.forbiddenPhrases.length
    ? style.forbiddenPhrases.map((phrase) => `- ${phrase}`).join('\n')
    : '- none';

  return [
    'AUTHORITATIVE RUNTIME STYLE CONTRACT',
    'This section is generated from the versioned product contract and overrides any conflicting legacy prompt or few-shot example.',
    `Actor: ${style.actorId}`,
    `Role: ${style.role}`,
    `Text style version: ${style.textStyleVersion}`,
    `Speech style version: ${style.speechStyleVersion}`,
    questionRule,
    style.systemPromptAddendum,
    'Forbidden user-facing phrases:',
    forbidden,
    style.actorId === 'sekret'
      ? "Se'kret is a continuity presence, not a selectable companion. Never name Oracle, imitate a named companion, or claim memory that was not provided in this request."
      : '',
  ].filter(Boolean).join('\n');
}

function enforceQuestionBudget(text: string, maxQuestions: number): { text: string; repaired: boolean } {
  let count = 0;
  let repaired = false;
  const next = text.replace(/\?/g, () => {
    count += 1;
    if (count <= maxQuestions) return '?';
    repaired = true;
    return '.';
  });
  return { text: next, repaired };
}

function enforceForbiddenPhrases(text: string, forbiddenPhrases: readonly string[]): {
  text: string;
  repaired: boolean;
  oracleLeak: boolean;
} {
  const lower = text.toLowerCase();
  const hasForbidden = forbiddenPhrases.some((phrase) => lower.includes(phrase.toLowerCase()));
  const oracleLeak = /\boracle\b/i.test(text);
  if (!hasForbidden && !oracleLeak) return { text, repaired: false, oracleLeak: false };

  let next = text;
  for (const [pattern, replacement] of FORBIDDEN_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  next = next
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!]){2,}/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    text: next || "I'm here.",
    repaired: next !== text,
    oracleLeak,
  };
}

export function enforceRuntimeStyleResponse(
  data: Record<string, unknown>,
  style: RuntimeStyleContract,
): Record<string, unknown> & StyledResponseMetadata {
  const styleViolationCodes: string[] = [];
  let styleRepaired = false;

  if (typeof data.reply === 'string') {
    const forbidden = enforceForbiddenPhrases(data.reply.trim(), style.forbiddenPhrases);
    if (forbidden.repaired) {
      styleViolationCodes.push(forbidden.oracleLeak ? 'style_oracle_leak' : 'style_forbidden_phrase');
      styleRepaired = true;
    }

    const questions = enforceQuestionBudget(forbidden.text, style.maxQuestions);
    if (questions.repaired) {
      styleViolationCodes.push('style_question_budget');
      styleRepaired = true;
    }
    data.reply = questions.text;
  }

  return {
    ...data,
    actorId: style.actorId,
    actorRole: style.role,
    textStyleVersion: style.textStyleVersion,
    speechStyleVersion: style.speechStyleVersion,
    questionBudget: style.maxQuestions,
    styleEnforced: true,
    styleRepaired,
    styleViolationCodes,
  };
}

export function isNamedRuntimeCompanion(actorId: ReplyActorId): actorId is NamedCompanionId {
  return isNamedCompanionId(actorId);
}
