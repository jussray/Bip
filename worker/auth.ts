/**
 * Worker authentication middleware.
 *
 * Today this enforces a shared client token (the same shape as the
 * PIPER_TOKEN check in services/piper-tts/server.py): the app sends
 * `Authorization: Bearer <token>` and the Worker compares it against the
 * SEKRET_CLIENT_TOKEN secret in constant time.
 *
 * The contract is deliberately strategy-shaped so Supabase JWT verification
 * can be added later WITHOUT changing the client API — clients keep sending a
 * bearer token; only the server-side verification swaps in. A future JWT
 * strategy returns a `{ kind: 'user', userId }` principal, which the rate
 * limiter already keys on.
 */

export interface AuthEnv {
  /**
   * Shared client token. When unset, authentication is DISABLED (fail-open)
   * so local dev and the pre-rollout deployment keep working unchanged. Set
   * the secret to enforce:
   *   wrangler secret put SEKRET_CLIENT_TOKEN --name bip
   */
  SEKRET_CLIENT_TOKEN?: string;
}

export type Principal =
  | { kind: 'shared-token' }
  | { kind: 'user'; userId: string }; // reserved for future Supabase-JWT auth

export type AuthResult =
  | { ok: true; principal: Principal }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Constant-time comparison of two equal-length strings. Avoids leaking how
 * much of the token matched via response timing. (Length itself is not
 * secret-sensitive here, so an early length check is acceptable.)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Pull the raw token out of an `Authorization: Bearer <token>` header. */
export function extractBearer(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Authenticate a request. Strategy chain — shared token only for now.
 *
 * To add Supabase JWT later: attempt JWT verification first (when the bearer
 * value parses as a JWT), returning `{ kind: 'user', userId }`; otherwise fall
 * back to this shared-token check. The signature stays async precisely so that
 * crypto-based verification can slot in without touching callers.
 */
export async function authenticate(request: Request, env: AuthEnv): Promise<AuthResult> {
  const configured = env.SEKRET_CLIENT_TOKEN?.trim();
  if (!configured) return { ok: true, principal: { kind: 'shared-token' } };

  const token = extractBearer(request);
  if (!token) return { ok: false, status: 401, error: 'missing bearer token' };
  if (timingSafeEqual(token, configured)) return { ok: true, principal: { kind: 'shared-token' } };
  return { ok: false, status: 403, error: 'invalid token' };
}
