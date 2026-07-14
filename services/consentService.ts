/**
 * consentService.ts — Trust-02: Consent & Audit Trail
 *
 * Tracks explicit user consent for each consent category.
 * Consent state is stored in Supabase and kept as an in-memory
 * cache for the session. Every grant/revoke is logged with a timestamp.
 *
 * Usage:
 *   await consentService.grant('notifications');
 *   const hasConsent = consentService.has('moodTracking');
 */

import { supabase } from './supabase'; // adjust path if needed

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsentCategory =
  | 'notifications'
  | 'moodTracking'
  | 'journaling'
  | 'aiChat'
  | 'analytics'
  | 'privacyPolicy'
  | 'termsOfService';

export interface ConsentRecord {
  category: ConsentCategory;
  granted: boolean;
  timestamp: string; // ISO 8601
  version: string;   // consent doc version, bump when copy changes
}

export interface ConsentAuditEntry extends ConsentRecord {
  userId: string;
  action: 'grant' | 'revoke';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Bump this when privacy policy or consent copy changes. */
export const CONSENT_VERSION = '1.0.0';

/** All categories that must be explicitly presented at onboarding. */
export const REQUIRED_ONBOARDING_CONSENTS: ConsentCategory[] = [
  'privacyPolicy',
  'termsOfService',
];

/** Optional consents shown at onboarding (no pre-check). */
export const OPTIONAL_ONBOARDING_CONSENTS: ConsentCategory[] = [
  'notifications',
  'moodTracking',
  'journaling',
  'aiChat',
  'analytics',
];

// ---------------------------------------------------------------------------
// In-memory session cache
// ---------------------------------------------------------------------------

const _cache = new Map<ConsentCategory, ConsentRecord>();

// ---------------------------------------------------------------------------
// Core service
// ---------------------------------------------------------------------------

export const consentService = {
  /**
   * Load all consent records for the current user from Supabase.
   * Call this once after login.
   */
  async load(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('category, granted, timestamp, version')
      .eq('user_id', userId);

    if (error) {
      console.warn('[consentService] Failed to load consents:', error.message);
      return;
    }

    _cache.clear();
    for (const row of data ?? []) {
      _cache.set(row.category as ConsentCategory, {
        category: row.category,
        granted: row.granted,
        timestamp: row.timestamp,
        version: row.version,
      });
    }
  },

  /**
   * Returns true if the user has an active grant for this category.
   */
  has(category: ConsentCategory): boolean {
    return _cache.get(category)?.granted === true;
  },

  /**
   * Grant consent for a category. Writes to Supabase and updates cache.
   */
  async grant(userId: string, category: ConsentCategory): Promise<void> {
    const record: ConsentRecord = {
      category,
      granted: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    await _upsertConsent(userId, record, 'grant');
    _cache.set(category, record);
  },

  /**
   * Revoke consent for a category. Writes to Supabase and updates cache.
   */
  async revoke(userId: string, category: ConsentCategory): Promise<void> {
    const record: ConsentRecord = {
      category,
      granted: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };

    await _upsertConsent(userId, record, 'revoke');
    _cache.set(category, record);
  },

  /**
   * Returns all current consent records for display in settings.
   */
  all(): ConsentRecord[] {
    return Array.from(_cache.values());
  },

  /**
   * Returns true if all required onboarding consents have been granted.
   */
  hasCompletedOnboarding(): boolean {
    return REQUIRED_ONBOARDING_CONSENTS.every((c) => this.has(c));
  },

  /**
   * Clear in-memory cache on logout.
   */
  clear(): void {
    _cache.clear();
  },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _upsertConsent(
  userId: string,
  record: ConsentRecord,
  action: 'grant' | 'revoke'
): Promise<void> {
  // Upsert current consent state
  const { error: upsertError } = await supabase
    .from('user_consents')
    .upsert(
      {
        user_id: userId,
        category: record.category,
        granted: record.granted,
        timestamp: record.timestamp,
        version: record.version,
      },
      { onConflict: 'user_id,category' }
    );

  if (upsertError) {
    console.warn('[consentService] Upsert failed:', upsertError.message);
  }

  // Append to audit log (non-blocking)
  supabase
    .from('consent_audit_log')
    .insert({
      user_id: userId,
      category: record.category,
      action,
      granted: record.granted,
      timestamp: record.timestamp,
      version: record.version,
    })
    .then(({ error }) => {
      if (error) console.warn('[consentService] Audit log failed:', error.message);
    });
}

/**
 * SQL to create the required tables (run in Supabase SQL editor):
 *
 * CREATE TABLE user_consents (
 *   user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   category   text NOT NULL,
 *   granted    boolean NOT NULL,
 *   timestamp  timestamptz NOT NULL,
 *   version    text NOT NULL,
 *   PRIMARY KEY (user_id, category)
 * );
 *
 * ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users manage own consents" ON user_consents
 *   USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 *
 * CREATE TABLE consent_audit_log (
 *   id         bigserial PRIMARY KEY,
 *   user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   category   text NOT NULL,
 *   action     text NOT NULL,  -- 'grant' | 'revoke'
 *   granted    boolean NOT NULL,
 *   timestamp  timestamptz NOT NULL,
 *   version    text NOT NULL
 * );
 *
 * ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users read own audit log" ON consent_audit_log
 *   FOR SELECT USING (auth.uid() = user_id);
 * -- Inserts done via service role key from server only.
 */
