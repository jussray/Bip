/**
 * src/utils/env.ts
 * Se'kret Bip — Environment variable validation (canonical location)
 *
 * Rules:
 *   - Only EXPO_PUBLIC_* vars are allowed in client code.
 *   - OPENAI_API_KEY lives ONLY in the Cloudflare Worker.
 *   - service_role keys must NEVER appear here.
 *
 * Call validateEnv() once at app startup (app/_layout.tsx).
 */

const env = process.env as Record<string, string | undefined>;

// ── Resolved values ──────────────────────────────────────────────────────────
export const SUPABASE_URL  = env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
export const SUPABASE_ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const BACKEND_URL   = env.EXPO_PUBLIC_BACKEND_URL       ?? '';

// ── Flags ────────────────────────────────────────────────────────────────────
export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const isBackendReady  = Boolean(BACKEND_URL);

const isDev = process.env.NODE_ENV === 'development';

/**
 * validateEnv()
 *
 * Missing SUPABASE vars  → cloud sync disabled, AsyncStorage only.
 * Missing BACKEND_URL    → HARD ERROR logged; AI replies will silently fail
 *                          mid-chat without it. Fix before shipping to testers.
 * Banned keys present    → security violation logged.
 */
export function validateEnv(): void {
  // ── Required for cloud sync ──────────────────────────────────────────────
  if (!SUPABASE_URL) {
    console.warn(
      "[Se'kret Bip] ⚠️  EXPO_PUBLIC_SUPABASE_URL is not set.\n" +
      '   Cloud sync is disabled. Add it to .env.local (see .env.example).'
    );
  }
  if (!SUPABASE_ANON) {
    console.warn(
      "[Se'kret Bip] ⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.\n" +
      '   Cloud sync is disabled. Add it to .env.local (see .env.example).'
    );
  }

  // ── Required for AI replies — hard error ────────────────────────────────
  if (!BACKEND_URL) {
    console.error(
      "[Se'kret Bip] 🚨 EXPO_PUBLIC_BACKEND_URL is not set.\n" +
      "   Se'kret AI WILL silently drop all replies without this.\n" +
      '   Set it to your Cloudflare Worker URL after `wrangler deploy`.\n' +
      '   Example: EXPO_PUBLIC_BACKEND_URL=https://sekret-reply.<account>.workers.dev'
    );
  }

  // ── Security: banned keys must never reach the client ────────────────────
  const BANNED = ['OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE'];
  for (const key of BANNED) {
    if (env[key]) {
      console.error(
        `[Se'kret Bip] 🚨 SECURITY: "${key}" is present in client environment.\n` +
        '   This key must NEVER be in Expo, Vercel, or client code.\n' +
        '   Remove it immediately and rotate the secret.'
      );
    }
  }

  if (isDev && SUPABASE_URL && SUPABASE_ANON && BACKEND_URL) {
    console.log("[Se'kret Bip] ✅ All environment variables configured.");
  }
}
