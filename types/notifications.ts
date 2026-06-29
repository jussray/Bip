/**
 * types/notifications.ts
 *
 * Notification event types for Se'kret Bip.
 *
 * ARCHITECTURE NOTE: Bip has NO open DMs.
 * The notification system surfaces system events, safety signals,
 * circle activity, and parent bridge updates — never stranger messages.
 *
 * Teen and parent notification feeds share the same event shape but
 * are filtered at the service layer by accountRole and privacy rules.
 */

import type { DoorbellEventType } from './doorbell';

// ─── Tab model ────────────────────────────────────────────────────────────

/** Notification tabs shown to teens */
export type TeenNotificationTab =
  | 'updates'    // System and milestone updates
  | 'safety'     // Safety events and check-ins
  | 'circle'     // Circle activity (allowed by privacy rules)
  | 'bridge';    // Parent Bridge messages shared by teen

/** Notification tabs shown to parents */
export type ParentNotificationTab =
  | 'doorbell'   // Safety/verification events
  | 'updates'    // Verification status, linked teen updates
  | 'pages';     // Shared Pages activity

// ─── Event types ──────────────────────────────────────────────────────────

export type NotificationEventType =
  // System
  | 'milestone_earned'
  | 'verification_status_changed'
  | 'parent_link_updated'
  // Circle (teen only)
  | 'circle_reaction_received'
  | 'circle_reply_received'
  | 'crew_invite_received'
  // Safety (teen only — never exposes private content)
  | 'safety_check_in_prompt'
  | 'report_status_updated'
  | 'block_confirmed'
  // Bridge
  | 'parent_bridge_message'
  | 'page_response_received'
  // Doorbell (parent only)
  | DoorbellEventType;

// ─── Core model ───────────────────────────────────────────────────────────

/**
 * NotificationEvent
 * A single notification item rendered in the NotificationsScreen.
 *
 * PRIVACY: body must never contain raw journal, voice, AI, or memory content.
 * Parent-bound notifications must pass through redactParentPayload() before
 * storage in the notifications feed.
 */
export interface NotificationEvent {
  notificationId: string;
  recipientAccountId: string;
  type: NotificationEventType;
  /** ISO 8601 */
  timestamp: string;
  /** Short display text — no private content */
  title: string;
  /** Optional longer body — no private content */
  body?: string;
  read: boolean;
  /** Route to navigate to when notification is tapped — must be role-appropriate */
  actionRoute?: string;
  /** Whether this notification requires acknowledgement before dismissal */
  requiresAcknowledgement?: boolean;
}
