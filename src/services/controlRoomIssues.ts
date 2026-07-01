import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  assignIssue,
  buildFingerprint,
  deriveIssueFields,
  getIssueHistory,
  getLinkedEvents,
  ingestAuditEvent,
  listNormalizedIssues,
  normalizeRecentEvents,
  updateIssueNotes,
  updateIssueStatus,
} from '@/services/issueNormalizer';

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
};

export const controlRoomIssuesService = {
  list: listNormalizedIssues,
  updateStatus: updateIssueStatus,
  async resolveAuditEvent(auditEventId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb
      .from('audit_events')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', auditEventId);
    if (error) {
      console.warn('[controlRoomIssues] resolveAuditEvent error:', error.message);
      return false;
    }
    return true;
  },
};
