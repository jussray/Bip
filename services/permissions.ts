/**
 * services/permissions.ts
 *
 * Permission helpers for Se'kret Bip.
 *
 * All social feature gates, circle access rules, and parent visibility
 * checks are derived from these helpers — not from scattered booleans
 * or screen-level conditionals.
 *
 * USAGE:
 *   import { isTeenVerified, canPostToCircle } from '@/services/permissions';
 *   if (!canPostToCircle(account, 'public')) return <LockedState />;
 *
 * PRIVACY GUARANTEE:
 *   canParentViewEvent() always returns false for PRIVATE_MEMORY_TYPES.
 *   redactParentPayload() strips any private content before parent surfaces.
 *   No helper in this file widens parent access beyond safety/verification events.
 */

import type { AccountIdentity, CircleType, MemoryType } from '../types/identity';
import { PRIVATE_MEMORY_TYPES } from '../types/identity';
import type { VerificationState } from '../types/verification';
import type { DoorbellEventType } from '../types/doorbell';

// ─── Verification helpers ─────────────────────────────────────────────────

/**
 * isTeenVerified
 * Returns true only when the teen has completed full verification.
 * Does NOT return true for limited_mode — that is a distinct, lesser state.
 */
export function isTeenVerified(state: VerificationState): boolean {
  return state === 'verified_teen';
}

/**
 * isLimitedMode
 * Returns true when the teen is in the limited/pending states.
 * Use this to show limited-mode UI rather than fully locked UI.
 */
export function isLimitedMode(state: VerificationState): boolean {
  return (
    state === 'limited_mode' ||
    state === 'pending_parent' ||
    state === 'pending_trusted_adult'
  );
}

/**
 * isAccountSuspended
 * Returns true when the account is suspended or under manual review.
 */
export function isAccountSuspended(state: VerificationState): boolean {
  return state === 'suspended' || state === 'manual_review';
}

// ─── Social access helpers ────────────────────────────────────────────────

/**
 * canAccessCircle
 * Whether the teen can read/interact with a given circle type.
 *
 * Parent circle access is always permitted (for posting shared content).
 * Public, friends, crew require verified_teen.
 */
export function canAccessCircle(
  account: Pick<AccountIdentity, 'verificationState'>,
  circle: CircleType,
): boolean {
  if (isAccountSuspended(account.verificationState)) return false;
  if (circle === 'parent') return true; // posting to parent circle is always allowed
  return isTeenVerified(account.verificationState);
}

/**
 * canAccessCrew
 * Crew requires verified status + a crew that exists.
 * Pass hasActiveCrew = true if the teen has accepted crew members.
 */
export function canAccessCrew(
  account: Pick<AccountIdentity, 'verificationState'>,
  hasActiveCrew: boolean,
): boolean {
  return isTeenVerified(account.verificationState) && hasActiveCrew;
}

/**
 * canSearchPeople
 * People search is disabled until verification.
 * Also always false if suspended.
 */
export function canSearchPeople(
  account: Pick<AccountIdentity, 'verificationState'>,
): boolean {
  return isTeenVerified(account.verificationState);
}

/**
 * canPostToCircle
 * Whether the teen can create a post in a given circle.
 * Parent circle posts are always permitted (sharing with trusted adult).
 */
export function canPostToCircle(
  account: Pick<AccountIdentity, 'verificationState'>,
  circle: CircleType,
): boolean {
  if (isAccountSuspended(account.verificationState)) return false;
  if (circle === 'parent') return true;
  return isTeenVerified(account.verificationState);
}

/**
 * canUsePrivateMessaging
 * Always returns false — Bip has no open DMs by product design.
 * This helper exists so that screens can use a single consistent check
 * rather than repeating inline comments.
 */
export function canUsePrivateMessaging(): false {
  // TODO: If Crew-gated private threads are ever considered in future,
  // this must go through a full privacy/safety review before being changed.
  return false;
}

// ─── Parent visibility helpers ────────────────────────────────────────────

/**
 * canParentViewEvent
 * Determines whether a given event type is permissible in a parent-facing surface.
 *
 * PRIVACY CONTRACT:
 * - Journal, Voice Bip, AI chat, and private memory events are NEVER parent-visible.
 * - Only safety/verification events from DoorbellEventType are permitted.
 */
export function canParentViewEvent(
  eventSource: MemoryType | DoorbellEventType | string,
): boolean {
  // Explicitly block all private memory types
  if ((PRIVATE_MEMORY_TYPES as readonly string[]).includes(eventSource)) {
    return false;
  }
  // Doorbell event types are the approved parent-visible taxonomy
  const PARENT_VISIBLE_EVENTS: DoorbellEventType[] = [
    'VERIFICATION_COMPLETED',
    'VERIFICATION_EXPIRED',
    'SAFETY_REPORT_FILED',
    'BLOCK_USED',
    'SUSPICIOUS_ACCOUNT_REMOVED',
    'EMERGENCY_ESCALATION',
    'TRUSTED_ADULT_CHANGED',
    'MANUAL_REVIEW_OPENED',
    'ACCOUNT_SUSPENDED',
    'PARENT_LINK_REMOVED',
  ];
  return (PARENT_VISIBLE_EVENTS as string[]).includes(eventSource);
}

/**
 * redactParentPayload
 * Strips any field that could contain private teen content from an arbitrary
 * event payload before it is stored or transmitted to a parent surface.
 *
 * Add field names here as new event types are introduced.
 */
export function redactParentPayload<T extends Record<string, unknown>>(
  payload: T,
): Partial<T> {
  const REDACTED_FIELDS = new Set([
    'journalText',
    'journalContent',
    'journalSnippet',
    'voiceTranscript',
    'voiceContent',
    'aiChatContent',
    'aiChatTranscript',
    'privateMemory',
    'privateNote',
    'privateNotes',
    'memorContent',
    'rawContent',
    'content',
    'text',
    'body',
    'transcript',
  ]);

  const safe: Partial<T> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!REDACTED_FIELDS.has(key)) {
      (safe as Record<string, unknown>)[key] = value;
    }
  }
  return safe;
}
