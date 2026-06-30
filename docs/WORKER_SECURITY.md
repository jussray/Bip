# Bip Worker security

Protected routes:

- `POST /api/sekret/reply`
- `POST /api/sekret/voice`
- `POST /api/sekret/transcribe`

## Shared client token

Set the Worker secret:

```bash
npx wrangler secret put BIP_CLIENT_TOKEN --name bip
```

Set the matching client value as `EXPO_PUBLIC_BIP_CLIENT_TOKEN` in local, Vercel, and EAS environments.

This client value is extractable from the app bundle. It is an interim abuse barrier, not user identity. Supabase JWT verification is the planned replacement.

`BIP_CLIENT_TOKEN` and `PIPER_API_TOKEN` protect different boundaries and must not be confused.

A deployed Worker fails closed when `BIP_CLIENT_TOKEN` is missing. Local open mode is available only when `.dev.vars` explicitly sets `ALLOW_INSECURE_LOCAL_DEV=true`. Never set that variable in Cloudflare production.

## CORS

`CORS_ALLOWED_ORIGINS` in `wrangler.toml` is a comma-separated browser allowlist. Add exact production and preview web origins before deployment. Native Expo requests generally omit `Origin` and continue to work.

`OPTIONS` requests are not authenticated or rate limited. Browser origins outside the allowlist receive `403`.

## Rate limits

- `RATE_LIMIT_REPLY`: replies, 60 requests per minute per route/IP key
- `RATE_LIMIT_VOICE`: voice synthesis and transcription, 20 requests per minute per route/IP key

Voice and transcription share a binding but use distinct route-prefixed keys. Current keys combine route and Cloudflare client IP. Replace the IP portion with a verified Supabase user ID after JWT auth is added.

Rejected requests return `429` with `Retry-After: 60` before OpenAI or Piper is called.

## Local setup

Copy `.dev.vars.example` to `.dev.vars` and `.env.example` to `.env.local`. Put the Worker-side token in `.dev.vars` and the matching public client value in `.env.local`.

## Deploy

```bash
npx wrangler secret put OPENAI_API_KEY --name bip
npx wrangler secret put BIP_CLIENT_TOKEN --name bip
npx wrangler deploy --name bip
```

Rebuild clients after changing the shared token.
