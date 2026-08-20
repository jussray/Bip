# Cloudflare Worker Topology and Consolidation

Last reviewed: 2026-08-19

## Decision

Se’kret Bip has multiple distinct Cloudflare authorities that must not be collapsed into one Worker identity:

1. `sekret-bip` — Cloudflare Pages frontend project;
2. `sekret-backend` — canonical API/backend Worker;
3. `sekret` — separate founder-confirmed active Worker whose exact live route/custom-domain ownership must be read back from Cloudflare before any mutation;
4. `sekret-backend-alpha` — separate founder-gated non-production Worker.

`bip-mail` remains the legacy migration/retirement target. `sekret` is **not** a retirement target and must not be deleted, detached, renamed, or have its routes/triggers/secrets reassigned merely because repository code proves `sekret-backend` is the canonical API Worker.

> **Current release boundary:** [#696](https://github.com/jussray/Sekret-Bip/issues/696) owns exact production proof. Repository topology is not a substitute for live Cloudflare route/domain readback.

## Canonical backend authority

`worker/voice-entry.ts` is the configured `sekret-backend` production entry point and exports both Cloudflare handler types:

- `fetch()` delegates ordinary HTTP/API work to `worker/observed-index.ts`;
- `email()` delegates inbound mail to `worker/email-router.ts`.

The backend router owns Sekret reply, voice, transcription, Bridge summary, authentication, rate limiting, safety, push, and supporting backend business logic. This proves what `sekret-backend` owns; it does **not** prove that another Cloudflare Worker named `sekret` is unused or safe to retire.

The repository contract pins `api.sekretbip.net` to `sekret-backend`. The exact current hostname, routes, custom domains, triggers, and traffic owned by `sekret` remain provider truth and must be observed before any route change.

## Cutover gate for `bip-mail`

Do not delete `bip-mail` first. Complete this order in the Cloudflare dashboard/provider control plane:

1. Deploy or confirm the exact intended `sekret-backend` release.
2. Confirm the canonical backend health route succeeds.
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

## Preservation gate for `sekret`

`sekret` is a separate Worker authority and **must not be deleted** from repository assumptions or provider state.

Before any change involving `sekret`, retain exact provider route/custom-domain readback showing:

- routes and custom domains;
- service bindings;
- queues, cron triggers, Durable Objects, KV, D1, R2, and Analytics Engine bindings;
- environment variables and secret names without exposing secret values;
- Git repository and branch connection;
- current build/deploy trigger policy;
- recent request volume and error logs;
- the exact public hostname(s) currently served by the Worker.

If the provider readback shows a binding conflict with Pages or `sekret-backend`, repair only the exact conflicting binding after founder authorization. Do not infer that `sekret` is disposable from the presence of `sekret-backend`.

## Provider-safe app-domain rule

The app-domain reconciler must treat both `sekret` and `sekret-backend` as protected Worker identities. A provider mutation must fail closed until the exact Worker attached to the target hostname is explicitly identified from live provider readback.

In particular:

- `api.sekretbip.net` remains bound to canonical backend Worker `sekret-backend`;
- `sekret` remains independently protected;
- Pages `sekret-bip` remains an independent frontend authority;
- a 405/Access response on the public app hostname is evidence of interception, not proof of which Worker may be safely removed;
- no broad wildcard route may be deleted automatically.

## Completion evidence

Topology repair is complete only when all applicable current-use claims have fresh evidence:

- `sekret-bip` serves the intended frontend release marker where Pages is authoritative;
- `sekret-backend` passes exact release identity and backend health on its canonical API hostname;
- `sekret` has an explicit retained provider route/custom-domain ownership receipt;
- all supported email aliases route through the intended backend email handler;
- `bip-mail` has no remaining provider authority before retirement;
- Founder Control Room records the exact target, provider observations, actions, and rollback boundary.

Deleting or detaching a Worker without the preceding route and binding audit is not consolidation. It is an outage lottery ticket.
