import type {
  ParentLinkState,
  VerificationEvent,
  VerificationSnapshot,
  VerificationState,
} from '@/types/verification';

export interface VerificationTransitionResult {
  previous: VerificationSnapshot;
  current: VerificationSnapshot;
  changed: boolean;
}

type Transition = {
  to: VerificationState;
  parentLinkState?: ParentLinkState;
};

const TRANSITIONS: Partial<
  Record<VerificationState, Partial<Record<VerificationEvent, Transition>>>
> = {
  UNVERIFIED: {
    SUBMIT_SIGNUP: { to: 'PENDING_PARENT', parentLinkState: 'pending' },
    START_PARENT_LINK: { to: 'PENDING_PARENT', parentLinkState: 'pending' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  PENDING_PARENT: {
    PARENT_APPROVED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    VERIFICATION_CONFIRMED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    PARENT_TIMEOUT: { to: 'PENDING_TRUSTED_ADULT', parentLinkState: 'pending' },
    START_TRUSTED_ADULT_LINK: {
      to: 'PENDING_TRUSTED_ADULT',
      parentLinkState: 'pending',
    },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  PENDING_TRUSTED_ADULT: {
    TRUSTED_ADULT_APPROVED: { to: 'LIMITED_MODE', parentLinkState: 'pending' },
    PARENT_APPROVED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    VERIFICATION_CONFIRMED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  LIMITED_MODE: {
    PARENT_LATE_APPROVED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    PARENT_APPROVED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    VERIFICATION_CONFIRMED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    SAFETY_FLAG_TRIGGERED: { to: 'MANUAL_REVIEW' },
    SAFETY_REVIEW_OPENED: { to: 'MANUAL_REVIEW' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  VERIFIED_TEEN: {
    TOKEN_EXPIRED: { to: 'EXPIRED', parentLinkState: 'expired' },
    VERIFICATION_EXPIRED: { to: 'EXPIRED', parentLinkState: 'expired' },
    SAFETY_FLAG_TRIGGERED: { to: 'MANUAL_REVIEW' },
    SAFETY_REVIEW_OPENED: { to: 'MANUAL_REVIEW' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  EXPIRED: {
    REVERIFY: { to: 'PENDING_PARENT', parentLinkState: 'pending' },
    START_PARENT_LINK: { to: 'PENDING_PARENT', parentLinkState: 'pending' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  MANUAL_REVIEW: {
    ADMIN_RESTORED: { to: 'VERIFIED_TEEN', parentLinkState: 'active' },
    ADMIN_SUSPENDED: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    EMERGENCY_SHUTOFF: { to: 'SUSPENDED', parentLinkState: 'revoked' },
    SUSPEND_ACCOUNT: { to: 'SUSPENDED', parentLinkState: 'revoked' },
  },
  SUSPENDED: {
    APPEAL_OPENED: { to: 'MANUAL_REVIEW' },
    RESET: { to: 'UNVERIFIED', parentLinkState: 'none' },
  },
};

export const canTransitionVerification = (
  state: VerificationState,
  event: VerificationEvent,
): boolean => Boolean(TRANSITIONS[state]?.[event]);

export const transitionVerification = (
  snapshot: VerificationSnapshot,
  event: VerificationEvent,
  options?: { now?: string; reason?: string },
): VerificationTransitionResult => {
  const transition = TRANSITIONS[snapshot.state]?.[event];

  if (!transition) {
    return {
      previous: snapshot,
      current: snapshot,
      changed: false,
    };
  }

  const current: VerificationSnapshot = {
    state: transition.to,
    parentLinkState: transition.parentLinkState ?? snapshot.parentLinkState,
    updatedAt: options?.now ?? new Date().toISOString(),
    reason: options?.reason,
  };

  return {
    previous: snapshot,
    current,
    changed: true,
  };
};

export const createInitialVerificationSnapshot = (
  now = new Date().toISOString(),
): VerificationSnapshot => ({
  state: 'UNVERIFIED',
  parentLinkState: 'none',
  updatedAt: now,
});
