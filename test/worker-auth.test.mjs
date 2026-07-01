/**
 * Worker auth + rate limiting: shared-token gate, CORS, and the contract
 * that lets Supabase JWT replace the token later without client changes.
 *
 * Follows the repo convention (see worker-safety.test.mjs): assert structural
 * guarantees on source text, and run behavioral checks against logic
 * reconstructed from the real source so the tests track the shipping code.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync(new URL('../worker/auth.ts', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');

// ─── Reconstruct the live Bearer-extraction regex from source ────────────────
const bearerLine = auth.split('\n').find((l) => l.includes('Bearer') && l.includes('exec'));
assert.ok(bearerLine, 'extractBearer must use a Bearer regex');
const rawRegex = bearerLine.replace(/^.*=\s*/, '').replace(/\.exec.*$/, '').trim();
const BEARER_RE = new Function(`return ${rawRegex}`)();

test('Bearer regex extracts the token, case-insensitive, trims whitespace', () => {
  assert.equal(BEARER_RE.exec('Bearer abc123')?.[1].trim(), 'abc123');
  assert.equal(BEARER_RE.exec('bearer xyz')?.[1].trim(), 'xyz');
  assert.equal(BEARER_RE.exec('Bearer   spaced  ')?.[1].trim(), 'spaced');
  assert.equal(BEARER_RE.exec('Basic abc123'), null);
  assert.equal(BEARER_RE.exec(''), null);
});

// ─── Reconstruct timingSafeEqual and verify it is constant-time-shaped ───────
test('timingSafeEqual matches equal strings and rejects mismatches', () => {
  const start = auth.indexOf('export function timingSafeEqual');
  const slice = auth.slice(start, auth.indexOf('\n}', start) + 2);
  const body = slice.replace(/export function timingSafeEqual\([^)]*\)\s*:\s*boolean\s*/, '');
  const timingSafeEqual = new Function('a', 'b', body.replace(/^\{/, '').replace(/\}$/, ''));
  assert.equal(timingSafeEqual('secret-token', 'secret-token'), true);
  assert.equal(timingSafeEqual('secret-token', 'secret-tokeX'), false);
  assert.equal(timingSafeEqual('short', 'longer-value'), false);
  // Accumulates a mismatch flag rather than short-circuiting on first diff.
  assert.ok(/mismatch \|=|\^=/.test(slice), 'must XOR-accumulate, not early-return per char');
});

// ─── Structural contract of authenticate() ───────────────────────────────────
test('auth is fail-open when SEKRET_CLIENT_TOKEN is unset', () => {
  assert.ok(
    /if \(!configured\) return \{ ok: true/.test(auth),
    'authenticate must return ok:true when no token is configured',
  );
});

test('auth returns 401 for missing token and 403 for invalid token', () => {
  assert.ok(/status: 401, error: 'missing bearer token'/.test(auth), '401 on missing');
  assert.ok(/status: 403, error: 'invalid token'/.test(auth), '403 on invalid');
});

test('Principal type reserves a user kind for future JWT auth', () => {
  assert.ok(/kind: 'user'; userId: string/.test(auth), 'user principal reserved');
});

// ─── Worker wiring: gate runs before delegating; rate limit + CORS ───────────
test('index.ts authenticates POST /api/* before handling', () => {
  assert.ok(/path\.includes\('\/api\/'\)/.test(index), 'gates /api/ POST routes');
  assert.ok(/await authenticate\(request, env\)/.test(index), 'awaits authenticate');
  assert.ok(/if \(!auth\.ok\) return json\(\{ error: auth\.error \}, auth\.status/.test(index),
    'rejects failed auth with its status');
});

test('rate limiter keys by user when available, else client IP, and 429s', () => {
  assert.ok(/CF-Connecting-IP/.test(index), 'keys on client IP');
  assert.ok(/principal\.kind === 'user' \? `user:\$\{principal\.userId\}`/.test(index),
    'prefers user key when authenticated');
  assert.ok(/rate limit exceeded' \}, 429/.test(index), 'returns 429 when over limit');
  assert.ok(/if \(!limiter\) return null/.test(index), 'no-op when binding unconfigured');
});

test('CORS allows the Authorization header and is origin-configurable', () => {
  assert.ok(/'Access-Control-Allow-Headers': 'Content-Type, Authorization'/.test(index),
    'Authorization must be allowed for the bearer header');
  assert.ok(/env\.ALLOWED_ORIGINS/.test(index), 'origin allowlist is configurable');
  assert.ok(/OPTIONS'\) return new Response\(null, \{ status: 204, headers: cors \}\)/.test(index),
    'preflight uses computed CORS headers');
});

test('disallowed origins are rejected before auth/delegation (simple-request bypass)', () => {
  // The rejection must run BEFORE the auth gate and route delegation, else a
  // non-preflighted simple POST could read the delegated wildcard response.
  const rejectAt = index.indexOf('const blocked = originRejected(');
  const authAt = index.indexOf('await authenticate(request, env)');
  const delegateAt = index.indexOf('return worker.fetch(request');
  assert.ok(rejectAt > 0, 'originRejected is wired into fetch');
  assert.ok(rejectAt < authAt, 'origin check runs before auth');
  assert.ok(rejectAt < delegateAt, 'origin check runs before delegation');
  assert.ok(/origin not allowed' \}, 403/.test(index), 'returns 403 for disallowed origin');
  // No-Origin requests (native apps / same-origin) must pass through.
  assert.ok(/if \(!origin \|\| allowed\.includes\(origin\)\) return null/.test(index),
    'requests without an Origin header are not blocked');
});
