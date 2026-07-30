# Cloudflare Worker Consolidation

Last reviewed: 2026-07-29

## Decision

Production has two canonical Cloudflare deployment targets:

1. `sekret-bip` — Cloudflare Pages frontend;
2. `sekret-backend` — the single production Worker.

The dashboard Workers `bip-mail` and `sekret` are legacy migration candidates. They are not canonical deployment targets and must not receive new code, routes, triggers, or secrets.

`sekret-backend-alpha` is a separate founder-gated non-production service and is outside this production cleanup.

> **Current release boundary:** [#696](https://github.com/jussray/Sekret-Bip/issues/696) is open because the live Pages marker is not served as JSON. Do not treat the frontend marker completion item below as satisfied until its exact public witness exists.

## Why one production Worker is sufficient

`worker/voice-entry.ts` is the configured production Worker entry point and exports both Cloudflare handler types:

- `fetch()` delegates ordinary HTTP/API work to `worker/observed-index.ts`;
- `email()` delegates inbound mail to `worker/email-router.ts`.

The backend router already owns Sekret reply, voice, transcription, Bridge summary, authentication, rate limiting, safety, push, and supporting business logic. A second production `sekret` Worker would duplicate that authority.

## Cutover gate for `bip-mail`

Do not delete `bip-mail` first. Complete this order in the Cloudflare dashboard:

1. Deploy or confirm the exact intended `sekret-backend` release.
2. Confirm `https://sekret-backend.mcgill-raylene.workers.dev/health` returns success.
3. Open Email Routing for the Bip domain.
4. Change every supported alias Worker action from `bip-mail` to `sekret-backend`:
   - `hello`;
   - `support`;
   - `parents`;
   - `safety`;
   - `privacy`;
   - `legal`;
   - `security`.
5. Send a controlled message to every alias.
6. Confirm every message reaches the verified destination and preserves the expected `X-Bip-*` classification headers.
7. Confirm `bip-mail` has no remaining Email Routing rules, routes, triggers, service bindings, queues, cron schedules, or custom domains.
8. Only then delete `bip-mail`.

Rollback: restore the prior Email Routing Worker action before deleting anything if any alias fails.

## Cutover gate for `sekret`

Before deleting the dashboard Worker named `sekret`, inspect and record:

- routes and custom domains;
- service bindings;
- queues, cron triggers, Durable Objects, KV, D1, R2, and Analytics Engine bindings;
- environment variables and secrets;
- Git repository and branch connection;
- recent request volume and error logs.

Any unique dependency blocks deletion until it is deliberately migrated to `sekret-backend` and verified.

Then verify the canonical backend paths:

```text
GET  /health
POST /api/sekret/reply
POST /api/sekret/voice
POST /api/sekret/transcribe
POST /api/bridge/summary/generate
```

Confirm all clients use `EXPO_PUBLIC_BACKEND_URL` for `sekret-backend`. Remove all routes, triggers, and bindings from `sekret`; verify the canonical paths again; then delete `sekret`.

Rollback: restore the previous route or binding to `sekret` if the canonical backend proof fails before deletion.

## Completion evidence

The consolidation is complete only when all of the following are true:

- `sekret-bip` serves the frontend and the exact `/.well-known/sekret-release.json` marker;
- `sekret-backend` passes health, Sekret reply, voice, transcription, and Bridge checks;
- all supported email aliases route through `sekret-backend`;
- `bip-mail` and `sekret` have no routes, triggers, bindings, or traffic;
- both legacy Workers are deleted from Cloudflare;
- the Founder Control Room records the exact release, checks, deletion action, and rollback boundary.

Deleting a Worker without the preceding route and binding audit is not consolidation. It is an outage lottery ticket.
