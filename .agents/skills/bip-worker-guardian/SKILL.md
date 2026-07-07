# bip-worker-guardian

## Trigger
Any PR touching files in `worker/`, `wrangler.toml`, backend Worker bindings, or API deployment behavior.

## Canonical Ownership

Read `docs/CLOUDFLARE_OWNERSHIP.md` first.

- `bip` is the backend Cloudflare Worker, verified by `wrangler.toml`.
- `sekret` is the owner-confirmed Cloudflare Pages frontend project, configured through `CLOUDFLARE_PAGES_PROJECT_NAME`.

This skill guards the backend `bip` Worker. It does not treat the frontend Pages project as the API Worker.

FAIL if:
- backend API/business logic is moved into the `sekret` frontend deployment;
- frontend routes/static assets are treated as responsibilities of the `bip` Worker;
- a deployment change renames `bip` to `sekret` merely to match the domain;
- client code receives Worker secrets, service-role keys, or OpenAI credentials.

## Verified Worker Files (jussray/Bip worker/)
```
worker/
  index.ts              — main router / request dispatcher
  auth.ts               — JWT validation and auth helpers
  sekret-reply.ts       — AI character brain, highest-risk file
  bridge-summary.ts     — Bridge Summary generation (teen→parent)
  companion-curriculum.ts — companion learning/curriculum logic
  piper-tts.ts          — TTS integration
  push-notifications.ts — push notification dispatch
  observed-index.ts     — observability wrapper and configured entry point
  telemetry.ts          — telemetry helpers
  config/               — worker configuration
```

## Core Security Rules

### JWT Validation (`auth.ts`)
Every authenticated endpoint MUST:
1. Call the JWT validation logic in `worker/auth.ts` before any data access.
2. Extract `user_id` from the verified JWT — never from the request body.
3. Return 401 immediately if JWT is missing, expired, or invalid.

Flag any handler that reads user identity from the request body instead of the JWT.

### Service-Role Boundary
- The service-role key is for narrowly scoped elevated operations only.
- User-scoped reads must preserve and validate the user's JWT or perform an equivalent explicit authorization check.
- Flag any `supabaseAdmin.from(...)` call that returns data filtered only by a user-supplied ID from the request body.
- The correct pattern is verified JWT → derived user identity → least-privilege query → minimized response.

### `sekret-reply.ts` — Highest Risk File
Changes here require the most scrutiny:
- [ ] Persona/character injection only comes from trusted repository configuration.
- [ ] User message content is never treated as trusted system instruction.
- [ ] Memory context never includes identity or private content from unauthorized users.
- [ ] Safety guardrails remain applied after prompt changes.
- [ ] No new model or API key is added without updating the relevant example/config documentation.

### `bridge-summary.ts` — Teen→Parent Boundary
- [ ] Only content the teen explicitly consented to share is included.
- [ ] Raw journal text is never returned to the parent client.
- [ ] Summary responses exclude identity-bearing fields and unrelated private content.
- [ ] Revoked, expired, blocked, or unlinked relationships cannot generate or retrieve summaries.

### Endpoint Authentication Checklist
For every new or modified endpoint:
- [ ] Auth check occurs before protected data access.
- [ ] Unauthenticated requests receive 401.
- [ ] Authenticated CORS is restricted; no wildcard origin.
- [ ] Rate limiting is considered for AI and abuse-sensitive endpoints.
- [ ] Request and response logs exclude private content, credentials, and tokens.

## Deployment Safety
- [ ] `wrangler.toml` still names backend Worker `bip` and points to the intended entry point.
- [ ] Bindings match secrets/config actually provisioned for the backend Worker.
- [ ] No binding is removed without confirming it is unused.
- [ ] Backend deployment state is verified with `wrangler deployments list --name bip`.
- [ ] Frontend Pages deployment is verified separately; it is not evidence that `bip` deployed.
- [ ] If staging exists, validate there first. If it does not exist, document the available validation path instead of inventing one.

## Output
Return: APPROVED | CHANGES REQUIRED
- CHANGES REQUIRED: exact file + line + rule violated.
- Flag severity: CRITICAL (auth bypass/data leak) | HIGH (missing validation/ownership error) | MEDIUM (stale configuration/pattern).
