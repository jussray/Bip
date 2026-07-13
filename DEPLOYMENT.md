# Se'kret Bip — Deployment Guide

## Current direction

- Web: Cloudflare Pages through the Cloudflare GitHub App
- API and AI relay: Cloudflare Workers Builds through the Cloudflare GitHub App
- Database, auth, storage, and RLS: Supabase
- Native builds: Expo / EAS

Remaining Vercel compatibility code is transitional and is not the canonical production path.

## Deployment authority

Cloudflare's native Git integration is the production deployment authority for this repository:

- `Cloudflare Pages` deploys the `sekret-bip` Pages project from pushes to `main`.
- `Workers Builds: sekret-backend` deploys the canonical backend Worker from pushes to `main`.
- GitHub Actions does **not** upload code to Cloudflare and does not require a `CLOUDFLARE_API_TOKEN`.
- `.github/workflows/deploy-cloudflare.yml` waits for both Cloudflare check runs on the exact commit, verifies backend health, and runs the production Playwright suite against `https://sekretbip.net`.
- A release is not considered deployed when only one Cloudflare check succeeds.

This removes the duplicate token-based deployment path that could disagree with the already-connected Cloudflare GitHub App. Two deployment authorities are how configuration drift acquires a pension plan.

## Local development

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npx expo start --web -c
```

Only client-safe public environment variables belong in the Expo bundle. Provider keys, service-role credentials, Cloudflare credentials, webhook secrets, and account-processing secrets must remain in server-side secret stores.

## Supabase

`supabase/migrations/` is the schema source of truth.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not use a separate full-bootstrap SQL file. Fresh projects must be able to replay migrations in filename order.

Deploy required functions from `supabase/functions/` and configure their server-side secrets in Supabase.

## Cloudflare Worker

The canonical Worker is `sekret-backend`, configured by `wrangler.toml` and deployed by Workers Builds after a push to `main`.

Manual local deployment remains an emergency administrator fallback:

```bash
npm run deploy:worker
```

That command requires an independently valid Cloudflare credential and is not used by GitHub Actions.

The Worker must validate authenticated identity for private routes and must not trust a user identifier supplied only in the request body.

## Cloudflare Pages

The canonical Pages project is `sekret-bip`, deployed by the Cloudflare GitHub App after a push to `main`.

Manual local direct upload remains an emergency administrator fallback:

```bash
npm run deploy:pages
```

Configure only the required public client variables in the Pages build environment. Keep server credentials in Worker or Supabase secret stores.

## Production verification

The automatic verifier requires both native Cloudflare check runs to complete successfully on the exact `main` commit:

```text
Workers Builds: sekret-backend
Cloudflare Pages
```

It then verifies:

```bash
curl --fail https://sekret-backend.mcgill-raylene.workers.dev/health
npm run test:e2e:production
```

The verifier stores commit-scoped Cloudflare check URLs and Playwright output as a GitHub Actions artifact.

## Native builds

Use Expo / EAS for production mobile builds. Never embed server secrets in the app bundle.

## Enforced release validation

```bash
npm run type-check
npm test
npm run audit:control-room
npm run validate:companions
npm run verify:bundle
```

Also verify before calling any deployed environment demo-ready or launch-ready:

- Supabase migrations and RLS are current
- Worker secrets are configured
- CORS is restricted appropriately
- parent and teen privacy tests pass
- release-health telemetry records the deployed commit
- `safety-scan` is deployed in the active Supabase project
- `notification_deliveries` has an intentional RLS policy or documented service-role-only exception
- public/legal demos satisfy `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
