/**
 * services/verificationState.ts
 *
 * Typed verification state machine for Se'kret Bip.
 *
 * Replaces all `verified = true` boolean checks across the codebase.
 * State transitions are explicit and documented.
 *
 * USAGE:
 *   import { transitionVerification, getVerificationLabel } from '@/services/verificationState';
 *   const next = transitionVerification(current, 'parent_confirmed');
 *
 * Route guards in app/(teen)/_layout.tsx and app/(parent)/_layout.tsx
 * should read VerificationState from AccountIdentity context — not
 * re-derive it from local screen state.
 */

import type {
  VerificationState,
  VerificationTransitionTrigger,
  LimitedModeAccess,
} from '../types/verification';

// ─── Transition table ────────────────────────────────────────────────────

/**
 * VALID_TRANSITIONS
 * Explicit from→to map keyed by trigger.
 * Any transition not listed here is invalid and will throw.
 */
const VALID_TRANSITIONS: Partial<
  Record<VerificationTransitionTrigger, Partial<Record<VerificationState, VerificationState>>>
> = {
  account_created: {
    // Only valid for brand-new accounts; any other state is a bug
  },
  parent_invite_sent: {
    unverified: 'pending_parent',
    expired: 'pending_parent',
  },
  trusted_adult_invite_sent: {
    unverified: 'pending_trusted_adult',
    expired: 'pending_trusted_adult',
  },
  invite_acknowledged: {
    pending_parent: 'limited_mode',
    pending_trusted_adult: 'limited_mode',
  },
  parent_confirmed: {
    limited_mode: 'verified_teen',
    pending_parent: 'verified_teen',
  },
  trusted_adult_confirmed: {
    limited_mode: 'verified_teen',
    pending_trusted_adult: 'verified_teen',
  },
  verification_link_expired: {
    pending_parent: 'expired',
    pending_trusted_adult: 'expired',
    limited_mode: 'expired',
    verified_teen: 'expired',
  },
  safety_escalation: {
    verified_teen: 'manual_review',
    limited_mode: 'manual_review',
    unverified: 'manual_review',
  },
  moderation_determination: {
    manual_review: 'suspended',
  },
  support_review_opened: {
    suspended: 'manual_review',
  },
  manual_reinstatement: {
    manual_review: 'verified_teen',
    suspended: 'limited_mode',
  },
};

/**
 * transitionVerification
 * Returns the next VerificationState for a given trigger.
 * Throws if the transition is invalid (programming error, not user error).
 */
export function transitionVerification(
  current: VerificationState,
  trigger: VerificationTransitionTrigger,
): VerificationState {
  const fromMap = VALID_TRANSITIONS[trigger];
  if (!fromMap) {
    throw new Error(`[verificationState] Unknown trigger: ${trigger}`);
  }
  const next = fromMap[current];
  if (next === undefined) {
    throw new Error(
      `[verificationState] Invalid transition: ${current} + ${trigger}`,
    );
  }
  return next;
}

/**
 * isValidTransition
 * Non-throwing check for whether a transition is valid.
 * Use in UI guards before calling transitionVerification.
 */
export function isValidTransition(
  current: VerificationState,
  trigger: VerificationTransitionTrigger,
): boolean {
  const fromMap = VALID_TRANSITIONS[trigger];
  if (!fromMap) return false;
  return current in fromMap;
}

/**
 * getLimitedModeAccess
 * Returns the LimitedModeAccess config for limited-mode teens.
 * Screens should read from this rather than hardcoding access rules.
 */
export function getLimitedModeAccess(): LimitedModeAccess {
  return {
    journalAccess: true,
    roomAccess: true,
    companionAccess: true,
    calmAccess: true,
    publicCirclePosting: false,
    friendsCircle: false,
    crewAccess: false,
    peopleSearch: false,
    directMessaging: false,
  };
}

/**
 * getVerificationLabel
 * Returns a human-readable label for a verification state.
 * Used in onboarding, profile, and limited-mode screens.
 */
export function getVerificationLabel(state: VerificationState): string {
  const labels: Record<VerificationState, string> = {
    unverified: 'Not yet verified',
    pending_parent: 'Waiting for parent to confirm',
    pending_trusted_adult: 'Waiting for trusted adult to confirm',
    limited_mode: 'Limited access — verification in progress',
    verified_teen: 'Verified',
    expired: 'Verification expired — please re-invite',
    manual_review: 'Account under review',
    suspended: 'Account suspended',
  };
  return labels[state];
}

/**
 * shouldShowLimitedModeBanner
 * Returns true when the limited-mode banner should be shown in the teen home.
 */
export function shouldShowLimitedModeBanner(state: VerificationState): boolean {
  return (
    state === 'unverified' ||
    state === 'limited_mode' ||
    state === 'pending_parent' ||
    state === 'pending_trusted_adult' ||
    state === 'expired'
  );
}
