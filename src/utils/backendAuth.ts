/**
 * src/utils/backendAuth.ts
 *
 * Resolves the bearer credential for Cloudflare Worker backend calls.
 *
 * Preference order:
 *   1. The signed-in user's Supabase access token (per-user JWT auth) — the
 *      Worker verifies it against the Supabase JWKS and keys rate limits by user.
 *   2. The shared client token (EXPO_PUBLIC_BACKEND_TOKEN) for guests /
 *      unauthenticated flows, or when no session exists.
 *
 * This is the single place the token policy lives; every call site uses
 * backendAuthHeaders(). Kept separate from env.ts to avoid a circular import
 * (this module depends on the Supabase client, which depends on env.ts).
 */
import { getSupabase } from './supabase';
import { BACKEND_TOKEN, backendHeaders } from './env';

/** The current user's Supabase access token, or the shared token as fallback. */
export async function resolveBackendToken(): Promise<string> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) return accessToken;
    }
  } catch {
    // Session lookup failed (storage error, etc.) — fall back to shared token.
  }
  return BACKEND_TOKEN;
}

/** Backend request headers with the resolved bearer credential attached. */
export async function backendAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  return backendHeaders(await resolveBackendToken(), extra);
}
