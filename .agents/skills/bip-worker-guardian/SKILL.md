# bip-worker-guardian

## Trigger
Any PR touching files in `worker/` or `wrangler.toml`.

## Verified Worker Files (jussray/Bip worker/)
```
worker/
  index.ts              — main router / request dispatcher
  auth.ts               — JWT validation and auth helpers
  sekret-reply.ts       — AI character brain (85KB, highest-risk file)
  bridge-summary.ts     — Bridge Summary generation (teen→parent)
  companion-curriculum.ts — companion learning/curriculum logic
  piper-tts.ts          — TTS integration
  push-notifications.ts — push notification dispatch
  observed-index.ts     — observability wrapper
  telemetry.ts          — telemetry helpers
  config/               — worker configuration
```

## Core Security Rules

### JWT Validation (auth.ts)
Every authenticated endpoint MUST:
1. Call the JWT validation logic in `worker/auth.ts` before any data access
2. Extract `user_id` from the verified JWT — never from the request body
3. Return 401 immediately if JWT is missing, expired, or invalid

Flag any handler that reads user identity from the request body instead of the JWT.

### Service-Role Boundary
- The service-role key is for admin operations only (e.g., writing system records)
- User-scoped reads (fetching a user's own data) MUST use the user's JWT
- Flag any `supabaseAdmin.from(...)` call that returns data filtered only by a user-supplied ID from the request body
- The correct pattern: verify JWT → extract `auth.uid()` → use that as the filter

### sekret-reply.ts — Highest Risk File
This is the AI brain (85KB). Changes here require the most scrutiny:
- [ ] Persona/character injection only happens from `constants/bip_voice.ts` — never from user input
- [ ] User message content is never interpolated directly into the system prompt
- [ ] Memory context passed to AI never includes `author_user_id` or PII from other users
- [ ] Safety guardrails from `constants/guardrails.ts` are still applied after any prompt changes
- [ ] No new model or API key added without updating `.dev.vars.example`

### bridge-summary.ts — Teen→Parent Boundary
This file generates summaries shared with parents. Extra scrutiny required:
- [ ] Only content the teen has explicitly consented to share is included
- [ ] No raw journal text included without consent flag check
- [ ] Summary does not include `author_user_id` or any PII beyond what is consent-scoped

### Endpoint Authentication Checklist
For every new or modified endpoint in `worker/index.ts`:
- [ ] Auth check is the FIRST operation (before any DB call)
- [ ] 401 returned for unauthenticated requests — no default fallback to anonymous access
- [ ] CORS headers are set correctly — no wildcard `*` on authenticated endpoints
- [ ] Rate limiting considered for endpoints called by AI loops

### Deployment Safety
- [ ] `wrangler.toml` bindings match secrets actually configured in Cloudflare dashboard
- [ ] No `wrangler.toml` edit removes an existing binding without confirming it is unused
- [ ] Staging deploy tested before production deploy (per DEPLOYMENT.md)

## Output
Return: APPROVED | CHANGES REQUIRED
- CHANGES REQUIRED: exact file + line + rule violated
- Flag severity: CRITICAL (auth bypass, data leak) | HIGH (missing validation) | MEDIUM (style/pattern)
