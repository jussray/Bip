/**
 * utils/env.ts
 * Se'kret Bip — Environment variable validation
 *
 * Rules:
 *   - Only EXPO_PUBLIC_* vars are allowed in client code.
 *   - OPENAI_API_KEY lives ONLY in the Cloudflare Worker (set via `wrangler secret put`).
 *   - service_role keys must NEVER appear here.
 *
 * Usage (call once at app startup, e.g. top of app/index.tsx):
 *   import { validateEnv } from '../utils/env';
 *   validateEnv();
 */

const env = process.env as Record<string, string | undefined>;

// ── Resolved values ──────────────────────────────────────────────────────────
export const SUPABASE_URL   = env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
export const SUPABASE_ANON  = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const BACKEND_URL    = env.EXPO_PUBLIC_BACKEND_URL   ?? '';

// ── Flags ────────────────────────────────────────────────────────────────────
export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const isBackendReady  = Boolean(BACKEND_URL);

/**
 * validateEnv()
 * Call once at startup. Logs clear warnings for missing vars.
 * Never throws — the app always boots (graceful degradation).
 *
 * - Missing SUPABASE vars  → cloud sync disabled, local AsyncStorage only.
 * - Missing BACKEND_URL    → Se'kret AI runs in local fallback mode.
 * - OPENAI_API_KEY present → security violation logged (must never reach client).
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // ── Required for cloud sync ──────────────────────────────────────────────
  if (!SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
    console.warn(
      "[Se'kret Bip] ⚠️  EXPO_PUBLIC_SUPABASE_URL is not set.\n" +
      '   Cloud sync is disabled. Add it to .env.local (see .env.example).'
    );
  }

  if (!SUPABASE_ANON) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    console.warn(
      "[Se'kret Bip] ⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.\n" +
      '   Cloud sync is disabled. Add it to .env.local (see .env.example).'
    );
  }

  // ── Optional — fallback mode if missing ──────────────────────────────────
  if (!BACKEND_URL) {
    warnings.push('EXPO_PUBLIC_BACKEND_URL');
    console.info(
      "[Se'kret Bip] ℹ️  EXPO_PUBLIC_BACKEND_URL is not set.\n" +
      "   Se'kret AI will run in local fallback mode (pre-written replies).\n" +
      '   Set it to your Cloudflare Worker URL after `wrangler deploy`.'
    );
  }

  // ── Security: these must NEVER appear in client code ─────────────────────
  // Presence here means a secret was accidentally embedded — fail loudly.
  const BANNED = [
    'OPENAI_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SERVICE_ROLE',
  ];

  for (const key of BANNED) {
    if (env[key]) {
      console.error(
        `[Se'kret Bip] 🚨 SECURITY: "${key}" is present in client environment.\n` +
        '   This key must NEVER be in Expo, Vercel, or client code.\n' +
        '   Remove it immediately and rotate the secret.'
      );
    }
  }

  if (__DEV__ && missing.length === 0 && warnings.length === 0) {
    console.log("[Se'kret Bip] ✅ All environment variables configured.");
  }
}
