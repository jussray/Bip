/**
 * worker/rate-limit.ts
 *
 * Native Cloudflare Workers Rate Limiting binding helpers.
 *
 * Bindings (declared in wrangler.toml):
 *   RATE_LIMIT_REPLY  — AI companion/coach reply endpoints  (60 rpm per key)
 *   RATE_LIMIT_VOICE  — TTS synthesis + transcription       (20 rpm per key)
 *
 * Key design:
 *   Phase 1: key = CF-Connecting-IP + route.
 *            Every app install shares the same BIP_CLIENT_TOKEN, so keying by
 *            token alone would mean one user's burst blocks everyone.
 *   Phase 2 (TODO): replace or augment IP with verified Supabase user ID once
 *            JWT auth is in place. See buildRateLimitKey() — one change there.
 *
 * Usage:
 *   const limited = await checkRateLimit(request, env, 'reply');
 *   if (limited) return limited;   // limited is a 429 Response
 */

/** CF native rate-limit binding shape (subset we use). */
export interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
  RATE_LIMIT_REPLY?: RateLimitBinding;
  RATE_LIMIT_VOICE?: RateLimitBinding;
}

export type RateLimitRoute = 'reply' | 'voice' | 'transcribe';

const ROUTE_BINDING: Record<RateLimitRoute, keyof RateLimitEnv> = {
  reply:      'RATE_LIMIT_REPLY',
  voice:      'RATE_LIMIT_VOICE',
  transcribe: 'RATE_LIMIT_VOICE', // shares the stricter voice budget
};

/**
 * Build the rate-limit key.
 * Exported so tests can assert the structure and Phase 2 can inject userId.
 */
export function buildRateLimitKey(
  request: Request,
  route: RateLimitRoute,
  userId?: string,
): string {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  // Phase 2: prefer verified user ID over IP when available.
  const principal = userId ?? ip;
  return `${route}:${principal}`;
}

function tooManyRequestsJson(route: RateLimitRoute): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      detail: `Rate limit exceeded for /${route} endpoint. Please slow down.`,
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        'Content-Type':                 'application/json',
        'Retry-After':                  '60',
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}

/**
 * Check the rate limit for a request.
 *
 * Returns null if allowed, or a ready 429 Response if rejected.
 * If the binding is not configured (local dev), the check is skipped.
 */
export async function checkRateLimit(
  request: Request,
  env: RateLimitEnv,
  route: RateLimitRoute,
  userId?: string,
): Promise<Response | null> {
  const binding = env[ROUTE_BINDING[route]];
  if (!binding) return null; // not configured → allow

  const key = buildRateLimitKey(request, route, userId);
  const result = await binding.limit({ key });

  return result.success ? null : tooManyRequestsJson(route);
}
