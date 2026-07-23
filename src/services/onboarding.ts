/**
 * Onboarding service
 *
 * Thin helpers for persisting onboarding state transitions.
 * Uses AsyncStorage as a local cache so screens can read back
 * the current stage without a network round-trip, and syncs to
 * the `user_onboarding_state` table when available.
 *
 * `user_onboarding_state` is server-enforced (see
 * supabase/migrations/20260718000002_harden_onboarding_state.sql):
 * the row starts at the baseline ('signed_up', role 'unknown') and the
 * `enforce_onboarding_state_transition()` trigger rejects backward stage
 * moves, cross-user rewrites, and out-of-bounds metadata. This module does
 * not duplicate that enforcement — it is client-reported telemetry, not
 * authorization, so a rejected write is expected and safe to ignore.
 *
 * The functions in this module are intentionally fire-and-forget
 * safe — every exported async function swallows its own errors so
 * callers never need to wrap them in try/catch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/utils/supabase';

const STAGE_KEY = 'bip_onboarding_stage';
const STAGES_LOG_KEY = 'bip_onboarding_stages_log';

/** Must match the `onboarding_stage` Postgres enum exactly. */
export const ONBOARDING_STAGES = [
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
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

/** Only these payload keys map to real `user_onboarding_state` columns. */
function pickKnownColumns(payload?: Record<string, unknown>): Record<string, unknown> {
  if (!payload) return {};
  const columns: Record<string, unknown> = {};
  if (typeof payload.role === 'string') columns.role = payload.role;
  if (typeof payload.age_bucket === 'string') columns.age_bucket = payload.age_bucket;
  if (typeof payload.referral_source === 'string') columns.referral_source = payload.referral_source;
  if (typeof payload.device_platform === 'string') columns.device_platform = payload.device_platform;
  return columns;
}

/**
 * Insert the server-known baseline row if one doesn't exist yet. Safe to
 * call before every advance: a plain insert (not upsert) fails harmlessly
 * on the existing row's unique constraint instead of overwriting progress.
 */
async function ensureBaselineRow(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  userId: string,
): Promise<void> {
  try {
    await sb.from('user_onboarding_state').insert({
      user_id: userId,
      stage: 'signed_up',
      role: 'unknown',
    });
  } catch {
    // Row already exists — expected on every call after the first.
  }
}

/**
 * initOnboardingState
 *
 * Called once after a successful signup. Seeds the local AsyncStorage
 * stage record and creates the server-known baseline row.
 */
export async function initOnboardingState(
  userId: string,
  platform: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STAGE_KEY, 'signed_up');
    await AsyncStorage.setItem(STAGES_LOG_KEY, JSON.stringify([{ stage: 'signed_up', ts: Date.now(), platform }]));

    const sb = getSupabase();
    if (!sb) return;

    await ensureBaselineRow(sb, userId);
  } catch {
    // Never block the signup flow
  }
}

/**
 * advanceStage
 *
 * Records a stage transition locally and syncs to Supabase.
 * Safe to call fire-and-forget.
 */
export async function advanceStage(
  userId: string,
  stage: OnboardingStage,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    // Append to local log
    const raw = await AsyncStorage.getItem(STAGES_LOG_KEY);
    const log: Array<{ stage: string; ts: number; payload?: unknown }> = raw
      ? JSON.parse(raw)
      : [];
    log.push({ stage, ts: Date.now(), payload });
    await AsyncStorage.setItem(STAGES_LOG_KEY, JSON.stringify(log));
    await AsyncStorage.setItem(STAGE_KEY, stage);

    const sb = getSupabase();
    if (!sb) return;

    await ensureBaselineRow(sb, userId);

    await sb
      .from('user_onboarding_state')
      .update({ stage, ...pickKnownColumns(payload) })
      .eq('user_id', userId);
  } catch {
    // Never block UI
  }
}

/**
 * markActivated
 *
 * Advances to the 'activated' stage and records the activation action.
 * The server requires activated_at to be set together with the 'activated'
 * stage in the same write (see enforce_onboarding_state_transition()), so
 * this cannot be expressed as a plain advanceStage() call.
 */
export async function markActivated(userId: string, activationAction: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STAGE_KEY, 'activated');

    const sb = getSupabase();
    if (!sb) return;

    await ensureBaselineRow(sb, userId);

    await sb
      .from('user_onboarding_state')
      .update({
        stage: 'activated',
        activated_at: new Date().toISOString(),
        activation_action: activationAction,
      })
      .eq('user_id', userId);
  } catch {
    // Never block UI
  }
}

/**
 * getCurrentStage
 *
 * Reads the current stage from AsyncStorage. Returns null if not set.
 */
export async function getCurrentStage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * clearOnboardingState
 *
 * Removes all local onboarding state. Call on sign-out.
 */
export async function clearOnboardingState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STAGE_KEY, STAGES_LOG_KEY]);
  } catch {
    // Silent
  }
}
