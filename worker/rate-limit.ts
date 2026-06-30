export type ProtectedRoute = 'reply' | 'voice' | 'transcribe';

export interface RateLimitBinding {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
  RATE_LIMIT_REPLY: RateLimitBinding;
  RATE_LIMIT_VOICE: RateLimitBinding;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

function bindingForRoute(env: RateLimitEnv, route: ProtectedRoute): RateLimitBinding {
  return route === 'reply' ? env.RATE_LIMIT_REPLY : env.RATE_LIMIT_VOICE;
}

function clientKey(request: Request, route: ProtectedRoute): string {
  const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
  return `${route}:${ip}`;
}

/**
 * Current keys use route + client IP. Phase 2 can replace the IP portion with
 * a verified Supabase user ID without changing route callers.
 */
export async function checkRateLimit(
  request: Request,
  env: RateLimitEnv,
  route: ProtectedRoute,
): Promise<RateLimitResult> {
  const result = await bindingForRoute(env, route).limit({ key: clientKey(request, route) });
  return { allowed: result.success, retryAfterSeconds: 60 };
}
