/**
 * Worker authentication middleware.
 *
 * Strategy chain, tried in order against the `Authorization: Bearer <token>`
 * value:
 *   1. Supabase JWT  → per-user auth. When the bearer looks like a JWT and
 *      SUPABASE_URL is configured, verify it (asymmetric via the project JWKS,
 *      or HS256 when SUPABASE_JWT_SECRET is set) and return a `user` principal.
 *   2. Shared token  → coarse client auth matching the PIPER_TOKEN pattern.
 *      Constant-time compare against SEKRET_CLIENT_TOKEN.
 *
 * The client contract never changed across the token→JWT rollout: callers
 * always send a bearer token. Authenticated users now send their Supabase
 * access token; guests/unauthenticated flows can still send the shared token.
 * When neither credential is configured server-side, auth fails open so local
 * dev and pre-rollout deployments keep working.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

export interface AuthEnv {
  /**
   * Shared client token. When unset (and JWT auth is not configured),
   * authentication is DISABLED (fail-open). Set to enforce:
   *   wrangler secret put SEKRET_CLIENT_TOKEN --name bip
   */
  SEKRET_CLIENT_TOKEN?: string;
  /** Supabase project URL, used to derive the JWKS URL and expected issuer. */
  SUPABASE_URL?: string;
  /**
   * Optional HS256 signing secret for legacy (symmetric) Supabase projects.
   * Leave unset for projects using asymmetric JWTs (the JWKS is used instead).
   *   wrangler secret put SUPABASE_JWT_SECRET --name bip
   */
  SUPABASE_JWT_SECRET?: string;
}

export type Principal =
  | { kind: 'shared-token' }
  | { kind: 'user'; userId: string };

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

/** A JWT is three non-empty base64url segments separated by dots. */
export function looksLikeJwt(token: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

// Cache the remote JWKS per issuer for the lifetime of the isolate. jose also
// caches keys internally and handles rotation/cooldown on each resolver.
const jwksCache = new Map<string, JWTVerifyGetKey>();

function getJwks(supabaseUrl: string): JWTVerifyGetKey {
  const jwksUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
  let jwks = jwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
  }
  return jwks;
}

/**
 * Verify a Supabase-issued JWT. Returns its payload on success, or null when it
 * cannot be verified (bad signature, expired, wrong issuer/audience, etc.).
 */
async function verifySupabaseJwt(token: string, env: AuthEnv): Promise<JWTPayload | null> {
  const supabaseUrl = env.SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseUrl) return null;

  const options = {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: 'authenticated',
  };
  try {
    if (env.SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, options);
      return payload;
    }
    const { payload } = await jwtVerify(token, getJwks(supabaseUrl), options);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Authenticate a request against the strategy chain (see file header).
 *
 * Enforcement is gated on SEKRET_CLIENT_TOKEN exactly as in the shared-token
 * release: while it is unset the Worker fails open so existing token-less
 * builds keep working (SUPABASE_URL being set for JWKS does NOT by itself turn
 * enforcement on). A valid Supabase JWT is always honored as a per-user
 * identity regardless of enforcement, which improves rate-limit keying.
 */
export async function authenticate(request: Request, env: AuthEnv): Promise<AuthResult> {
  const enforced = Boolean(env.SEKRET_CLIENT_TOKEN?.trim());
  const token = extractBearer(request);

  // Prefer a verified Supabase JWT identity whenever one is presented.
  if (token && env.SUPABASE_URL && looksLikeJwt(token)) {
    const payload = await verifySupabaseJwt(token, env);
    if (payload?.sub) return { ok: true, principal: { kind: 'user', userId: payload.sub } };
    // JWT present but invalid: a hard reject when enforcing; otherwise fall
    // through to fail-open so a stale token can't break the pre-rollout app.
    if (enforced) return { ok: false, status: 403, error: 'invalid token' };
    return { ok: true, principal: { kind: 'shared-token' } };
  }

  // Not a (valid) JWT — shared-token path.
  if (!enforced) return { ok: true, principal: { kind: 'shared-token' } };
  if (!token) return { ok: false, status: 401, error: 'missing bearer token' };

  const configured = env.SEKRET_CLIENT_TOKEN!.trim();
  if (timingSafeEqual(token, configured)) return { ok: true, principal: { kind: 'shared-token' } };
  return { ok: false, status: 403, error: 'invalid token' };
}
