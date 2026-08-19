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

Pages uses `cloudflare/pages/wrangler.toml`; the root `wrangler.toml` remains
the canonical Worker configuration because Wrangler does not allow `main` and
`pages_build_output_dir` in the same configuration. Wrangler Pages also does
not support a custom `--config` path, so Pages commands run from that isolated
directory.

The production workflow uses separate least-privilege credentials for the two
Cloudflare products:

- `CLOUDFLARE_API_TOKEN` deploys the backend and requires **Workers Scripts:
  Edit**.
- `CLOUDFLARE_PAGES_API_TOKEN` deploys the frontend and requires **Cloudflare
  Pages: Edit**.

Both tokens must target the account identified by `CLOUDFLARE_ACCOUNT_ID` and
must be stored as secrets in the `cloudflare-production` GitHub environment.
The Pages job maps `CLOUDFLARE_PAGES_API_TOKEN` to the standard
`CLOUDFLARE_API_TOKEN` environment variable consumed by Wrangler and verifies
API access to the `sekret` project before spending time on the Expo export. API
error code `10000` means the corresponding token/account configuration must be
corrected; retrying the workflow or changing application code cannot grant
those external permissions.

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
