/**
 * services/doorbellEvents.ts
 *
 * Doorbell event factory and filtering for Se'kret Bip.
 *
 * SCREENS MUST NOT construct DoorbellEvents directly.
 * Always use createDoorbellEvent() so privacy redaction is guaranteed.
 *
 * PRIVACY GUARANTEE:
 * - createDoorbellEvent() calls redactParentPayload() on all payloads.
 * - No raw journal, voice, AI chat, or private memory content
 *   can reach a parent surface through this service.
 * - canParentViewEvent() is the single source of truth for parent visibility.
 */

import type {
  DoorbellEvent,
  DoorbellEventType,
  DoorbellSeverity,
  DoorbellRedactedPayload,
  DoorbellEventPreview,
} from '../types/doorbell';
import { redactParentPayload, canParentViewEvent } from './permissions';

// ─── Severity defaults ────────────────────────────────────────────────────

const DEFAULT_SEVERITY: Record<DoorbellEventType, DoorbellSeverity> = {
  VERIFICATION_COMPLETED: 'info',
  VERIFICATION_EXPIRED: 'watch',
  SAFETY_REPORT_FILED: 'watch',
  BLOCK_USED: 'info',
  SUSPICIOUS_ACCOUNT_REMOVED: 'watch',
  EMERGENCY_ESCALATION: 'urgent',
  TRUSTED_ADULT_CHANGED: 'watch',
  MANUAL_REVIEW_OPENED: 'urgent',
  ACCOUNT_SUSPENDED: 'urgent',
  PARENT_LINK_REMOVED: 'watch',
};

// ─── Default summaries ────────────────────────────────────────────────────

const DEFAULT_SUMMARY: Record<DoorbellEventType, string> = {
  VERIFICATION_COMPLETED: 'Your teen completed age verification.',
  VERIFICATION_EXPIRED: 'Your teen's verification has expired. They may need to re-invite you.',
  SAFETY_REPORT_FILED: 'Your teen used the safety report tool.',
  BLOCK_USED: 'Your teen blocked someone on Bip.',
  SUSPICIOUS_ACCOUNT_REMOVED: 'A suspicious account was removed from your teen's connections.',
  EMERGENCY_ESCALATION: 'Your teen triggered an emergency safety check-in.',
  TRUSTED_ADULT_CHANGED: 'Your teen updated their trusted adult connection.',
  MANUAL_REVIEW_OPENED: 'Your teen's account is under safety review.',
  ACCOUNT_SUSPENDED: 'Your teen's account has been suspended.',
  PARENT_LINK_REMOVED: 'The parent connection to your teen's account was removed.',
};

// ─── Recommended actions ─────────────────────────────────────────────────

const DEFAULT_ACTION: Partial<Record<DoorbellEventType, string>> = {
  VERIFICATION_EXPIRED: 'Ask your teen to resend a verification invite.',
  EMERGENCY_ESCALATION: 'Check in with your teen when they're ready.',
  MANUAL_REVIEW_OPENED: 'A Bip safety team member will be in touch.',
  PARENT_LINK_REMOVED: 'Your teen can re-invite you from their privacy settings.',
};

// ─── Factory ──────────────────────────────────────────────────────────────

/**
 * createDoorbellEvent
 * The only approved way to create a DoorbellEvent.
 * Always redacts the payload before returning the event record.
 *
 * @param teenAccountId  - The teen's account ID
 * @param parentAccountId - The parent/trusted adult's account ID
 * @param type           - Doorbell event type from the taxonomy
 * @param rawPayload     - Any contextual data — will be redacted automatically
 * @param overrides      - Optional overrides for summary/severity/action
 */
export function createDoorbellEvent(
  teenAccountId: string,
  parentAccountId: string,
  type: DoorbellEventType,
  rawPayload: Record<string, unknown> = {},
  overrides: {
    summary?: string;
    severity?: DoorbellSeverity;
    recommendedAction?: string;
  } = {},
): DoorbellEvent {
  // Guard: ensure this event type is allowed in parent surfaces
  if (!canParentViewEvent(type)) {
    throw new Error(
      `[doorbellEvents] Attempted to create a parent-visible event for blocked type: ${type}`,
    );
  }

  const redacted = redactParentPayload(rawPayload) as DoorbellRedactedPayload;

  return {
    eventId: generateEventId(),
    teenAccountId,
    parentAccountId,
    type,
    severity: overrides.severity ?? DEFAULT_SEVERITY[type],
    timestamp: new Date().toISOString(),
    summary: overrides.summary ?? DEFAULT_SUMMARY[type],
    recommendedAction: overrides.recommendedAction ?? DEFAULT_ACTION[type],
    acknowledged: false,
    redactedPayload: redacted,
  };
}

/**
 * createDoorbellEventPreview
 * Returns a minimal preview card for the Doorbell screen list view.
 */
export function createDoorbellEventPreview(
  event: DoorbellEvent,
): DoorbellEventPreview {
  return {
    eventId: event.eventId,
    type: event.type,
    severity: event.severity,
    summary: event.summary,
    timestamp: event.timestamp,
    acknowledged: event.acknowledged,
  };
}

/**
 * filterDoorbellEventsForParent
 * Filters an array of raw events to only those permitted in parent surfaces.
 * Use on any query result before rendering in a parent screen.
 */
export function filterDoorbellEventsForParent(
  events: DoorbellEvent[],
): DoorbellEvent[] {
  return events.filter((e) => canParentViewEvent(e.type));
}

// ─── Utility ──────────────────────────────────────────────────────────────

function generateEventId(): string {
  return `dbe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
