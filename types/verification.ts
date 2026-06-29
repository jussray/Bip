/**
 * types/verification.ts
 *
 * Verification state machine types for Se'kret Bip.
 *
 * Replaces all `verified = true` booleans in the codebase.
 * Every social gate, onboarding branch, and safety restriction
 * is derived from VerificationState — not from scattered boolean flags.
 *
 * See services/verificationState.ts for transition logic.
 * See services/permissions.ts for permission helpers that consume these types.
 */

// ─── Verification state ───────────────────────────────────────────────────

/**
 * VerificationState
 *
 * UNVERIFIED          → Account created; no verification started.
 * PENDING_PARENT      → Teen sent invite to parent; awaiting parent confirmation.
 * PENDING_TRUSTED_ADULT → Teen used alternate trusted-adult path; awaiting confirmation.
 * LIMITED_MODE        → Invite sent and acknowledged; social features locked until full verify.
 * VERIFIED_TEEN       → Parent/trusted adult confirmed; social access unlocked.
 * EXPIRED             → Verification link aged out; reverts to limited mode access.
 * MANUAL_REVIEW       → Safety escalation triggered; circle access paused.
 * SUSPENDED           → Moderation determination; full product lock.
 */
export type VerificationState =
  | 'unverified'
  | 'pending_parent'
  | 'pending_trusted_adult'
  | 'limited_mode'
  | 'verified_teen'
  | 'expired'
  | 'manual_review'
  | 'suspended';

// ─── Parent link state ────────────────────────────────────────────────────

/**
 * ParentLinkState
 * Models the full relationship status between a teen and their trusted adult.
 * Not a boolean — supports pending, partial, expired, declined, and alternate paths.
 */
export type ParentLinkState =
  | 'none'                 // No guardian added
  | 'invite_sent'          // Code/link sent; waiting for adult to open
  | 'invite_accepted'      // Adult accepted; full verification pending
  | 'linked'               // Active verified link
  | 'invite_expired'       // Invite timed out; needs resend
  | 'invite_declined'      // Adult declined; teen notified
  | 'link_removed_by_teen' // Teen removed the connection
  | 'link_removed_by_adult'; // Adult removed the connection

// ─── Limited mode access ─────────────────────────────────────────────────

/**
 * LimitedModeAccess
 * Defines exactly which features are available while in limited mode.
 * Used by LimitedModeScreen and permission guards.
 *
 * Locked features remain locked regardless of in-app navigation.
 * Guards in app/(teen)/_layout.tsx enforce this at the route level.
 */
export interface LimitedModeAccess {
  /** Private journal access — always available */
  journalAccess: true;
  /** Room and themes — always available */
  roomAccess: true;
  /** AI companion — always available */
  companionAccess: true;
  /** Calm tools and check-ins — always available */
  calmAccess: true;
  /** Public circle posting — locked until verified */
  publicCirclePosting: false;
  /** Friends circle — locked until verified */
  friendsCircle: false;
  /** Crew features — locked until verified */
  crewAccess: false;
  /** People search/discovery — locked until verified */
  peopleSearch: false;
  /** Any direct-message-like feature — always locked (no open DMs in Bip) */
  directMessaging: false;
}

// ─── Transition trigger types ─────────────────────────────────────────────

/**
 * VerificationTransitionTrigger
 * Documents what event causes each state transition.
 * Consumed by services/verificationState.ts.
 */
export type VerificationTransitionTrigger =
  | 'account_created'
  | 'parent_invite_sent'
  | 'trusted_adult_invite_sent'
  | 'invite_acknowledged'
  | 'parent_confirmed'
  | 'trusted_adult_confirmed'
  | 'verification_link_expired'
  | 'safety_escalation'
  | 'moderation_determination'
  | 'support_review_opened'
  | 'manual_reinstatement';
