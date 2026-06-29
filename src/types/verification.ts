export type VerificationState =
  | 'UNVERIFIED'
  | 'PENDING_PARENT'
  | 'PENDING_TRUSTED_ADULT'
  | 'LIMITED_MODE'
  | 'VERIFIED_TEEN'
  | 'EXPIRED'
  | 'MANUAL_REVIEW'
  | 'SUSPENDED';

export type ParentLinkState =
  | 'none'
  | 'pending'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'declined';

export type VerificationEvent =
  | 'SUBMIT_SIGNUP'
  | 'PARENT_APPROVED'
  | 'PARENT_TIMEOUT'
  | 'TRUSTED_ADULT_APPROVED'
  | 'PARENT_LATE_APPROVED'
  | 'TOKEN_EXPIRED'
  | 'REVERIFY'
  | 'SAFETY_FLAG_TRIGGERED'
  | 'ADMIN_RESTORED'
  | 'ADMIN_SUSPENDED'
  | 'EMERGENCY_SHUTOFF'
  | 'START_PARENT_LINK'
  | 'START_TRUSTED_ADULT_LINK'
  | 'INVITE_SENT'
  | 'VERIFICATION_CONFIRMED'
  | 'VERIFICATION_EXPIRED'
  | 'SAFETY_REVIEW_OPENED'
  | 'SUSPEND_ACCOUNT'
  | 'APPEAL_OPENED'
  | 'RESET';

export interface VerificationSnapshot {
  state: VerificationState;
  parentLinkState: ParentLinkState;
  updatedAt: string;
  reason?: string;
}
