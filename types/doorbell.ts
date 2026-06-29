/**
 * types/doorbell.ts
 *
 * Doorbell event types for Se'kret Bip.
 *
 * The Doorbell is NOT a notification inbox — it is a typed safety-event log
 * that surfaces only to parents/trusted adults and only within defined
 * severity thresholds.
 *
 * CRITICAL PRIVACY RULES:
 * - DoorbellEvent payloads MUST NEVER contain:
 *   • raw journal text
 *   • Voice Bip transcripts
 *   • AI chat content
 *   • private memories
 *   • private notes
 * - summary must be human-readable plain language with no private content.
 * - Screens must NOT construct DoorbellEvents directly.
 *   Use services/doorbellEvents.ts createDoorbellEvent() instead.
 */

// ─── Event taxonomy ───────────────────────────────────────────────────────

/**
 * DoorbellEventType
 * The full taxonomy of events that may surface to parents.
 * Each type maps to a severity default in services/doorbellEvents.ts.
 */
export type DoorbellEventType =
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_EXPIRED'
  | 'SAFETY_REPORT_FILED'
  | 'BLOCK_USED'
  | 'SUSPICIOUS_ACCOUNT_REMOVED'
  | 'EMERGENCY_ESCALATION'
  | 'TRUSTED_ADULT_CHANGED'
  | 'MANUAL_REVIEW_OPENED'
  | 'ACCOUNT_SUSPENDED'
  | 'PARENT_LINK_REMOVED';

export type DoorbellSeverity = 'info' | 'watch' | 'urgent';

// ─── Core model ───────────────────────────────────────────────────────────

/**
 * DoorbellEvent
 * The parent-safe event record emitted by services/doorbellEvents.ts.
 *
 * summary: plain language — no private content, ever.
 * payload: redacted by redactParentPayload() before storage/transmission.
 */
export interface DoorbellEvent {
  eventId: string;
  teenAccountId: string;
  parentAccountId: string;
  type: DoorbellEventType;
  severity: DoorbellSeverity;
  /** ISO 8601 */
  timestamp: string;
  /** Plain-language summary safe for parent display */
  summary: string;
  /** Optional suggested action for the parent */
  recommendedAction?: string;
  /** Whether the parent has acknowledged this event */
  acknowledged: boolean;
  /** ISO 8601 — when parent acknowledged */
  acknowledgedAt?: string;
  /**
   * Redacted payload — contains only non-sensitive context.
   * NEVER includes journal, voice, AI chat, or memory content.
   * Produced exclusively by redactParentPayload() in services/doorbellEvents.ts.
   */
  redactedPayload?: DoorbellRedactedPayload;
}

/**
 * DoorbellRedactedPayload
 * The safe subset of event context visible to parents.
 * All fields are non-sensitive by definition.
 */
export interface DoorbellRedactedPayload {
  /** e.g. 'report', 'block', 'verification' — no content identifiers */
  actionType: string;
  /** Number of similar events in the last 30 days — no content */
  recentEventCount?: number;
  /** Whether teen opted in to notify trusted adult */
  teenOptedInNotification?: boolean;
  /** Surface where event originated — e.g. 'circle', 'profile' */
  originSurface?: string;
}

// ─── Preview model ────────────────────────────────────────────────────────

/**
 * DoorbellEventPreview
 * A minimal summary card for the Doorbell screen list view.
 * Produced by createDoorbellEventPreview() in services/doorbellEvents.ts.
 */
export interface DoorbellEventPreview {
  eventId: string;
  type: DoorbellEventType;
  severity: DoorbellSeverity;
  summary: string;
  /** ISO 8601 */
  timestamp: string;
  acknowledged: boolean;
}
