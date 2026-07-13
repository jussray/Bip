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

function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

// These are public browser credentials, not server secrets. Supabase publishable
// keys are intended for web/mobile clients and remain constrained by Auth + RLS.
// Cloudflare/Expo environment variables still override these defaults so the
// project can rotate or target another Supabase environment without a code edit.
const PRODUCTION_SUPABASE_URL = 'https://tbsevonvegdnlyjgplmm.supabase.co';
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_F57sxdjeDJGZuIZdix_UKg_zGKDvNTk';

// ── Resolved values ──────────────────────────────────────────────────────────
export const SUPABASE_URL =
  clean(env.EXPO_PUBLIC_SUPABASE_URL)
  || PRODUCTION_SUPABASE_URL;

// Prefer the modern publishable-key variable, retain the legacy env name for
// existing EAS/Cloudflare configuration, then fall back to the production-safe
// public key so a Pages build cannot silently disable Auth and cloud sync.
export const SUPABASE_ANON =
  clean(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  || clean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  || PRODUCTION_SUPABASE_PUBLISHABLE_KEY;

export const BACKEND_URL   = clean(env.EXPO_PUBLIC_BACKEND_URL);
/**
 * Shared client token for the Cloudflare Worker backend. Sent as
 * `Authorization: Bearer <token>` by backendHeaders(). Safe to ship in the
 * client bundle (it is a coarse abuse speed-bump, not a per-user credential);
 * the Worker enforces it only when its matching SEKRET_CLIENT_TOKEN secret is
 * set. Leave unset and the app calls the backend unauthenticated as before.
 */
export const BACKEND_TOKEN = clean(env.EXPO_PUBLIC_BACKEND_TOKEN);

/**
 * Canonical headers for Worker backend calls. Always JSON; attaches `token` as
 * a bearer credential when non-empty. Defaults to the shared BACKEND_TOKEN, but
 * callers pass the user's Supabase access token when signed in — see
 * backendAuthHeaders() in ./backendAuth. Kept synchronous and token-agnostic so
 * the token-resolution policy lives in one place.
 */
export function backendHeaders(token: string = BACKEND_TOKEN, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ── Flags ────────────────────────────────────────────────────────────────────
export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const isBackendReady  = Boolean(BACKEND_URL);

const isDev = process.env.NODE_ENV === 'development';

/**
 * validateEnv()
 *
 * Missing SUPABASE vars  → bundled public production defaults keep Auth and
 *                          cloud sync available; deployment vars may override.
 * Missing BACKEND_URL    → AI replies fall back to pre-written companion
 *                          replies (see fallbackReply() in ./api). Fine for
 *                          local dev; deploy the Worker before real launch.
 * Banned keys present    → security violation logged.
 *
 * Note: missing-config cases use console.warn, not console.error — in Expo
 * web dev, console.error triggers a full-screen LogBox overlay that blocks
 * all interaction with the app underneath it.
 */
export function validateEnv(): void {
  // ── Required for cloud sync ──────────────────────────────────────────────
  if (!SUPABASE_URL) {
    console.warn(
      "[Se'kret Bip] ⚠️  Supabase URL is unavailable.\n" +
      '   Cloud sync is disabled. Configure EXPO_PUBLIC_SUPABASE_URL.'
    );
  }
  if (!SUPABASE_ANON) {
    console.warn(
      "[Se'kret Bip] ⚠️  Supabase publishable key is unavailable.\n" +
      '   Cloud sync is disabled. Configure EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  // ── Backend URL: falls back to pre-written companion replies ────────────
  if (!BACKEND_URL) {
    console.warn(
      "[Se'kret Bip] ℹ️  EXPO_PUBLIC_BACKEND_URL is not set.\n" +
      "   Se'kret AI is running in fallback mode (pre-written replies).\n" +
      '   Set it to your Cloudflare Worker URL after `wrangler deploy` for live AI replies.\n' +
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
