/**
 * src/services/controlRoomIssues.ts
 *
 * Public API for the Control Room issue layer.
 * PR 2: now delegates to issueNormalizer for the full normalized pipeline.
 * All reads go through listNormalizedIssues (filters, pagination).
 * All writes go through updateIssueStatus / updateIssueNotes / assignIssue.
 *
 * The raw audit_events layer (founderAudit.ts) remains unchanged.
 * No teen or parent flows are affected.
 */
export type {
  NormalizedIssue as ControlRoomIssue,
  IssueStatus,
  IssueSeverity,
  IssueSource,
  IssueCategory,
  IssueFilter,
  IssueHistoryEntry,
} from '@/services/issueNormalizer';

export {
  listNormalizedIssues,
  updateIssueStatus,
  updateIssueNotes,
  assignIssue,
  ingestAuditEvent,
  normalizeRecentEvents,
  getLinkedEvents,
  getIssueHistory,
  buildFingerprint,
  deriveIssueFields,
} from '@/services/issueNormalizer';
