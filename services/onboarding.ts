/**
 * Onboarding Service — Se'kret Bip
 * ============================================================
 * State machine for the user onboarding flow.
 * Wraps Supabase reads/writes for user_onboarding_state table.
 *
 * OODA Role: ACT layer
 *   Observe  — funnel timing cols feed the control room
 *   Orient   — role/age_bucket/device segment adaptive flows
 *   Decide   — nextScreenForStage() returns the correct route
 *   Act      — advanceStage() writes state forward-only
 *
 * Import pattern: uses getSupabase() from @/utils/supabase
 * to match the rest of the codebase.
 *
 * Fire-and-forget usage (screens — self-reliant pattern):
 *   getSupabase()?.auth.getUser().then(({ data }) => {
 *     if (data.user) advanceStage(data.user.id, 'name_set').catch(() => null);
 *   });
 *
 * Context-aware usage (if OnboardingContext is mounted):
 *   const { advance } = useOnboarding();
 *   await advance('name_set');
 * ============================================================
 */

import { getSupabase } from '@/utils/supabase';

// ─── Types ────────────────────────────────────────────────────

export type OnboardingStage =
  | 'pre_signup'
  | 'signed_up'
  | 'consent_complete'
  | 'age_verified'
  | 'role_selected'      // identity.tsx fires this
  | 'name_set'
  | 'identity_set'       // alias kept for backwards compat
  | 'reflection_complete'
  | 'parent_linked'      // parent successfully linked a teen
  | 'parent_link_skipped'// parent chose to link later
  | 'parent_link_sent'   // teen dispatched invite code (teen path)
  | 'parent_setup_complete' // parent finished profile setup
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
  // Funnel timing
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

// Stage ordering — used to guard against backwards movement.
// parent_linked and parent_link_skipped are parallel branches;
// both are treated as equivalently "past" parent-link step.
const STAGE_ORDER: OnboardingStage[] = [
  'pre_signup',
  'signed_up',
  'consent_complete',
  'age_verified',
  'role_selected',
  'name_set',
  'identity_set',
  'reflection_complete',
  'parent_link_sent',     // teen dispatched invite
  'parent_linked',        // parent linked a teen
  'parent_link_skipped',  // parent skipped linking (same rank as parent_linked)
  'parent_setup_complete',
  'activated',
  'steady_state',
];

// Parallel stages that should be treated as equivalent rank
// when checking forward-only guard.
const PARALLEL_STAGES: Partial<Record<OnboardingStage, number>> = {
  parent_linked: STAGE_ORDER.indexOf('parent_linked'),
  parent_link_skipped: STAGE_ORDER.indexOf('parent_linked'), // same rank
};

function stageIndex(stage: OnboardingStage): number {
  return PARALLEL_STAGES[stage] ?? STAGE_ORDER.indexOf(stage);
}

function db() {
  const sb = getSupabase();
  if (!sb) throw new Error('[Onboarding] Supabase client not available.');
  return sb;
}

// ─── Initialization ───────────────────────────────────────────

/**
 * Called immediately after Supabase auth sign-up.
 * Creates the onboarding state row for the new user.
 * Safe to call multiple times — uses upsert.
 */
export async function initOnboardingState(
  userId: string,
  platform: string = 'unknown',
  referralSource?: string
): Promise<OnboardingState> {
  const { data, error } = await db()
    .from('user_onboarding_state')
    .upsert(
      {
        user_id: userId,
        stage: 'signed_up',
        role: 'unknown',
        device_platform: platform,
        referral_source: referralSource ?? null,
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) {
    // Row already exists — fetch it instead
    if (error.code === '23505' || error.message.includes('duplicate')) {
      const existing = await getOnboardingState(userId);
      if (existing) return existing;
    }
    throw new Error(`[Onboarding] Init failed: ${error.message}`);
  }
  return data as OnboardingState;
}

// ─── Reading State ─────────────────────────────────────────────

export async function getOnboardingState(
  userId: string
): Promise<OnboardingState | null> {
  const { data, error } = await db()
    .from('user_onboarding_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[Onboarding] Fetch failed: ${error.message}`);
  return data as OnboardingState | null;
}

// ─── Advancing Stage ──────────────────────────────────────────

/**
 * Advance the user's onboarding stage forward.
 * Guards against backwards movement — returns current state silently
 * if called with an already-passed stage (idempotent).
 */
export async function advanceStage(
  userId: string,
  payload: StageAdvancePayload
): Promise<OnboardingState> {
  const current = await getOnboardingState(userId);

  // If row doesn't exist yet (race condition), init first then retry
  if (!current) {
    await initOnboardingState(userId);
    return advanceStage(userId, payload);
  }

  const nextIndex = stageIndex(payload.stage);
  const currentIndex = stageIndex(current.stage);

  // Forward-only guard — no-op if already at or past this stage
  if (nextIndex <= currentIndex) return current;

  // Build timing and activation columns for special transitions
  const extra: Record<string, unknown> = {};

  if (payload.stage === 'activated') {
    const createdMs = new Date(current.created_at).getTime();
    extra.identity_to_activated_secs = Math.round((Date.now() - createdMs) / 1000);
    extra.activated_at = new Date().toISOString();
    extra.activation_action = payload.activation_action ?? 'unknown';
  }

  if (payload.stage === 'steady_state') {
    extra.completed_at = new Date().toISOString();
  }

  if (payload.stage === 'consent_complete' && current.stage === 'signed_up') {
    extra.signup_to_consent_secs = Math.round(
      (Date.now() - new Date(current.created_at).getTime()) / 1000
    );
  }

  if (payload.stage === 'age_verified' && current.stage === 'consent_complete') {
    extra.consent_to_age_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000
    );
  }

  if (payload.stage === 'role_selected' && current.stage === 'age_verified') {
    extra.age_to_role_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000
    );
  }

  if (payload.stage === 'name_set' && current.stage === 'role_selected') {
    extra.role_to_name_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000
    );
  }

  if (payload.stage === 'reflection_complete' && current.stage === 'name_set') {
    extra.name_to_identity_secs = Math.round(
      (Date.now() - new Date(current.updated_at).getTime()) / 1000
    );
  }

  const { data, error } = await db()
    .from('user_onboarding_state')
    .update({
      stage: payload.stage,
      role: payload.role ?? current.role,
      age_bucket: payload.age_bucket ?? current.age_bucket,
      ...extra,
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
 *
 * Call this when the user completes their FIRST core action:
 *   Teen:   'first_mood_log' | 'first_journal_entry' | 'first_post'
 *   Parent: 'first_bridge_message' | 'first_checkin_viewed'
 *
 * The DB trigger in 20260718000001_onboarding_mood_log_trigger.sql
 * also fires this automatically for mood logs, so the app-side call
 * here is belt-and-suspenders.
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

export async function setParentLinkCode(
  userId: string,
  code: string
): Promise<void> {
  const { error } = await db()
    .from('user_onboarding_state')
    .update({ parent_link_code: code, stage: 'parent_link_sent' })
    .eq('user_id', userId);

  if (error) throw new Error(`[Onboarding] Parent link code failed: ${error.message}`);
}

export async function completeParentLink(
  teenUserId: string,
  parentUserId: string
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

// ─── Helpers ──────────────────────────────────────────────────

/** Returns true if the user has completed onboarding. */
export function isOnboardingComplete(state: OnboardingState | null): boolean {
  if (!state) return false;
  return stageIndex(state.stage) >= stageIndex('activated');
}

/**
 * Returns the next expected screen route for a given stage + role.
 * Used by OnboardingGuard to redirect mid-flow users.
 */
export function nextScreenForStage(stage: OnboardingStage, role: UserRole): string {
  const map: Partial<Record<OnboardingStage, string>> = {
    signed_up:              '/(onboarding)/welcome',
    consent_complete:       '/(onboarding)/age',
    age_verified:           '/(onboarding)/identity',
    role_selected:          role === 'parent' ? '/(onboarding)/parent-welcome' : '/(onboarding)/name',
    name_set:               '/(onboarding)/reflection',
    identity_set:           '/(onboarding)/reflection',      // alias
    reflection_complete:    '/(onboarding)/parent-link',
    parent_link_sent:       role === 'teen' ? '/(teen)' : '/(onboarding)/parent-link',
    parent_linked:          '/(parent)',
    parent_link_skipped:    '/(auth)/guardian-verification',
    parent_setup_complete:  role === 'parent' ? '/(parent)' : '/(auth)/guardian-verification',
    activated:              role === 'parent' ? '/(parent)' : '/(teen)',
    steady_state:           role === 'parent' ? '/(parent)' : '/(teen)',
  };
  return map[stage] ?? '/(onboarding)/welcome';
}
