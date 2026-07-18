/**
 * Onboarding service
 *
 * Thin helpers for persisting onboarding state transitions.
 * Uses AsyncStorage as a local cache so screens can read back
 * the current stage without a network round-trip, and optionally
 * syncs to a `onboarding_state` Supabase table when available.
 *
 * The functions in this module are intentionally fire-and-forget
 * safe — every exported async function swallows its own errors so
 * callers never need to wrap them in try/catch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/utils/supabase';

const STAGE_KEY = 'bip_onboarding_stage';
const STAGES_LOG_KEY = 'bip_onboarding_stages_log';

/** The ordered list of onboarding stages. */
export const ONBOARDING_STAGES = [
  'created',
  'age_verified',
  'role_selected',
  'name_set',
  'identity_set',
  'consents_complete',
  'reflection_complete',
  'parent_linked',
  'complete',
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

/**
 * initOnboardingState
 *
 * Called once after a successful signup. Seeds the local AsyncStorage
 * stage record and, if Supabase is available, upserts a row in the
 * `onboarding_state` table.
 */
export async function initOnboardingState(
  userId: string,
  platform: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STAGE_KEY, 'created');
    await AsyncStorage.setItem(STAGES_LOG_KEY, JSON.stringify([{ stage: 'created', ts: Date.now(), platform }]));

    const sb = getSupabase();
    if (!sb) return;

    await sb.from('onboarding_state').upsert(
      { user_id: userId, stage: 'created', platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
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
  event: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    // Append to local log
    const raw = await AsyncStorage.getItem(STAGES_LOG_KEY);
    const log: Array<{ stage: string; ts: number; payload?: unknown }> = raw
      ? JSON.parse(raw)
      : [];
    log.push({ stage: event, ts: Date.now(), payload });
    await AsyncStorage.setItem(STAGES_LOG_KEY, JSON.stringify(log));
    await AsyncStorage.setItem(STAGE_KEY, event);

    const sb = getSupabase();
    if (!sb) return;

    await sb.from('onboarding_state').upsert(
      {
        user_id: userId,
        stage: event,
        payload: payload ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
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
