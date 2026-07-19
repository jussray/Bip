# Story Engine Meta social integration

Story Engine is the Meta developer app container for Se'kret Bip's Facebook and Instagram social integration work.

This document is a setup contract only. It does not mean publishing, comments, insights, webhooks, or account connection flows are implemented or production-ready.

## Boundary from Playground

Story Engine and Playground are separate external Meta surfaces:

- `Story Engine`: Facebook/Instagram social integration setup.
- `Playground`: Meta Model API / Muse Spark response API experiments.

Do not mix their secrets, permissions, review evidence, or production gates.

## Current intent

Story Engine may later support these bounded use cases:

- connecting a founder-owned Facebook Page;
- connecting the linked Instagram professional account;
- reading approved page/account metadata needed for setup verification;
- publishing or scheduling content only after a separate reviewed implementation;
- receiving webhook events only after a separate reviewed implementation.

No teen private data may be sent to Meta social APIs. Social API work must stay outside teen journaling, Bridge, parent surfaces, safety scan content, and any protected account data unless a separate privacy review explicitly approves the exact metadata boundary.

## Safe-to-commit values

Only client-safe values belong in Expo/public config:

```env
EXPO_PUBLIC_META_APP_NAME=Story Engine
EXPO_PUBLIC_META_APP_ID=your-meta-app-id-here
```

The Meta App ID is not treated as a secret, but it should still be managed through environment configuration instead of hardcoded into screens or source constants.

## Server-only values

The following values must never be committed and must never be bundled into the Expo client:

```env
META_APP_SECRET=
META_CLIENT_TOKEN=
META_WEBHOOK_VERIFY_TOKEN=
META_LONG_LIVED_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
```

Place real values only in an approved server-side secret store, such as Cloudflare Worker secrets, Supabase Edge Function secrets, GitHub Actions secrets for verification-only jobs, or another reviewed vault.

## Founder setup checklist

1. Register as a Meta developer if the dashboard asks for it.
2. Open the Meta developer dashboard and select the `Story Engine` app.
3. Confirm the numeric App ID under `App settings → Basic`.
4. Do not copy App Secret, long-lived access tokens, webhook verify tokens, or page/account credentials into chat, screenshots, commits, issues, or pull requests.
5. Add only the minimum products needed for the current phase. Expected early products are Facebook Login, Pages API, Instagram API/Graph API, and Webhooks.
6. Keep the app in development/testing mode until permissions, app review requirements, redirect URLs, data deletion callback requirements, and production evidence are complete.

## Implementation gate

Before any code consumes these values, the change must include:

- a privacy boundary note explaining exactly what account/page metadata flows through the system;
- fail-closed behavior for missing or invalid Meta configuration;
- token storage and rotation notes;
- webhook signature/verification handling if webhooks are introduced;
- least-privilege scopes and app-review status;
- Founder Control Room tracking for the setup state and evidence;
- Playwright or integration evidence for any user-visible account-connection route.

## Current status

- Meta developer app name: `Story Engine`.
- Repository configuration: placeholder-only.
- Runtime integration: not implemented.
- Production readiness: blocked pending reviewed implementation, secrets configuration, Meta permissions/app review, privacy boundary evidence, and production verification.
