/**
 * consentService
 *
 * Persists privacy/terms consent records for a user.
 * - Writes to Supabase `consent_records` table (upsert, fire-and-forget safe).
 * - Caches granted consents in AsyncStorage for offline reads.
 * - Exports a singleton `consentService` that matches the API called by consent.tsx.
 *
 * Required Supabase table (run once):
 *   create table if not exists consent_records (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid not null references auth.users(id) on delete cascade,
 *     consent_key text not null,
 *     granted_at  timestamptz not null default now(),
 *     unique (user_id, consent_key)
 *   );
 *   alter table consent_records enable row level security;
 *   create policy "users own their consent records"
 *     on consent_records for all using (auth.uid() = user_id);
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/utils/supabase';

const STORAGE_PREFIX = 'bip_consent_';

/** The consent keys required to complete onboarding. */
const REQUIRED_CONSENTS: ConsentKey[] = ['privacyPolicy', 'termsOfService'];

export type ConsentKey = 'privacyPolicy' | 'termsOfService';

class ConsentService {
  private granted: Set<ConsentKey> = new Set();

  // ─── Load ────────────────────────────────────────────────────────────────────

  /**
   * Populate the in-memory set from Supabase (falling back to AsyncStorage
   * if the network call fails). Call once per session after the user is known.
   */
  async load(userId: string): Promise<void> {
    // 1. Try Supabase first.
    try {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb
          .from('consent_records')
          .select('consent_key')
          .eq('user_id', userId);
        if (!error && data) {
          this.granted = new Set(
            data
              .map(r => r.consent_key as ConsentKey)
              .filter(k => REQUIRED_CONSENTS.includes(k as ConsentKey)),
          );
          // Sync cache.
          await Promise.all(
            [...this.granted].map(k =>
              AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}_${k}`, '1'),
            ),
          );
          return;
        }
      }
    } catch {
      // fall through to AsyncStorage
    }

    // 2. AsyncStorage fallback.
    const pairs = await AsyncStorage.multiGet(
      REQUIRED_CONSENTS.map(k => `${STORAGE_PREFIX}${userId}_${k}`),
    );
    this.granted = new Set(
      pairs
        .filter(([, v]) => v === '1')
        .map(([key]) => key.replace(`${STORAGE_PREFIX}${userId}_`, '') as ConsentKey),
    );
  }

  // ─── Grant ───────────────────────────────────────────────────────────────────

  /**
   * Record that the user granted a consent. Writes to Supabase and AsyncStorage.
   * Throws if both writes fail so the caller can surface an error.
   */
  async grant(userId: string, key: ConsentKey): Promise<void> {
    let supabaseOk = false;

    try {
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from('consent_records').upsert(
          { user_id: userId, consent_key: key },
          { onConflict: 'user_id,consent_key' },
        );
        if (!error) supabaseOk = true;
      }
    } catch {
      // fall through to AsyncStorage
    }

    await AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}_${key}`, '1');
    this.granted.add(key);

    if (!supabaseOk) {
      // Non-fatal: local cache succeeded. Log for retry later.
      console.warn(`[consentService] Supabase write failed for key=${key}; cached locally.`);
    }
  }

  // ─── Query ───────────────────────────────────────────────────────────────────

  /** Returns true if the user has granted the given consent key. */
  has(key: ConsentKey): boolean {
    return this.granted.has(key);
  }

  /** Returns true when all required onboarding consents have been granted. */
  hasCompletedOnboarding(): boolean {
    return REQUIRED_CONSENTS.every(k => this.granted.has(k));
  }

  /** Reset in-memory state (call on sign-out). */
  reset(): void {
    this.granted.clear();
  }
}

export const consentService = new ConsentService();
