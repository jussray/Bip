# bip-worker-guardian

Last reviewed: 2026-07-13

## Trigger

Any PR touching files in `worker/`, `wrangler.toml`, Cloudflare bindings, authenticated API behavior, AI/TTS runtime behavior, or production deployment verification.

## Canonical ownership

Read `DEPLOYMENT.md`, `docs/CLOUDFLARE_OWNERSHIP.md`, and the current `wrangler.toml` before changing deployment behavior.

- `sekret-backend` is the canonical backend Cloudflare Worker.
- `sekret-bip` is the canonical Cloudflare Pages frontend project.
- Cloudflare native Git integration deploys both from `main`.
- GitHub Actions verifies the exact deployed release and does not act as a second upload authority.

This skill guards the backend Worker and its boundary with the frontend. It must not infer deployment names from old branches, domains, or historical documentation.

FAIL if:

- backend API or business logic is moved into the Pages frontend;
- frontend routes or static assets are treated as Worker responsibilities without a documented reason;
- client code receives Worker secrets, service-role keys, provider credentials, or server-only shared secrets;
- a deployment change introduces a second competing production authority;
- exact-release verification is replaced with a stale check-state or retired release function.

## Verified Worker files

Verify paths before use, then expect the current Worker tree to include responsibilities such as:

```text
worker/
  observed-index.ts       configured observability entry point
  index.ts                runtime wrapper and request dispatch
  auth.ts                 JWT validation and auth helpers
  sekret-reply.ts         AI reply brain
  runtime-style.ts        canonical identity/style enforcement
  bridge-summary.ts       teen-to-parent summary generation
  bridge-summary-store.ts Bridge persistence boundary
  piper-tts.ts            TTS integration
  push-notifications.ts   push notification dispatch
  telemetry.ts            metadata-only telemetry helpers
  audit/                  audit persistence helpers
  config/                 Worker configuration
```

Repository truth overrides this snapshot.

## Core security rules

### JWT validation

Every authenticated endpoint must:

1. validate the JWT before protected data access;
2. derive user identity from the verified token, not the request body;
3. return 401 for missing, expired, or invalid authentication;
4. minimize response fields to the authorized use case.

Flag any handler that trusts a body-only user identifier for protected access.

### Service-role boundary

- Service-role access is for narrowly scoped elevated operations only.
- User-scoped reads must preserve a verified user boundary or perform an equivalent explicit authorization check.
- Flag any elevated query filtered only by a user-supplied identifier.
- The correct pattern is verified identity -> least-privilege query -> minimized response.

### AI reply and style runtime

Changes to AI reply, prompt, identity, or style code require heightened scrutiny:

- [ ] actor identity comes from trusted repository configuration;
- [ ] Se'kret remains a continuity presence rather than a selectable named companion;
- [ ] forbidden internal identities do not appear in user-visible text, speech, archives, notifications, or accessibility labels;
- [ ] user content is never treated as trusted system instruction;
- [ ] memory context excludes unauthorized identity or private content;
- [ ] safety guardrails remain applied after prompt changes;
- [ ] question-budget and deterministic repair behavior remain tested;
- [ ] telemetry remains metadata-only;
- [ ] model or voice changes update configuration and evidence.

### Bridge boundary

- [ ] only explicitly consented teen content is included;
- [ ] raw journal text is never returned to the parent client;
- [ ] summaries exclude unrelated private content and identity-bearing fields;
- [ ] revoked, expired, blocked, deleted, or unlinked relationships cannot generate or retrieve summaries;
- [ ] controlled rollout remains disabled until production two-account proof passes.

### Endpoint checklist

For every new or modified endpoint:

- [ ] authentication occurs before protected data access;
- [ ] unauthenticated requests fail closed;
- [ ] CORS is restricted appropriately;
- [ ] rate limiting is considered for AI, voice, and abuse-sensitive routes;
- [ ] logs exclude private content, credentials, and tokens;
- [ ] rollout and rollback are documented;
- [ ] tests cover positive and negative authorization paths.

## Deployment safety

- [ ] `wrangler.toml` still names Worker `sekret-backend` and points to the intended entry point.
- [ ] bindings match provisioned configuration and secrets.
- [ ] no binding is removed without caller verification.
- [ ] Cloudflare native Git integration remains the production authority.
- [ ] Pages project `sekret-bip` is verified separately from Worker deployment.
- [ ] exact-release verification checks the Worker build, deployed `release.json`, health endpoint, and production Playwright.
- [ ] retired Supabase `release-health` is never used as deployment evidence.
- [ ] if staging exists, validate there first; if it does not, document the real preview/test path instead of inventing one.

## Output

Return: `APPROVED` or `CHANGES REQUIRED`.

For required changes, include exact file, line, violated rule, and severity:

- CRITICAL: auth bypass, secret exposure, or private-data leak
- HIGH: missing validation, wrong deployment authority, or parent/teen boundary failure
- MEDIUM: stale configuration, missing evidence, or weak rollback/telemetry
