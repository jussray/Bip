/**
 * controlRoomIssues.ts
 * Thin service layer for the control_room_issues table.
 * PR 2 will add full deduplication + issue normalization logic.
 * This PR exposes only what the UI currently needs: resolving audit events.
 */
import { supabase } from '@/utils/supabase/client';

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

/**
 * SQL to create the control_room_issues table (run in Supabase before PR 2):
 *
 * create table if not exists public.control_room_issues (
 *   id               uuid primary key default gen_random_uuid(),
 *   category         text not null,
 *   severity         text not null default 'info',
 *   status           text not null default 'open',
 *   title            text not null,
 *   summary          text,
 *   suggested_fix    text,
 *   affected_surface text,
 *   affected_users   integer default 0,
 *   occurrence_count integer default 1,
 *   first_seen_at    timestamptz not null default now(),
 *   last_seen_at     timestamptz not null default now(),
 *   owner            text,
 *   release          text,
 *   metadata         jsonb,
 *   created_at       timestamptz not null default now(),
 *   updated_at       timestamptz not null default now()
 * );
 *
 * alter table public.control_room_issues enable row level security;
 *
 * -- Only founders can read/write
 * create policy "Founder: control room issues"
 *   on public.control_room_issues
 *   for all
 *   using (
 *     exists (
 *       select 1 from public.app_profiles
 *       where user_id = auth.uid()
 *         and role in ('founder', 'admin', 'developer')
 *     )
 *   );
 */

export const controlRoomIssuesService = {
  /** List all non-ignored issues. */
  async list(): Promise<ControlRoomIssue[]> {
    const { data, error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase
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
