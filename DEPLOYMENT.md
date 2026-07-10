# Se'kret Bip — Deployment Guide

## Current direction

- Web: Cloudflare-first
- API and AI relay: Cloudflare Workers
- Database, auth, storage, and RLS: Supabase
- Native builds: Expo / EAS

Remaining Vercel compatibility code is transitional and is not the canonical production path.

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

Deploy with:

```bash
npm run deploy:worker
```

The Worker must validate authenticated identity for private routes and must not trust a user identifier supplied only in the request body.

## Cloudflare Pages

Build and deploy with:

```bash
npm run deploy:pages
```

Configure only the required public client variables in the Pages build environment. Keep server credentials in Worker or Supabase secret stores.

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
