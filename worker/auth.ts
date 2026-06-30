export interface AuthEnv {
  BIP_CLIENT_TOKEN?: string;
  ALLOW_INSECURE_LOCAL_DEV?: string;
}

export type AuthResult =
  | { ok: true; mode: 'token' | 'local-dev' }
  | { ok: false; status: 401 | 503; error: 'unauthorized' | 'worker_auth_not_configured' };

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBytes = new TextEncoder().encode(actual);
  const expectedBytes = new TextEncoder().encode(expected);
  const length = Math.max(actualBytes.length, expectedBytes.length);
  let mismatch = actualBytes.length ^ expectedBytes.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (actualBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }

  return mismatch === 0;
}

/**
 * Phase 1: shared bearer token.
 * Phase 2: replace this implementation with verified Supabase JWT claims while
 * keeping callers and route shapes unchanged.
 *
 * Missing auth fails closed unless local development is explicitly enabled by
 * ALLOW_INSECURE_LOCAL_DEV=true. Never set that variable on a deployed Worker.
 */
export function authenticateRequest(request: Request, env: AuthEnv): AuthResult {
  const expectedToken = env.BIP_CLIENT_TOKEN?.trim();

  if (!expectedToken) {
    if (env.ALLOW_INSECURE_LOCAL_DEV === 'true') {
      return { ok: true, mode: 'local-dev' };
    }
    return { ok: false, status: 503, error: 'worker_auth_not_configured' };
  }

  const authorization = request.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const suppliedToken = match?.[1]?.trim() ?? '';

  if (!suppliedToken || !constantTimeEqual(suppliedToken, expectedToken)) {
    return { ok: false, status: 401, error: 'unauthorized' };
  }

  return { ok: true, mode: 'token' };
}
