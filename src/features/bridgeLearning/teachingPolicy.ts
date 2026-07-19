import type {
  BridgeLearningState,
  BridgeLearningTeachingState,
  ExplanationDepth,
  PreferredExampleStyle,
} from './types';

export const DEFAULT_EXPLANATION_DEPTH: ExplanationDepth = 'plain';

export const USER_FACING_SIMPLIFY_ACTIONS = Object.freeze({
  explainAnotherWay: 'Explain that another way',
  breakItDown: 'Break it down more',
  showExample: 'Show me an example',
  whyItWorks: 'Why does that work?',
  readyForNext: 'I understand — next step',
  letMeTry: 'Let me try',
  teachTogether: 'Teach us together',
});

const DEPTH_ORDER: readonly ExplanationDepth[] = ['concrete', 'plain', 'guided', 'academic'];

export function createTeachingState(
  preferredExampleStyle: PreferredExampleStyle = 'real_life',
): BridgeLearningTeachingState {
  return {
    explanationDepth: DEFAULT_EXPLANATION_DEPTH,
    conceptUnderstood: false,
    missingConcept: null,
    preferredExampleStyle,
    explanationAttempts: 0,
    lastStrategyKey: null,
  };
}

export function simplifyDepth(current: ExplanationDepth): ExplanationDepth {
  const index = DEPTH_ORDER.indexOf(current);
  if (index <= 0) return 'concrete';
  return DEPTH_ORDER[index - 1];
}

export function deepenDepth(current: ExplanationDepth): ExplanationDepth {
  const index = DEPTH_ORDER.indexOf(current);
  if (index < 0 || index >= DEPTH_ORDER.length - 1) return 'academic';
  return DEPTH_ORDER[index + 1];
}

export function adaptAfterUnderstandingCheck(
  current: BridgeLearningTeachingState,
  result: { conceptUnderstood: boolean; missingConcept?: string | null; strategyKey?: string | null },
): BridgeLearningTeachingState {
  if (result.conceptUnderstood) {
    return {
      ...current,
      conceptUnderstood: true,
      missingConcept: null,
      explanationDepth: deepenDepth(current.explanationDepth),
      lastStrategyKey: result.strategyKey ?? current.lastStrategyKey,
    };
  }

  return {
    ...current,
    conceptUnderstood: false,
    missingConcept: result.missingConcept ?? current.missingConcept,
    explanationDepth: simplifyDepth(current.explanationDepth),
    explanationAttempts: current.explanationAttempts + 1,
    lastStrategyKey: result.strategyKey ?? current.lastStrategyKey,
  };
}

export function shouldChangeTeachingStrategy(
  previousStrategyKey: string | null,
  proposedStrategyKey: string,
): boolean {
  return previousStrategyKey !== proposedStrategyKey;
}

export function deriveStumpedState(input: {
  teenStumped: boolean;
  parentStumped: boolean;
  sekretTeaching: boolean;
}): BridgeLearningState {
  if (input.sekretTeaching) return 'sekret_teaching';
  if (input.teenStumped && input.parentStumped) return 'both_stumped';
  if (input.teenStumped) return 'teen_stumped';
  if (input.parentStumped) return 'parent_stumped';
  return 'working_together';
}

export function maySuggestPing(input: {
  sessionState: BridgeLearningState;
  hasActiveParentLink: boolean;
  recipientAlreadyPresent: boolean;
}): boolean {
  if (!input.hasActiveParentLink || input.recipientAlreadyPresent) return false;
  return input.sessionState === 'teen_stumped' || input.sessionState === 'parent_stumped';
}

export function mayInviteSekret(sessionState: BridgeLearningState): boolean {
  return [
    'working_together',
    'teen_stumped',
    'parent_stumped',
    'both_stumped',
    'trying_again',
  ].includes(sessionState);
}

export function lockScreenNotificationCopy(senderRole: 'teen' | 'parent'): string {
  return senderRole === 'teen'
    ? 'Your teen asked you to join them in Learning Bridge.'
    : 'Your parent asked you to join them in Learning Bridge.';
}

/**
 * This wording contract intentionally avoids exposing subject, question, grade,
 * answer, source document, or mistake on the device lock screen.
 */
export function isPrivateNotificationCopy(copy: string): boolean {
  const forbidden = [
    'grade',
    'failed',
    'wrong answer',
    'homework',
    'worksheet',
    'test score',
    'journal',
  ];
  const normalized = copy.toLowerCase();
  return forbidden.every(term => !normalized.includes(term));
}
