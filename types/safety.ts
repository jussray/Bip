/**
 * types/safety.ts
 *
 * Safety event types for Se'kret Bip.
 *
 * These are used by:
 * - app/(safety)/ screens
 * - services/doorbellEvents.ts (for parent-visible safety summaries)
 * - components/safety/
 *
 * PRIVACY: SafetyEvent payloads visible to parents must always be
 * passed through redactParentPayload() before any parent-facing render.
 * Raw content fields (journalSnippet, voiceTranscript, aiChatContent)
 * MUST NOT appear in parent-visible event summaries.
 */

// ─── Report flow ──────────────────────────────────────────────────────────

export type ReportReason =
  | 'feels_unsafe'
  | 'creepy_behavior'
  | 'off_platform_move'
  | 'photo_request'
  | 'age_mismatch'
  | 'mass_contact'
  | 'harassment'
  | 'harmful_content'
  | 'other';

export type ReportTargetType = 'post' | 'profile' | 'reply' | 'circle' | 'general';

export interface ReportEvent {
  reportId: string;
  reporterId: string; // teen accountId — never exposed to reported user
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  /** Optional note from teen — NEVER forwarded to reported user */
  noteInternal?: string;
  /** Automatically captured context snapshot (no private content) */
  contextSnapshot?: string;
  /** ISO 8601 */
  createdAt: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'escalated';
}

// ─── Block flow ───────────────────────────────────────────────────────────

export interface BlockEvent {
  blockId: string;
  blockerId: string;
  blockedId: string;
  /** Affected surfaces: circles, replies, discovery, mentions */
  surfaces: ('circle' | 'replies' | 'discovery' | 'mentions')[];
  /** Whether a report was also filed at the same time */
  reportFiled: boolean;
  /** ISO 8601 */
  createdAt: string;
}

// ─── Emergency event ──────────────────────────────────────────────────────

export type EmergencyType =
  | 'feel_unsafe'
  | 'creepy_person'
  | 'something_wrong'
  | 'mental_health_crisis';

export interface EmergencyEvent {
  emergencyId: string;
  accountId: string;
  type: EmergencyType;
  /**
   * Severity determines if parent Doorbell notification is triggered.
   * 'low' and 'medium' — support resources only, no parent alert by default.
   * 'high' — configurable parent alert threshold.
   */
  severity: 'low' | 'medium' | 'high';
  /** Teen's explicit opt-in to notify trusted adult */
  notifyTrustedAdult: boolean;
  /** Evidence is preserved for moderation only — never shown to parents */
  evidencePreserved: boolean;
  /** ISO 8601 */
  createdAt: string;
  status: 'open' | 'in_support' | 'resolved' | 'escalated';
}

// ─── Safety check-in ─────────────────────────────────────────────────────

export type CheckInTrigger =
  | 'post_report'
  | 'post_block'
  | 'post_emergency'
  | 'proactive';

export interface SafetyCheckIn {
  checkInId: string;
  accountId: string;
  trigger: CheckInTrigger;
  /** Teen's self-reported state — private, never parent-visible */
  selfReportedState?: string;
  groundingStepsCompleted: boolean;
  notifyTrustedAdult: boolean;
  /** ISO 8601 */
  createdAt: string;
}

// ─── Composite safety event ───────────────────────────────────────────────

/**
 * SafetyEvent
 * Union of all safety event types for use in safety service and screens.
 */
export type SafetyEvent =
  | ({ kind: 'report' } & ReportEvent)
  | ({ kind: 'block' } & BlockEvent)
  | ({ kind: 'emergency' } & EmergencyEvent)
  | ({ kind: 'check_in' } & SafetyCheckIn);
