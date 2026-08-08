import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync('security/firewall-v10.policy.json', 'utf8'));
const wrangler = readFileSync('wrangler.toml', 'utf8');
const auth = readFileSync('worker/auth.ts', 'utf8');
const entry = readFileSync('worker/voice-entry.ts', 'utf8');
const failures = [];

function require(condition, message) {
  if (!condition) failures.push(message);
}

require(policy.version === '10', 'policy version must be 10');
require(policy.repository === 'jussray/Sekret-Bip', 'policy must target jussray/Sekret-Bip');
require(policy.activationStage === 'policy-ci-only', 'production activation must remain CI-only until live evidence is reviewed');
require(policy.cloudflare?.primaryHosts?.includes('sekretbip.net'), 'policy must include sekretbip.net');
require(policy.cloudflare?.primaryHosts?.includes('api.sekretbip.net'), 'policy must include api.sekretbip.net');
require(policy.cloudflare?.activeWorker === 'sekret-backend', 'active Worker must be sekret-backend');
require(policy.controls?.auth?.failClosed === true, 'auth must fail closed');
require(policy.controls?.auth?.tokenlessProductionAccess === 'forbidden', 'token-less production access must be forbidden');
require(policy.controls?.rateLimiting?.failureMode === 'fail-closed-retryable', 'rate-limit errors must fail closed with a recovery path');
require(policy.controls?.productDesign?.legitimateUsersGetRecoveryPath === true, 'blocked users need a recovery path');
require(policy.controls?.productDesign?.noMisleadingConnectedOrProtectedClaims === true, 'security UI must not overclaim protection');
require(policy.activationGates?.repositoryTruthGreen === true, 'repository truth must gate activation');
require(policy.activationGates?.productDesignPlaywrightGreen === true, 'Playwright must gate activation');
require(policy.activationGates?.cloudflareSecurityEventsReviewed === true, 'Cloudflare Security Events review must gate block mode');
require(policy.activationGates?.productionBlockModeAutomatic === false, 'production block mode must not auto-enable');

const expectedRoutes = new Set([
  '/api/sekret/reply',
  '/api/sekret/voice',
  '/api/sekret/transcribe',
  '/api/bridge/summary/generate',
]);
const routes = policy.controls?.rateLimiting?.routes ?? [];
require(routes.length === expectedRoutes.size, 'rate-limit policy must list exactly the repo-proven protected routes');
for (const route of routes) {
  require(expectedRoutes.has(route.match), `unexpected or guessed rate-limit route: ${route.match}`);
  require(Number.isInteger(route.limit) && route.limit > 0, `invalid limit for ${route.match}`);
  require(Number.isInteger(route.periodSeconds) && route.periodSeconds > 0, `invalid period for ${route.match}`);
}

require(/name = "sekret-backend"/.test(wrangler), 'wrangler Worker name must match policy');
require(/main = "worker\/voice-entry\.ts"/.test(wrangler), 'voice-entry.ts must remain the authoritative Worker front door');
require(/name = "SEKRET_RATE_LIMITER"/.test(wrangler), 'Cloudflare rate-limit binding must exist');
require(/pattern = "api\.sekretbip\.net"/.test(wrangler), 'api.sekretbip.net custom domain must remain bound');

require(/SEKRET_AUTH_MODE\?: 'required' \| 'dev-open'/.test(auth), 'auth mode contract is missing');
require(/const devOpen = env\.SEKRET_AUTH_MODE === 'dev-open'/.test(auth), 'dev-open must be explicit');
require(!/if \(!enforced\) return \{ ok: true/.test(auth), 'legacy implicit auth fail-open returned');
require(/status: 503, error: 'authentication unavailable'/.test(auth), 'auth misconfiguration must fail closed');

require(/const isProtectedApiPost = request\.method === 'POST' && path\.includes\('\/api\/'\)/.test(entry), 'front door must identify every POST API request');
require(/await authenticate\(request, env\)/.test(entry), 'front door must authenticate protected API requests');
require(/request protection temporarily unavailable/.test(entry), 'limiter outage must expose a recoverable blocked state');
require(/'Retry-After': '30'/.test(entry), 'limiter outage must provide retry guidance');
require(/SEKRET_RATE_LIMITER: undefined/.test(entry), 'delegated request must not be rate-limited twice');

if (failures.length) {
  console.error('Founder Shield verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Founder Shield verified against Se\'kret Bip runtime authority.');
