# Cloudflare Email Routing for Se'kret Bip

The dedicated Email Worker lives at `worker/email-router.ts` and forwards approved custom-domain addresses to `sekretbip@gmail.com`.

## Supported inbox aliases

- `hello@<bip-domain>`
- `support@<bip-domain>`
- `parents@<bip-domain>`
- `safety@<bip-domain>`
- `privacy@<bip-domain>`
- `legal@<bip-domain>`
- `security@<bip-domain>`

Unknown aliases are rejected rather than silently forwarded.

## Cloudflare setup

1. In Cloudflare, open **Email Routing** for the Bip domain.
2. Add `sekretbip@gmail.com` as a destination address.
3. Open that Gmail inbox and complete Cloudflare's verification email.
4. Create a dedicated Email Worker in Cloudflare.
5. Copy the contents of `worker/email-router.ts` into that Email Worker and deploy it.
6. Create routing rules for each supported alias and choose the deployed Email Worker as the action.
7. Send a test message to each alias and confirm it reaches `sekretbip@gmail.com`.

## Privacy behavior

The worker does not store message bodies, invoke AI, or write email content to Supabase. It only:

- validates the destination alias;
- adds `X-Bip-*` classification headers;
- logs limited delivery metadata;
- forwards the original message to the verified Gmail destination.

Safety and security aliases are marked `urgent`; privacy and legal aliases are marked `important`.

## Deployment note

This Email Worker should remain separate from the main HTTP/API Worker. Cloudflare Email Routing must be configured in the Cloudflare dashboard even after this code is merged.
