// src/utils/parentApprovals.ts
//
// Parent-side data layer for the chore/task and reward-redemption approval
// flow. The Supabase schema and RPCs already exist and are RLS-scoped to the
// active parent_links row (see supabase/migrations/20260627193000_phase_2_tasks_approvals_rewards.sql);
// this file is the first client to call them.

import { getSupabase } from './supabase';

async function uid(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export type BipTaskCategory = 'home' | 'school' | 'self_care' | 'growth' | 'habit' | 'custom';

export interface BipTask {
  id: string;
  teen_id: string;
  title: string;
  description: string | null;
  category: BipTaskCategory;
  point_value: number;
  requires_approval: boolean;
  status: 'active' | 'submitted' | 'rejected' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
}

export interface PendingTaskSubmission {
  id: string;
  task_id: string;
  teen_id: string;
  note: string | null;
  evidence_url: string | null;
  submitted_at: string;
  task: BipTask | null;
}

export interface RewardCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: 'digital' | 'merch' | 'experience' | 'custom';
  point_cost: number;
  fulfillment_type: 'manual' | 'digital' | 'shopify';
}

export interface PendingRewardRedemption {
  id: string;
  teen_id: string;
  reward_id: string;
  point_cost: number;
  requested_at: string;
  reward: RewardCatalogItem | null;
}

export async function fetchParentTasks(teenId: string): Promise<BipTask[]> {
  const sb = getSupabase();
  if (!sb || !teenId) return [];
  const { data } = await sb
    .from('bip_tasks')
    .select('id, teen_id, title, description, category, point_value, requires_approval, status, created_at')
    .eq('teen_id', teenId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as BipTask[];
}

export async function fetchPendingTaskSubmissions(teenId: string): Promise<PendingTaskSubmission[]> {
  const sb = getSupabase();
  if (!sb || !teenId) return [];
  const { data } = await sb
    .from('task_submissions')
    .select('id, task_id, teen_id, note, evidence_url, submitted_at, task:bip_tasks(id, teen_id, title, description, category, point_value, requires_approval, status, created_at)')
    .eq('teen_id', teenId)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });
  return (data ?? []).map((row: any) => ({
    ...row,
    task: Array.isArray(row.task) ? row.task[0] ?? null : row.task ?? null,
  })) as PendingTaskSubmission[];
}

export async function fetchPendingRewardRedemptions(teenId: string): Promise<PendingRewardRedemption[]> {
  const sb = getSupabase();
  if (!sb || !teenId) return [];
  const { data } = await sb
    .from('reward_redemptions')
    .select('id, teen_id, reward_id, point_cost, requested_at, reward:reward_catalog(id, slug, name, description, category, point_cost, fulfillment_type)')
    .eq('teen_id', teenId)
    .eq('status', 'pending_parent')
    .order('requested_at', { ascending: false });
  return (data ?? []).map((row: any) => ({
    ...row,
    reward: Array.isArray(row.reward) ? row.reward[0] ?? null : row.reward ?? null,
  })) as PendingRewardRedemption[];
}

export async function createBipTask(params: {
  teenId: string;
  title: string;
  description?: string;
  category: BipTaskCategory;
  pointValue: number;
  requiresApproval?: boolean;
}): Promise<boolean> {
  const sb = getSupabase();
  const parentId = await uid();
  if (!sb || !parentId || !params.teenId || !params.title.trim()) return false;
  const { error } = await sb.from('bip_tasks').insert({
    teen_id: params.teenId,
    created_by: parentId,
    created_by_role: 'parent',
    title: params.title.trim(),
    description: params.description?.trim() || null,
    category: params.category,
    point_value: Math.max(0, Math.min(10000, Math.round(params.pointValue))),
    requires_approval: params.requiresApproval ?? true,
  });
  return !error;
}

export async function reviewTaskSubmission(
  submissionId: string,
  approve: boolean,
  reviewNote?: string,
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc('review_task_submission', {
    p_submission_id: submissionId,
    p_approve: approve,
    p_review_note: reviewNote ?? null,
  });
  return !error;
}

export async function reviewRewardRedemption(
  redemptionId: string,
  approve: boolean,
  reviewNote?: string,
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc('review_reward_redemption', {
    p_redemption_id: redemptionId,
    p_approve: approve,
    p_review_note: reviewNote ?? null,
  });
  return !error;
}
