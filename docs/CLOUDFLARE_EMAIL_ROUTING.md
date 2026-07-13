# Cloudflare Email Routing for Se'kret Bip

The dedicated Email Worker lives at `worker/email-router.ts` and forwards approved custom-domain addresses to `sekretbip@gmail.com`.

The main Bip API Worker continues to use the root `wrangler.toml`. The email Worker has its own configuration at `wrangler.email.toml` so deploying mail cannot replace or rename the `sekret` API Worker.

## Supported inbox aliases

- `hello@<bip-domain>`
- `support@<bip-domain>`
- `parents@<bip-domain>`
- `safety@<bip-domain>`
- `privacy@<bip-domain>`
- `legal@<bip-domain>`
- `security@<bip-domain>`

Unknown aliases are rejected rather than silently forwarded.

## Deploy the dedicated Email Worker

From the repository root, run:

```bash
npx wrangler deploy --config wrangler.email.toml
```

This deploys `worker/email-router.ts` as a separate Worker named `bip-mail`.

Do not replace the existing root `wrangler.toml` with the mail configuration. The root file belongs to the main Bip API Worker.

## Cloudflare setup

1. In Cloudflare, open **Email Routing** for the Bip domain.
2. Add `sekretbip@gmail.com` as a destination address.
3. Open that Gmail inbox and complete Cloudflare's verification email.
4. Deploy the dedicated Email Worker with the command above.
5. Create routing rules for each supported alias and choose `bip-mail` as the Worker action.
6. Send a test message to each alias and confirm it reaches `sekretbip@gmail.com`.

## Privacy behavior

The worker does not store message bodies, invoke AI, or write email content to Supabase. It only:

- validates the destination alias;
- adds `X-Bip-*` classification headers;
- logs limited delivery metadata;
- forwards the original message to the verified Gmail destination.

Safety and security aliases are marked `urgent`; privacy and legal aliases are marked `important`.

## Deployment note

Cloudflare Email Routing rules must still be configured in the Cloudflare dashboard after `bip-mail` is deployed. The Worker deployment creates the processing Worker, while Email Routing decides which custom addresses send messages to it.
