import { getSupabase } from '@/utils/supabase';

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
  timestamp: string;
  version: string;
}

export interface ConsentAuditEntry extends ConsentRecord {
  userId: string;
  action: 'grant' | 'revoke';
}

export const CONSENT_VERSION = '1.0.0';

export const REQUIRED_ONBOARDING_CONSENTS: ConsentCategory[] = [
  'privacyPolicy',
  'termsOfService',
];

export const OPTIONAL_ONBOARDING_CONSENTS: ConsentCategory[] = [
  'notifications',
  'moodTracking',
  'journaling',
  'aiChat',
  'analytics',
];

const cache = new Map<ConsentCategory, ConsentRecord>();

function client() {
  return getSupabase();
}

export const consentService = {
  async load(userId: string): Promise<void> {
    const supabase = client();
    if (!supabase) {
      cache.clear();
      return;
    }

    const { data, error } = await supabase
      .from('user_consents')
      .select('category, granted, timestamp, version')
      .eq('user_id', userId);

    if (error) {
      console.warn('[consentService] Failed to load consents:', error.message);
      return;
    }

    cache.clear();
    for (const row of data ?? []) {
      cache.set(row.category as ConsentCategory, {
        category: row.category as ConsentCategory,
        granted: Boolean(row.granted),
        timestamp: String(row.timestamp),
        version: String(row.version),
      });
    }
  },

  has(category: ConsentCategory): boolean {
    return cache.get(category)?.granted === true;
  },

  async grant(userId: string, category: ConsentCategory): Promise<void> {
    const record: ConsentRecord = {
      category,
      granted: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    await upsertConsent(userId, record, 'grant');
    cache.set(category, record);
  },

  async revoke(userId: string, category: ConsentCategory): Promise<void> {
    const record: ConsentRecord = {
      category,
      granted: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    await upsertConsent(userId, record, 'revoke');
    cache.set(category, record);
  },

  all(): ConsentRecord[] {
    return Array.from(cache.values());
  },

  hasCompletedOnboarding(): boolean {
    return REQUIRED_ONBOARDING_CONSENTS.every(category => this.has(category));
  },

  clear(): void {
    cache.clear();
  },
};

async function upsertConsent(
  userId: string,
  record: ConsentRecord,
  action: 'grant' | 'revoke',
): Promise<void> {
  const supabase = client();
  if (!supabase) {
    console.warn('[consentService] Supabase is not configured; consent was not persisted.');
    return;
  }

  const { error: upsertError } = await supabase
    .from('user_consents')
    .upsert({
      user_id: userId,
      category: record.category,
      granted: record.granted,
      timestamp: record.timestamp,
      version: record.version,
    }, { onConflict: 'user_id,category' });

  if (upsertError) {
    console.warn('[consentService] Upsert failed:', upsertError.message);
    return;
  }

  void supabase
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
