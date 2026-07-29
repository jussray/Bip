# Cloudflare Email Routing for Se'kret Bip

Last reviewed: 2026-07-29

## Canonical handler

Incoming Bip email belongs to the existing production Worker named `sekret-backend`.

The Worker entry point is `worker/voice-entry.ts`. It exports both:

- `fetch()` for the HTTP/API backend, delegating ordinary traffic to `worker/observed-index.ts`;
- `email()` for inbound email processing through `worker/email-router.ts`.

The Cloudflare dashboard may still contain a legacy Worker named `bip-mail`. That Worker is a cutover source, not the canonical destination. Do not create or preserve a second Wrangler configuration for mail.

## Supported inbox aliases

- `hello@<bip-domain>`
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
3. Open **Email Routing** for the Bip domain.
4. For every supported alias, change the Worker action from `bip-mail` to `sekret-backend`.
5. Send a controlled message to every alias.
6. Confirm every message reaches the verified destination and preserves the expected `X-Bip-*` headers.
7. Confirm `bip-mail` has no remaining Email Routing rules, routes, triggers, bindings, or recent traffic.
8. Only then delete `bip-mail`.

If any alias fails, restore its prior Worker action before deleting anything. The complete deletion and rollback gate is in `docs/CLOUDFLARE_WORKER_CONSOLIDATION.md`.

## Initial Cloudflare setup

1. In Cloudflare, open **Email Routing** for the Bip domain.
2. Add `sekretbip@gmail.com` as a destination address.
3. Open that Gmail inbox and complete Cloudflare's verification email.
4. Deploy `sekret-backend` from the repository root.
5. Create routing rules for each supported alias and choose `sekret-backend` as the Worker action.
6. Send a test message to each alias and confirm it reaches `sekretbip@gmail.com`.

## Privacy behavior

The email handler does not store message bodies, invoke AI, or write email content to Supabase. It only:

- validates the destination alias;
- adds `X-Bip-*` classification headers;
- logs limited delivery metadata;
- forwards the original message to the verified Gmail destination.

Safety and security aliases are marked `urgent`; privacy and legal aliases are marked `important`.

## Deployment note

Cloudflare Email Routing rules must still be configured in the Cloudflare dashboard after `sekret-backend` is deployed. The Worker contains the email-processing handler; Email Routing decides which custom addresses send messages to it.
