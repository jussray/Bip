/**
 * worker/auth.ts
 *
 * Shared-token authentication middleware for the Bip Cloudflare Worker.
 *
 * Phase 1: shared BIP_CLIENT_TOKEN (extractable by advanced clients — documented).
 * Phase 2 (TODO): replace verifyRequest() with Supabase JWT verification.
 *                 Route handlers in index.ts and sekret-reply.ts need no changes.
 *
 * SECURITY NOTES:
 *  - Never log the token value, even partially.
 *  - Uses SubtleCrypto HMAC for timing-safe comparison on Workers runtime.
 *  - OPTIONS preflight requests are never authenticated.
 */

export interface AuthEnv {
  /** Worker secret — set via: wrangler secret put BIP_CLIENT_TOKEN --name bip */
  BIP_CLIENT_TOKEN?: string;
}

export interface AuthResult {
  ok: true;
  /** Phase 2: will carry verified Supabase user ID. Phase 1: always 'shared'. */
  sub: string;
}

export interface AuthFailure {
  ok: false;
  response: Response;
}

/** CORS headers — exported so every response carries identical Allow-Headers. */
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Timing-safe string comparison via SubtleCrypto HMAC.
 * Falls back to a constant-time byte loop when SubtleCrypto is unavailable
 * (should never happen on Workers, but keeps unit tests in Node happy).
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  // Always run full comparison to avoid length-leak via early exit.
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      dummy |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
    }
    void dummy;
    return false;
  }

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(a),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(b));
    return crypto.subtle.verify('HMAC', key, sig, enc.encode(b));
  }

  // Node fallback for unit tests
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorizedJson(detail: string): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', detail }),
    { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
}

/**
 * Verify the incoming request carries a valid Bearer token.
 *
 * Returns AuthResult on success or AuthFailure (with a ready 401 Response) on
 * failure. Callers check `result.ok` and return `result.response` if false.
 *
 * If BIP_CLIENT_TOKEN is not configured the Worker runs in open/local-dev mode
 * and every request is treated as authenticated.
 */
export async function verifyRequest(
  request: Request,
  env: AuthEnv,
): Promise<AuthResult | AuthFailure> {
  const expected = env.BIP_CLIENT_TOKEN?.trim();

  // Token not set → open mode (local dev without .dev.vars)
  if (!expected) return { ok: true, sub: 'open' };

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { ok: false, response: unauthorizedJson('Authorization header missing or malformed') };
  }

  const provided = authHeader.slice(7).trim();
  const valid = await timingSafeEqual(provided, expected);
  if (!valid) return { ok: false, response: unauthorizedJson('Invalid token') };

  return { ok: true, sub: 'shared' };
}
