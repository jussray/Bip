import type {
  ParentLinkState,
  VerificationEvent,
  VerificationSnapshot,
  VerificationState,
} from '@/types/verification';

export type VerificationRouteTarget =
  | '/(auth)/welcome'
  | '/(auth)/parent-link-verify'
  | '/(auth)/limited-mode'
  | '/(teen)/home'
  | '/(safety)/manual-review'
  | '/(auth)/suspended';

export const INITIAL_VERIFICATION_SNAPSHOT: VerificationSnapshot = {
  state: 'UNVERIFIED',
  parentLinkState: 'none',
  updatedAt: new Date(0).toISOString(),
};

const transitionTable: Record<VerificationState, Partial<Record<VerificationEvent, VerificationState>>> = {
  UNVERIFIED: {
    START_PARENT_LINK: 'PENDING_PARENT',
    START_TRUSTED_ADULT_LINK: 'PENDING_TRUSTED_ADULT',
    RESET: 'UNVERIFIED',
  },
  PENDING_PARENT: {
    INVITE_SENT: 'LIMITED_MODE',
    VERIFICATION_CONFIRMED: 'VERIFIED_TEEN',
    RESET: 'UNVERIFIED',
  },
  PENDING_TRUSTED_ADULT: {
    INVITE_SENT: 'LIMITED_MODE',
    VERIFICATION_CONFIRMED: 'VERIFIED_TEEN',
    RESET: 'UNVERIFIED',
  },
  LIMITED_MODE: {
    VERIFICATION_CONFIRMED: 'VERIFIED_TEEN',
    VERIFICATION_EXPIRED: 'EXPIRED',
    SAFETY_REVIEW_OPENED: 'MANUAL_REVIEW',
    SUSPEND_ACCOUNT: 'SUSPENDED',
    RESET: 'UNVERIFIED',
  },
  VERIFIED_TEEN: {
    VERIFICATION_EXPIRED: 'EXPIRED',
    SAFETY_REVIEW_OPENED: 'MANUAL_REVIEW',
    SUSPEND_ACCOUNT: 'SUSPENDED',
    RESET: 'UNVERIFIED',
  },
  EXPIRED: {
    START_PARENT_LINK: 'PENDING_PARENT',
    START_TRUSTED_ADULT_LINK: 'PENDING_TRUSTED_ADULT',
    SAFETY_REVIEW_OPENED: 'MANUAL_REVIEW',
    SUSPEND_ACCOUNT: 'SUSPENDED',
    RESET: 'UNVERIFIED',
  },
  MANUAL_REVIEW: {
    VERIFICATION_CONFIRMED: 'VERIFIED_TEEN',
    SUSPEND_ACCOUNT: 'SUSPENDED',
    RESET: 'UNVERIFIED',
  },
  SUSPENDED: {
    APPEAL_OPENED: 'MANUAL_REVIEW',
    RESET: 'UNVERIFIED',
  },
};

function nextParentLinkState(event: VerificationEvent, current: ParentLinkState): ParentLinkState {
  switch (event) {
    case 'START_PARENT_LINK':
    case 'START_TRUSTED_ADULT_LINK':
    case 'INVITE_SENT':
      return 'pending';
    case 'VERIFICATION_CONFIRMED':
      return 'active';
    case 'VERIFICATION_EXPIRED':
      return 'expired';
    case 'RESET':
      return 'none';
    default:
      return current;
  }
}

export function transitionVerificationState(
  snapshot: VerificationSnapshot,
  event: VerificationEvent,
  now = new Date().toISOString(),
): VerificationSnapshot {
  const nextState = transitionTable[snapshot.state][event];
  if (!nextState) return snapshot;

  return {
    ...snapshot,
    state: nextState,
    parentLinkState: nextParentLinkState(event, snapshot.parentLinkState),
    updatedAt: now,
  };
}

export function isTeenVerified(state: VerificationState): boolean {
  return state === 'VERIFIED_TEEN';
}

export function isLimitedMode(state: VerificationState): boolean {
  return state === 'UNVERIFIED'
    || state === 'PENDING_PARENT'
    || state === 'PENDING_TRUSTED_ADULT'
    || state === 'LIMITED_MODE'
    || state === 'EXPIRED';
}

export function canUnlockSocial(state: VerificationState): boolean {
  return state === 'VERIFIED_TEEN';
}

export function shouldShowLimitedMode(state: VerificationState): boolean {
  return isLimitedMode(state);
}

export function getVerificationRouteTarget(state: VerificationState): VerificationRouteTarget {
  switch (state) {
    case 'UNVERIFIED':
      return '/(auth)/welcome';
    case 'PENDING_PARENT':
    case 'PENDING_TRUSTED_ADULT':
      return '/(auth)/parent-link-verify';
    case 'LIMITED_MODE':
    case 'EXPIRED':
      return '/(auth)/limited-mode';
    case 'VERIFIED_TEEN':
      return '/(teen)/home';
    case 'MANUAL_REVIEW':
      return '/(safety)/manual-review';
    case 'SUSPENDED':
      return '/(auth)/suspended';
  }
}
