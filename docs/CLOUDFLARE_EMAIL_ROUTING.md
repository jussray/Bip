# Cloudflare Email Routing for Se'kret Bip

Incoming Bip email is handled by the existing Cloudflare Worker named `sekret-backend`.

The Worker entry point remains `worker/observed-index.ts`. It exports both:

- `fetch()` for the Bip HTTP/API backend;
- `email()` for inbound email processing through `worker/email-router.ts`.

There is no second mail Worker and no second Wrangler configuration.

## Supported inbox aliases

- `hello@<bip-domain>`
- `support@<bip-domain>`
- `parents@<bip-domain>`
- `safety@<bip-domain>`
- `privacy@<bip-domain>`
- `legal@<bip-domain>`
- `security@<bip-domain>`

Unknown aliases are rejected rather than silently forwarded.

## Deploy the Worker

From the repository root, use the existing root configuration:

```bash
npx wrangler deploy
```

The root `wrangler.toml` deploys `worker/observed-index.ts` as `sekret-backend`. Do not deploy `worker/email-router.ts` directly under the same Worker name, because that would replace the HTTP/API entry point.

## Cloudflare setup

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
