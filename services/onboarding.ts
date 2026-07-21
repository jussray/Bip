/**
 * Onboarding Service — Se'kret Bip
 * ============================================================
 * State machine for the user onboarding flow.
 * Wraps Supabase reads/writes for user_onboarding_state.
 *
 * Calls may use either:
 *   advanceStage(userId, { stage: 'name_set', role: 'teen' })
 * or:
 *   advanceStage(userId, 'name_set', { role: 'teen' })
 * ============================================================
 */

import { getSupabase } from '@/utils/supabase';
import {
  classifyOnboardingZeroRow,
  nextOnboardingWriteAttempt,
} from './onboardingWriteRetry.mjs';

export type OnboardingStage =
  | 'pre_signup'
  | 'signed_up'
  | 'consent_complete'
  | 'age_verified'
  | 'role_selected'
  | 'name_set'
  | 'identity_set'
  | 'reflection_complete'
  | 'parent_linked'
  | 'parent_link_skipped'
  | 'parent_link_sent'
  | 'parent_setup_complete'
  | 'activated'
  | 'steady_state';

export type UserRole = 'teen' | 'parent' | 'unknown';

export interface OnboardingState {
  id: string;
  user_id: string;
  stage: OnboardingStage;
  role: UserRole;
  activated_at: string | null;
  activation_action: string | null;
  age_bucket: string | null;
  referral_source: string | null;
  device_platform: string | null;
  parent_link_code: string | null;
  parent_linked_at: string | null;
  linked_parent_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  signup_to_consent_secs: number | null;
  consent_to_age_secs: number | null;
  age_to_role_secs: number | null;
  role_to_name_secs: number | null;
  name_to_identity_secs: number | null;
  identity_to_activated_secs: number | null;
}

export interface StageAdvancePayload {
  stage: OnboardingStage;
  role?: UserRole;
  age_bucket?: string;
  activation_action?: string;
  [key: string]: unknown;
}

type StageAdvanceExtras = Omit<StageAdvancePayload, 'stage'>;

const STAGE_ORDER: OnboardingStage[] = [
  'pre_signup',
  'signed_up',
  'consent_complete',
  'age_verified',
  'role_selected',
  'name_set',
  'identity_set',
  'reflection_complete',
  'parent_link_sent',
  'parent_linked',
  'parent_link_skipped',
  'parent_setup_complete',
  'activated',
  'steady_state',
];

const PARALLEL_STAGES: Partial<Record<OnboardingStage, number>> = {
  parent_linked: STAGE_ORDER.indexOf('parent_linked'),
  parent_link_skipped: STAGE_ORDER.indexOf('parent_linked'),
};

function stageIndex(stage: OnboardingStage): number {
  return PARALLEL_STAGES[stage] ?? STAGE_ORDER.indexOf(stage);
}

function db() {
  const sb = getSupabase();
  if (!sb) throw new Error('[Onboarding] Supabase client not available.');
  return sb;
}

function normalizeAdvancePayload(
  payloadOrStage: StageAdvancePayload | OnboardingStage,
  extras: StageAdvanceExtras = {},
): StageAdvancePayload {
  return typeof payloadOrStage === 'string'
    ? { stage: payloadOrStage, ...extras }
    : payloadOrStage;
}

function inferredRole(payload: StageAdvancePayload): UserRole | undefined {
  if (payload.role) return payload.role;
  if (
    payload.stage === 'parent_linked'
    || payload.stage === 'parent_link_skipped'
    || payload.stage === 'parent_setup_complete'
  ) {
    return 'parent';
  }
  if (payload.stage === 'parent_link_sent') return 'teen';
  return undefined;
}

export async function initOnboardingState(
  userId: string,
  platform: string = 'unknown',
  referralSource?: string,
): Promise<OnboardingState> {
  const existing = await getOnboardingState(userId);
  if (existing) return existing;

  const { data, error } = await db()
    .from('user_onboarding_state')
    .insert({
      user_id: userId,
      stage: 'signed_up',
      role: 'unknown',
      device_platform: platform,
      referral_source: referralSource ?? null,
    })
    .select()
    .single();

  if (error) {
    // A concurrent provider/screen initialization may have won the insert race.
    if (error.code === '23505' || error.message.toLowerCase().includes('duplicate')) {
      const raced = await getOnboardingState(userId);
      if (raced) return raced;
    }
    throw new Error(`[Onboarding] Init failed: ${error.message}`);
  }
  return data as OnboardingState;
}

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState | null> {
  const { data, error } = await db()
    .from('user_onboarding_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[Onboarding] Fetch failed: ${error.message}`);
  return data as OnboardingState | null;
}

function assertCompatibleRepairValue(
  label: 'role' | 'age_bucket',
  currentValue: string | null,
  requestedValue: string | undefined,
): void {
  if (!requestedValue || currentValue === null || currentValue === 'unknown') return;
  if (currentValue !== requestedValue) {
    throw new Error(
      `[Onboarding] ${label} conflict: current=${currentValue}, requested=${requestedValue}`,
    );
  }
}

function isPassedStageMetadataSatisfied(
  current: OnboardingState,
  payload: StageAdvancePayload,
): boolean {
  const role = inferredRole(payload);
  const roleSatisfied = !role || role === 'unknown' || current.role === role;
  const ageSatisfied = !payload.age_bucket || current.age_bucket === payload.age_bucket;
  return roleSatisfied && ageSatisfied;
}

async function backfillPassedStageMetadata(
  userId: string,
  current: OnboardingState,
  payload: StageAdvancePayload,
  attempt: number,
): Promise<OnboardingState> {
  const patch: Record<string, unknown> = {};
  const role = inferredRole(payload);

  assertCompatibleRepairValue('role', current.role, role);
  assertCompatibleRepairValue('age_bucket', current.age_bucket, payload.age_bucket);

  // Direct-main bugs may already have advanced a row while leaving role/age
  // unknown. Repair only missing metadata and never lower the current stage.
  if (current.role === 'unknown' && role && role !== 'unknown') {
    patch.role = role;
  }
  if (!current.age_bucket && typeof payload.age_bucket === 'string') {
    patch.age_bucket = payload.age_bucket;
  }

  if (Object.keys(patch).length === 0) return current;

  // The old value predicates are part of the compare-and-swap. Without them,
  // two devices repairing the same already-passed row can overwrite each
  // other's role or age metadata and hide the conflict.
  let request = db()
    .from('user_onboarding_state')
    .update(patch)
    .eq('user_id', userId)
    .eq('stage', current.stage)
    .eq('role', current.role);

  request = current.age_bucket === null
    ? request.is('age_bucket', null)
    : request.eq('age_bucket', current.age_bucket);

  const { data, error } = await request
    .select()
    .maybeSingle();

  if (error) throw new Error(`[Onboarding] Metadata repair failed: ${error.message}`);
  if (data) return data as OnboardingState;

  const refreshed = await getOnboardingState(userId);
  if (!refreshed) {
    throw new Error('[Onboarding] Metadata repair conflict: onboarding row disappeared.');
  }
  assertCompatibleRepairValue('role', refreshed.role, role);
  assertCompatibleRepairValue('age_bucket', refreshed.age_bucket, payload.age_bucket);
  if (isPassedStageMetadataSatisfied(refreshed, payload)) return refreshed;

  const nextAttempt = nextOnboardingWriteAttempt(attempt);
  return backfillPassedStageMetadata(userId, refreshed, payload, nextAttempt);
}

async function advanceStageInternal(
  userId: string,
  payload: StageAdvancePayload,
  attempt: number,
): Promise<OnboardingState> {
  const current = await getOnboardingState(userId);

  if (!current) {
    await initOnboardingState(userId);
    return advanceStageInternal(userId, payload, attempt);
  }

  const nextIndex = stageIndex(payload.stage);
  const currentIndex = stageIndex(current.stage);
  if (nextIndex <= currentIndex) {
    return backfillPassedStageMetadata(userId, current, payload, attempt);
  }

  const extra: Record<string, unknown> = {};

  if (payload.stage === 'activated') {
    extra.identity_to_activated_secs = Math.round(
      (Date.now() - new Date(current.created_at).getTime()) / 1000,
    );
    extra.activated_at = new Date().toISOString();
    extra.activation_action = payload.activation_action ?? 'unknown';
  }

  if (payload.stage === 'steady_state') {
    extra.completed_at = new Date().toISOString();
  }

  if (payload.stage === 'consent_complete' && current.stage === 'signed_up') {
    extra.signup_to_consent_secs = Math.round(
      (Date.now() - new Date(current.created_at).getTime()) / 1000,
    );
  }

  if (payload.stage === 'age_verified' && current.stage === 'consent_complete') {
    extra.consent_to_age_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000,
    );
  }

  if (payload.stage === 'role_selected' && current.stage === 'age_verified') {
    extra.age_to_role_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000,
    );
  }

  if (payload.stage === 'name_set' && current.stage === 'role_selected') {
    extra.role_to_name_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000,
    );
  }

  if (payload.stage === 'identity_set' && current.stage === 'name_set') {
    extra.name_to_identity_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000,
    );
  }

  const role = inferredRole(payload) ?? current.role;
  const { data, error } = await db()
    .from('user_onboarding_state')
    .update({
      stage: payload.stage,
      role,
      age_bucket: payload.age_bucket ?? current.age_bucket,
      ...extra,
    })
    .eq('user_id', userId)
    .eq('stage', current.stage)
    .select()
    .maybeSingle();

  if (error) throw new Error(`[Onboarding] Stage advance failed: ${error.message}`);
  if (data) return data as OnboardingState;

  const refreshed = await getOnboardingState(userId);
  if (!refreshed) {
    throw new Error('[Onboarding] Stage write conflict: onboarding row disappeared.');
  }

  const zeroRowState = classifyOnboardingZeroRow(
    stageIndex(refreshed.stage),
    nextIndex,
  );
  if (zeroRowState === 'satisfied') {
    return backfillPassedStageMetadata(userId, refreshed, payload, attempt);
  }

  const nextAttempt = nextOnboardingWriteAttempt(attempt);
  return advanceStageInternal(userId, payload, nextAttempt);
}

export async function advanceStage(
  userId: string,
  payload: StageAdvancePayload,
): Promise<OnboardingState>;
export async function advanceStage(
  userId: string,
  stage: OnboardingStage,
  extras?: StageAdvanceExtras,
): Promise<OnboardingState>;
export async function advanceStage(
  userId: string,
  payloadOrStage: StageAdvancePayload | OnboardingStage,
  extras: StageAdvanceExtras = {},
): Promise<OnboardingState> {
  const payload = normalizeAdvancePayload(payloadOrStage, extras);
  return advanceStageInternal(userId, payload, 0);
}

export async function markActivated(
  userId: string,
  activationAction: string,
): Promise<OnboardingState> {
  return advanceStage(userId, {
    stage: 'activated',
    activation_action: activationAction,
  });
}

export async function setParentLinkCode(
  userId: string,
  code: string,
): Promise<void> {
  const { error } = await db()
    .from('user_onboarding_state')
    .update({ parent_link_code: code })
    .eq('user_id', userId);

  if (error) throw new Error(`[Onboarding] Parent link code failed: ${error.message}`);
  await advanceStage(userId, 'parent_link_sent');
}

export async function completeParentLink(
  teenUserId: string,
  parentUserId: string,
): Promise<void> {
  const { error } = await db()
    .from('user_onboarding_state')
    .update({
      linked_parent_id: parentUserId,
      parent_linked_at: new Date().toISOString(),
    })
    .eq('user_id', teenUserId);

  if (error) throw new Error(`[Onboarding] Complete parent link failed: ${error.message}`);
}

export function isOnboardingComplete(state: OnboardingState | null): boolean {
  if (!state) return false;
  return stageIndex(state.stage) >= stageIndex('activated');
}

export function nextScreenForStage(
  stage: OnboardingStage,
  role: UserRole,
): string {
  const map: Partial<Record<OnboardingStage, string>> = {
    signed_up: '/(onboarding)/welcome',
    consent_complete: '/(onboarding)/age',
    age_verified: '/(onboarding)/identity',
    role_selected: role === 'parent'
      ? '/(onboarding)/parent-welcome'
      : '/(onboarding)/name',
    name_set: '/(onboarding)/reflection',
    identity_set: '/(onboarding)/reflection',
    reflection_complete: '/(onboarding)/parent-link',
    parent_link_sent: role === 'teen'
      ? '/(teen)'
      : '/(onboarding)/parent-link',
    parent_linked: '/(parent)',
    parent_link_skipped: '/(auth)/guardian-verification',
    parent_setup_complete: role === 'parent'
      ? '/(parent)'
      : '/(auth)/guardian-verification',
    activated: role === 'parent' ? '/(parent)' : '/(teen)',
    steady_state: role === 'parent' ? '/(parent)' : '/(teen)',
  };
  return map[stage] ?? '/(onboarding)/welcome';
}
