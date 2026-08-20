# Cloudflare Worker Topology and Consolidation

Last reviewed: 2026-08-20

## Decision

Se’kret Bip has distinct Cloudflare authorities that must not be collapsed into one identity:

1. `sekret-bip` — Cloudflare Pages frontend project;
2. `sekret-backend` — canonical public API/front-door and privileged platform Worker;
3. `sekret` — founder-confirmed active companion API Worker lineage;
4. `sekret-backend-alpha` — founder-gated non-production Worker.

`bip-mail` is retired. `sekret` is **not** a retirement target.

> **Current release boundary:** [#696](https://github.com/jussray/Sekret-Bip/issues/696) owns exact production proof. Repository topology is not a substitute for live Cloudflare route/domain/binding readback.

## What the code attack proved

The product code already contains a strong service boundary even though deployment is currently consolidated.

### Companion contract

`src/contracts/sekretApi.ts` and `src/services/backend/sekretClient.ts` group these operations together:

- `/api/sekret/reply`;
- `/api/sekret/voice`;
- `/api/sekret/transcribe`;
- Worker health and stable companion error/trace semantics.

`worker/sekret-reply.ts` contains the companion brain, intent handling, safety-response path, reply policy, fallback behavior, TTS, and transcription. `worker/index.ts` adds shared auth/rate limiting and runtime style enforcement around that companion contract.

Historical Cloudflare-generated rename PRs show that `sekret` repeatedly pointed at the same backend lineage before the repository later standardized the public Worker identity as `sekret-backend`. The founder confirms `sekret` still holds companion API purpose.

### Privileged platform contract

`worker/bridge-summary.ts` is structurally different. It performs privacy-sensitive source lookup and summary persistence with server-owned Supabase access. `worker/email-router.ts` is also platform infrastructure rather than companion inference.

`worker/audit/persist-event.ts` currently uses `SUPABASE_SERVICE_ROLE_KEY` to write assurance metadata. That persistence mechanism is a migration constraint, not a reason to give the companion Worker broad database privilege.

## Current repository routing

The checked-in client remains intentionally single-homed:

```text
EXPO_PUBLIC_BACKEND_URL=https://api.sekretbip.net
                            |
                            v
                    sekret-backend
```

The current `wrangler.toml` maps `api.sekretbip.net` to `sekret-backend` and uses `worker/voice-entry.ts` as its entry point. That is the current release contract until an approved provider cutover is proven.

## Best-fit target topology

Do **not** solve the split by teaching the app two public Worker URLs.

Preferred topology:

```text
                           +---------------------------+
client -> api.sekretbip.net -> sekret-backend          |
                           | public/platform authority |
                           +-------------+-------------+
                                         |
                           /api/sekret/*  | Service Binding
                                         v
                           +---------------------------+
                           | sekret                    |
                           | companion execution plane |
                           +---------------------------+
```

Cloudflare Service Bindings are the preferred boundary because the backend can forward the original request to the companion Worker without a second public network hop or client routing decision.

### `sekret` should own

- companion reply inference;
- companion runtime style/identity enforcement;
- companion safety-response logic coupled to reply generation;
- companion TTS and transcription;
- AI/voice provider selection and provider secrets;
- companion-scoped metadata telemetry that does not require broad database privilege.

### `sekret-backend` should own

- the stable `api.sekretbip.net` public origin;
- shared ingress/auth/rate-limit/release controls as approved by the migration;
- Bridge summary generation and privacy-sensitive source access;
- server-side Supabase service-role operations;
- email routing/forwarding;
- privileged operational/business logic outside companion inference;
- a narrow assurance-ingest path if needed so `sekret` does not receive the Supabase service-role key.

### Not proven as a backend route

`worker/push-notifications.ts` is a privileged helper, but current source does not show it wired into the public Worker router. Do not describe “push” as a live `sekret-backend` HTTP responsibility until route evidence exists. Supabase Edge Functions also own parts of push/safety behavior.

## Migration sequence for `sekret`

This is a forward-only, evidence-gated migration. No step is implied complete by this document.

1. **Provider census:** retain `sekret` routes/custom domains, workers.dev state, bindings, secret names, Git trigger, immutable version/script tag, request volume, errors, and callers.
2. **Compatibility proof:** prove the deployed `sekret` companion contract is compatible with current `/api/sekret/*` request/response shapes, or prepare the smallest code update on `sekret` first.
3. **Least-privilege secret map:** AI/voice provider secrets may live with the companion runtime; `SUPABASE_SERVICE_ROLE_KEY` remains backend-only unless a separately reviewed need proves otherwise.
4. **Telemetry seam:** replace direct companion service-role persistence with a narrow internal/backend-owned ingestion path or another least-privilege mechanism.
5. **Service binding:** add a `sekret-backend -> sekret` binding and route only `/api/sekret/*` through it. Keep `api.sekretbip.net` stable.
6. **Shadow/controlled proof:** verify reply, voice, transcription, auth denial, rate limiting, fallback, trace identity, and telemetry on a controlled release without changing unrelated Bridge/email behavior.
7. **Production cutover:** explicitly approve and apply the binding/routing change.
8. **Exact release proof:** bind the public backend SHA/version, companion Worker SHA/version, service binding, Supabase state, and production Playwright/device journeys into one release packet.
9. **Remove duplicate companion code from `sekret-backend` only after rollback confidence exists.** Do not delete fallback code in the same step that first activates the service binding.

Rollback: disable the delegation and return `/api/sekret/*` to the previously proven local `sekret-backend` implementation. Do not require a client release for rollback.

## Why this is safer than two public APIs

- no client config migration;
- no public CORS/origin split;
- no second public authentication contract;
- `api.sekretbip.net` remains the stable release witness;
- companion code can evolve independently;
- privileged Bridge/email/data logic stays isolated;
- rollback is a server-side routing decision rather than an app-store or web-client redeploy.

## `bip-mail`

`bip-mail` is retired and must not regain production authority. Inbound email belongs to the backend/platform plane through `worker/voice-entry.ts -> worker/email-router.ts` until an independently approved future email architecture changes that contract.

## Provider-safe app-domain rule

Provider automation must treat both `sekret` and `sekret-backend` as protected identities. It must fail closed until the exact Worker attached to a target hostname/binding is identified from live provider readback.

In particular:

- `api.sekretbip.net` remains bound to `sekret-backend` during the preferred service-binding migration;
- `sekret` remains independently protected;
- Pages `sekret-bip` remains an independent frontend authority;
- no broad wildcard route, service binding, secret, or custom domain may be deleted automatically;
- a 405/Access response is interception evidence, not deletion authority.

## Completion evidence

The purpose split is complete only when all applicable claims have fresh evidence:

- `sekret-bip` serves the exact intended frontend release marker;
- `sekret-backend` serves the exact public backend release at `api.sekretbip.net`;
- `sekret` has a retained provider ownership receipt and exact companion release identity;
- the service binding/delegation is independently read back;
- reply, voice, transcription, auth-denial, fallback, and telemetry journeys pass through the companion Worker;
- Bridge and email remain correct on the platform Worker;
- no broad service-role credential was copied into `sekret` merely for convenience;
- Founder Control Room records target, observations, actions, proof, and rollback.

Deleting or detaching a Worker without the preceding route/binding audit is not consolidation. It is an outage lottery ticket.
