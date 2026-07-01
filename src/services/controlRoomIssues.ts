/**
 * src/services/controlRoomIssues.ts
 * Thin service layer for the control_room_issues table.
 * PR 2 will add full deduplication + issue normalization logic.
 * This PR exposes only what the UI currently needs: resolving audit events.
 */
import { getSupabase, isSupabaseConfigured } from '@/utils/supabase';

export type IssueStatus =
  | 'open'
  | 'investigating'
  | 'planned'
  | 'building'
  | 'testing'
  | 'resolved'
  | 'ignored';

export type IssueSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ControlRoomIssue {
  id: string;
  category: string;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  summary: string;
  suggested_fix?: string;
  affected_surface?: string;
  affected_users?: number;
  occurrence_count?: number;
  first_seen_at: string;
  last_seen_at: string;
  owner?: string;
  release?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const controlRoomIssuesService = {
  /** List all non-ignored issues. */
  async list(): Promise<ControlRoomIssue[]> {
    if (!isSupabaseConfigured) return [];
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
      .from('control_room_issues')
      .select('*')
      .neq('status', 'ignored')
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.warn('[controlRoomIssues] list error:', error.message);
      return [];
    }
    return (data ?? []) as ControlRoomIssue[];
  },

  /** Mark an audit_events row as resolved. */
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

  /** Update an issue's status. */
  async updateStatus(id: string, status: IssueStatus): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
      .from('control_room_issues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('[controlRoomIssues] updateStatus error:', error.message);
      return false;
    }
    return true;
  },
};
