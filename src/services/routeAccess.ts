import type { VerificationState } from '@/types/verification';
import { canUnlockSocial, getVerificationRouteTarget } from './verificationState';

export type AppRouteArea =
  | '(auth)'
  | '(teen)'
  | '(parent)'
  | '(profile)'
  | '(safety)'
  | '(social)'
  | 'unknown';

export interface RouteAccessDecision {
  allowed: boolean;
  redirectTo?: string;
  reason?:
    | 'wrong_user_side'
    | 'verification_required'
    | 'manual_review'
    | 'suspended';
}

const routeAreaFromSegment = (segment?: string): AppRouteArea => {
  switch (segment) {
    case '(auth)':
    case '(teen)':
    case '(parent)':
    case '(profile)':
    case '(safety)':
    case '(social)':
      return segment;
    default:
      return 'unknown';
  }
};

/**
 * Central route policy for Bip.
 *
 * Safety routes are intentionally always reachable, including from
 * UNVERIFIED, LIMITED_MODE, MANUAL_REVIEW, and SUSPENDED states.
 */
export function decideRouteAccess(options: {
  firstSegment?: string;
  userSide: 'teen' | 'parent' | null;
  verificationState: VerificationState;
}): RouteAccessDecision {
  const area = routeAreaFromSegment(options.firstSegment);

  if (area === '(safety)' || area === '(auth)' || area === 'unknown') {
    return { allowed: true };
  }

  if (area === '(parent)') {
    return options.userSide === 'parent'
      ? { allowed: true }
      : {
          allowed: false,
          redirectTo: '/(teen)/room',
          reason: 'wrong_user_side',
        };
  }

  if (options.userSide === 'parent' && (area === '(teen)' || area === '(social)')) {
    return {
      allowed: false,
      redirectTo: '/(parent)/room',
      reason: 'wrong_user_side',
    };
  }

  if (options.verificationState === 'SUSPENDED') {
    return {
      allowed: false,
      redirectTo: '/(auth)/suspended',
      reason: 'suspended',
    };
  }

  if (options.verificationState === 'MANUAL_REVIEW') {
    return {
      allowed: false,
      redirectTo: '/(safety)/manual-review',
      reason: 'manual_review',
    };
  }

  if (area === '(social)' && !canUnlockSocial(options.verificationState)) {
    return {
      allowed: false,
      redirectTo: getVerificationRouteTarget(options.verificationState),
      reason: 'verification_required',
    };
  }

  return { allowed: true };
}
