/**
 * Onboarding Service — Se'kret Bip
 * ============================================================
 * State machine for the user onboarding flow.
 * Wraps Supabase reads/writes for user_onboarding_state table.
 *
 * OODA Role: ACT layer
 * - Advances stage after each screen completion
 * - Records funnel timing for the Observe layer (control room)
 * - Fires events readable by chief-ai-machine for adaptive nudges
 *
 * Screens ↔ Stages:
 *   welcome.tsx       → signed_up  (initial)
 *   consent.tsx       → consent_complete
 *   age.tsx           → age_verified
 *   identity.tsx      → role_selected
 *   name.tsx          → name_set
 *   reflection.tsx    → identity_set / reflection_complete
 *   parent-link.tsx   → parent_link_sent  (teen path)
 *   parent-setup.tsx  → parent_setup_done (parent path)
 *   [first core action] → activated
 * ============================================================
 */

import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────

export type OnboardingStage =
  | 'pre_signup'
  | 'signed_up'
  | 'consent_complete'
  | 'age_verified'
  | 'role_selected'
  | 'name_set'
  | 'identity_set'
  | 'reflection_complete'
  | 'parent_link_sent'
  | 'parent_setup_done'
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
}

export interface StageAdvancePayload {
  stage: OnboardingStage;
  role?: UserRole;
  age_bucket?: string;
  activation_action?: string;
  [key: string]: unknown;
}

// Stage ordering — used to guard against backwards movement
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
  'parent_setup_done',
  'activated',
  'steady_state',
];

function stageIndex(stage: OnboardingStage): number {
  return STAGE_ORDER.indexOf(stage);
}

// ─── Initialization ───────────────────────────────────────────

/**
 * Called immediately after Supabase auth sign-up.
 * Creates the onboarding state row for the new user.
 */
export async function initOnboardingState(
  userId: string,
  platform: string = 'unknown',
  referralSource?: string
): Promise<OnboardingState> {
  const { data, error } = await supabase
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

  if (error) throw new Error(`[Onboarding] Init failed: ${error.message}`);
  return data as OnboardingState;
}

// ─── Reading State ─────────────────────────────────────────────

export async function getOnboardingState(
  userId: string
): Promise<OnboardingState | null> {
  const { data, error } = await supabase
    .from('user_onboarding_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[Onboarding] Fetch failed: ${error.message}`);
  return data as OnboardingState | null;
}

// ─── Advancing Stage ──────────────────────────────────────────

/**
 * Advance the user's onboarding stage.
 * Guards against backwards movement.
 * Records timing delta since the last update for funnel analysis.
 */
export async function advanceStage(
  userId: string,
  payload: StageAdvancePayload
): Promise<OnboardingState> {
  const current = await getOnboardingState(userId);
  if (!current) throw new Error('[Onboarding] No state found — call initOnboardingState first.');

  const nextIndex = stageIndex(payload.stage);
  const currentIndex = stageIndex(current.stage);

  // Never go backwards
  if (nextIndex <= currentIndex) {
    return current; // idempotent — no-op if already at or past this stage
  }

  // Build timing field if advancing to 'activated'
  const timingUpdate: Record<string, unknown> = {};
  if (payload.stage === 'activated') {
    const createdAt = new Date(current.created_at).getTime();
    const now = Date.now();
    timingUpdate.identity_to_activated_secs = Math.round((now - createdAt) / 1000);
    timingUpdate.activated_at = new Date().toISOString();
    timingUpdate.activation_action = payload.activation_action ?? 'unknown';
  }

  if (payload.stage === 'steady_state') {
    timingUpdate.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('user_onboarding_state')
    .update({
      stage: payload.stage,
      role: payload.role ?? current.role,
      age_bucket: payload.age_bucket ?? current.age_bucket,
      ...timingUpdate,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`[Onboarding] Stage advance failed: ${error.message}`);
  return data as OnboardingState;
}

// ─── Activation ────────────────────────────────────────────────

/**
 * Mark a user as activated.
 * Call this when the user completes their first core action:
 *   - teen: first mood log, first journal entry, first post
 *   - parent: first bridge message, first check-in viewed
 *
 * @param activationAction - descriptive string e.g. 'first_mood_log'
 */
export async function markActivated(
  userId: string,
  activationAction: string
): Promise<OnboardingState> {
  return advanceStage(userId, {
    stage: 'activated',
    activation_action: activationAction,
  });
}

// ─── Parent Link ───────────────────────────────────────────────

/**
 * Generate and store a parent link code for a teen user.
 * The code is sent to the parent to complete the link.
 */
export async function setParentLinkCode(
  userId: string,
  code: string
): Promise<void> {
  const { error } = await supabase
    .from('user_onboarding_state')
    .update({
      parent_link_code: code,
      stage: 'parent_link_sent',
    })
    .eq('user_id', userId);

  if (error) throw new Error(`[Onboarding] Parent link code failed: ${error.message}`);
}

/**
 * Called when a parent accepts a teen's invite link.
 * Links both accounts.
 */
export async function completeParentLink(
  teenUserId: string,
  parentUserId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_onboarding_state')
    .update({
      linked_parent_id: parentUserId,
      parent_linked_at: new Date().toISOString(),
    })
    .eq('user_id', teenUserId);

  if (error) throw new Error(`[Onboarding] Complete parent link failed: ${error.message}`);
}

// ─── Helpers ──────────────────────────────────────────────────

/** Returns true if the user has completed onboarding. */
export function isOnboardingComplete(state: OnboardingState | null): boolean {
  if (!state) return false;
  return stageIndex(state.stage) >= stageIndex('activated');
}

/** Returns the next expected screen route for a given stage. */
export function nextScreenForStage(stage: OnboardingStage, role: UserRole): string {
  const map: Partial<Record<OnboardingStage, string>> = {
    signed_up: '/(onboarding)/welcome',
    consent_complete: '/(onboarding)/age',
    age_verified: '/(onboarding)/identity',
    role_selected: role === 'parent' ? '/(onboarding)/parent-welcome' : '/(onboarding)/name',
    name_set: '/(onboarding)/reflection',
    identity_set: '/(onboarding)/reflection',
    reflection_complete: role === 'teen' ? '/(onboarding)/parent-link' : '/(onboarding)/parent-setup',
    parent_link_sent: '/(teen)',
    parent_setup_done: '/(parent)',
    activated: '/(teen)',
    steady_state: '/(teen)',
  };
  return map[stage] ?? '/(onboarding)/welcome';
}
