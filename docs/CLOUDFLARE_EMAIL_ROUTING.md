# Cloudflare Email Routing for Se'kret Bip

Last reviewed: 2026-08-07

## Canonical handler

Incoming Bip email belongs to the existing production Worker named `sekret-backend`.

The Worker entry point is `worker/voice-entry.ts`. It exports both:

- `fetch()` for the HTTP/API backend, delegating ordinary traffic to `worker/observed-index.ts`;
- `email()` for inbound email processing through `worker/email-router.ts`.

The Cloudflare dashboard may still contain a legacy Worker named `bip-mail`. That Worker is a cutover source, not the canonical destination. Do not create or preserve a second Wrangler configuration for mail.

## Supported inbox aliases

- `hello@<bip-domain>`
- `founder@<bip-domain>`
- `partnerships@<bip-domain>`
- `support@<bip-domain>`
- `parents@<bip-domain>`
- `safety@<bip-domain>`
- `privacy@<bip-domain>`
- `legal@<bip-domain>`
- `security@<bip-domain>`

Unknown aliases are rejected rather than silently forwarded.

## Deploy the canonical Worker

From the repository root, use the existing root configuration:

```bash
npm run deploy:worker
```

`deploy:worker` delegates to `deploy:api:production`, which invokes `wrangler deploy`. The root `wrangler.toml` deploys `worker/voice-entry.ts` as `sekret-backend`. Do not deploy `worker/email-router.ts` directly under the same Worker name, because that would replace the HTTP/API entry point.

## Cut over from `bip-mail`

1. Confirm the intended `sekret-backend` release is deployed.
2. Confirm its `/health` endpoint succeeds.
3. Run the `Reconcile Cloudflare Email Routing` GitHub Actions workflow with `apply=false` and inspect the plan.
4. Run it again with `apply=true` after `CLOUDFLARE_API_TOKEN` is configured with the required Cloudflare permissions.
5. If the workflow reports `DESTINATION_VERIFICATION_REQUIRED`, verify `sekretbip@gmail.com` from Cloudflare's email and rerun `apply=true`.
6. Send a controlled message to every supported alias.
7. Confirm every message reaches the verified destination and preserves the expected `X-Bip-*` headers.
8. Confirm `bip-mail` has no remaining Email Routing rules, routes, triggers, bindings, or recent traffic.
9. Only then delete `bip-mail`.

If any alias fails, restore its prior Worker action before deleting anything. The complete deletion and rollback gate is in `docs/CLOUDFLARE_WORKER_CONSOLIDATION.md`.

## GitHub-managed Cloudflare setup

The repository owns the desired Email Routing rule set through:

- `.github/workflows/cloudflare-email-routing.yml`;
- `scripts/reconcile-cloudflare-email-routing.mjs`.

The workflow is manual and plan-only by default. It does not create a catch-all rule and it does not delete Email Routing rules or legacy Workers. `apply=true` performs an idempotent reconciliation that:

1. discovers the active `sekretbip.net` zone unless zone/account IDs are supplied as repository variables;
2. enables the Cloudflare Email Routing DNS contract when needed;
3. ensures `sekretbip@gmail.com` exists as the destination address and stops until it is verified;
4. creates or repairs only the supported literal-address rules so they target `sekret-backend`;
5. rereads the rule set and fails if any supported alias does not resolve to the canonical Worker.

The required GitHub Actions secret is `CLOUDFLARE_API_TOKEN`. The token needs Cloudflare permissions sufficient for Zone Read, Zone Settings Write, Email Routing Rules Write, and Email Routing Addresses Write. Optional GitHub repository variables `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_ACCOUNT_ID` skip zone/account discovery.

## Privacy behavior

The email handler does not store message bodies, invoke AI, or write email content to Supabase. It only:

- validates the destination alias;
- adds `X-Bip-*` classification headers;
- logs limited delivery metadata;
- forwards the original message to the verified Gmail destination.

Safety and security aliases are marked `urgent`; privacy and legal aliases are marked `important`.

## Deployment note

Cloudflare Email Routing rules are reconciled by the manual GitHub Actions control plane after `sekret-backend` is deployed. The Worker contains the email-processing handler; the workflow controls which supported custom addresses Cloudflare sends to that handler. Dashboard changes remain visible operational state, but they are no longer the only supported configuration path.
