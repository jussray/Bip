# Se'kret Bip — Deployment Guide

Last reviewed: 2026-07-18

## Current production direction

- Web: Cloudflare Pages through the Cloudflare GitHub App
- API and AI relay: Cloudflare Workers Builds through the Cloudflare GitHub App
- Database, Auth, Storage, RLS, and Edge Functions: Supabase
- Native builds: Expo / EAS

Legacy compatibility files are not a second production authority.

## Deployment authority

Cloudflare native Git integration is the production deployment authority for this repository:

- `Cloudflare Pages` deploys the `sekret-bip` Pages project from pushes to `main`.
- `Workers Builds: sekret-backend` deploys the canonical backend Worker from pushes to `main`.
- GitHub Actions does **not** upload code to Cloudflare and does not require a Cloudflare deployment token.
- `.github/workflows/deploy-cloudflare.yml` verifies the latest `main` release instead of creating a competing deployment.
- Older verification runs are cancelled when a newer `main` commit arrives.

Two production deployment authorities are configuration drift wearing a badge. Keep one.

## Local development

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
git lfs pull
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

Do not use a separate full-bootstrap SQL file. Fresh projects must replay migrations in filename order, and repository migration versions must match the live migration history.

Deploy required functions from `supabase/functions/` with reviewed authentication settings and configure server-side secrets in Supabase.

### Current Edge Function authorization evidence

- `release-health`, `bridge-e2e-probe`, and `github-workflow-status` are retired, side-effect-free HTTP 410 functions protected by platform JWT verification.
- `account-delete` and `safety-scan` intentionally use dedicated server-to-server authentication instead of platform JWT verification and still require focused negative-auth tests.

The retired `release-health` function is not a release oracle.

## Cloudflare Worker

The canonical Worker is `sekret-backend`, configured by `wrangler.toml` and deployed by Workers Builds after a push to `main`.

Manual local deployment remains an emergency administrator fallback:

```bash
npm run deploy:worker
```

That command requires an independently valid Cloudflare credential and is not used by GitHub Actions.

Private Worker routes must verify authenticated identity and must not trust a user identifier supplied only in the request body.

## Cloudflare Pages

The canonical Pages project is `sekret-bip`, deployed by the Cloudflare GitHub App after a push to `main`.

The repository owns the frontend build contract:

- Node runtime: `.node-version` must resolve to `22.16.0`;
- install command: Cloudflare's native dependency installation from `package-lock.json`;
- build command: `npm run build:web`;
- output directory: `dist`.

Do not rely on the Pages project's historical default Node version. Expo SDK 56 requires Node 22.13 or newer, and the repository pin keeps older and newer Cloudflare build systems on the same supported runtime.

Cloudflare Pages injects `CF_PAGES_COMMIT_SHA` and `CF_PAGES_BRANCH` during the build. `npm run build:web` writes those values to the public, non-sensitive `dist/release.json` file after Expo export.

Manual local direct upload remains an emergency administrator fallback:

```bash
npm run deploy:pages
```

Configure only public client variables in the Pages build environment. Keep server credentials in Worker or Supabase secret stores.

## Exact production verification

The automatic verifier proves the current `main` commit through independent runtime evidence:

1. The exact commit has a successful `Workers Builds: sekret-backend` check.
2. `https://sekretbip.net/release.json` reports the exact same commit SHA and `main` branch.
3. The canonical Worker health endpoint responds successfully.
4. Read-only production Playwright verifies the release marker and protected teen and parent routes.

```bash
curl --fail https://sekret-backend.mcgill-raylene.workers.dev/health
curl --fail https://sekretbip.net/release.json
npm run test:e2e:production
```

The Cloudflare Pages check remains useful diagnostic evidence, but the deployed release marker is the authoritative Pages proof because it observes the artifact serving traffic.

The verifier stores commit-scoped Worker evidence, the Pages release marker, and Playwright output as a GitHub Actions artifact.

## Native builds

Use Expo / EAS for production mobile builds. Never embed server secrets in the app bundle.

## Enforced release validation

```bash
npm run type-check
npm test
npm run lint
npm run audit:control-room
npm run validate:companions
npm run verify:bundle
npm run test:e2e
npm run verify:prepush
```

Before calling any deployed environment demo-ready or launch-ready, also verify:

- the exact Worker and Pages commit is serving production;
- Supabase migrations and RLS match the active project;
- Worker and Edge Function secrets are configured server-side;
- CORS is restricted appropriately;
- parent and teen privacy tests pass;
- `safety-scan` is deployed and its custom-auth boundary has negative tests;
- `notification_deliveries` remains service-role-only with no client grants;
- account deletion and Storage cleanup are proven;
- public/legal demos satisfy `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`;
- the implementation ledger does not mark an integrated feature as verified or released without production evidence.
