<!-- truth-mode: durable -->
# Se’kret Bip — Deployment Guide

This guide defines the deployment contract. It does not declare the live release state.

## Live truth boundary

Before any deployment or release claim, resolve fresh GitHub `main`, the newest marked exact-production receipt on issue #696, Cloudflare provider/runtime evidence for the same target, the intended Supabase project, and applicable production browser/account/device evidence. See `docs/TRUTH_AUTHORITY.md` for expiry and supersession.

## Production authority

- Web: Cloudflare Pages project `sekret-bip` through native Git integration.
- API: canonical Cloudflare Worker `sekret-backend` through Workers Builds.
- Database/Auth/Storage/RLS/Edge Functions: Supabase.
- Native builds: Expo / EAS.

GitHub Actions verifies production evidence; it must not quietly become a second normal production deployment authority. Manual deployment commands are emergency administrator fallbacks and require separate authority.

## Local development

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
git lfs pull
npx expo start --web -c
```

Only client-safe public values belong in the Expo bundle. Provider keys, service-role credentials, Cloudflare credentials, webhook secrets, and account-processing secrets stay in server-side secret stores.

## Supabase

`supabase/migrations/` is the schema source of truth.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not maintain a second bootstrap schema. Migration history is append-only; fresh projects must replay ordered migrations, and production mutation/repair requires explicit authority and independent evidence.

Deploy Edge Functions with reviewed authentication settings. Custom server-to-server authentication boundaries require focused negative-auth proof; repository configuration alone is not live behavior evidence.

## Cloudflare Worker

The canonical Worker is `sekret-backend`, configured by `wrangler.toml`.

Emergency manual fallback:

```bash
npm run deploy:worker
```

This command requires independently authorized Cloudflare credentials. Private Worker routes must verify authenticated identity and must not trust a user identifier supplied only in a request body.

## Cloudflare Pages

The canonical Pages project is `sekret-bip`. The repository build contract emits `dist/.well-known/sekret-release.json`; that exact marker is the canonical frontend release witness. `dist/release.json` is compatibility output, not release authority.

Emergency manual preview fallback:

```bash
npm run deploy:pages
```

Preview success is preview evidence only. It must not be promoted into canonical-domain production proof.

## Exact production verification

A production release is VERIFIED only when the same intended release target has all applicable witnesses:

1. exact-current-main repository authority;
2. successful canonical Pages provider event and deployed release marker matching the target;
3. canonical `sekret-backend` identity and healthy runtime;
4. live Supabase migration/schema/runtime evidence for the intended project;
5. read-only production Playwright against that exact deployment;
6. any required controlled-account or physical-device journeys.

If Cloudflare Access protects a verification path, use only an explicitly authorized service-auth verification lane. Never weaken Access, leak credentials into traces/artifacts, or treat an interception as application success.

The verifier must fail closed. Zero-step/no-log jobs, missing markers, stale SHAs, skipped browser steps, provider upload receipts, or unauthenticated control-plane reads cannot be relabeled as release proof.

## Validation

```bash
npm run type-check
npm test
npm run lint
node scripts/audit-documentation-truth.mjs
npm run audit:control-room
npm run validate:companions
npm run verify:bundle
npm run test:e2e
npm run test:e2e:production
npm run verify:prepush
```

## Release decision checklist

Before calling an environment demo-ready or launch-ready, verify the applicable exact release identity, database authorization/runtime state, secrets/configuration boundaries, CORS, Teen/Parent privacy, account deletion/cleanup, accessibility/device behavior, legal/safeguarding/store requirements, monitoring, incident response, backup, restore, and rollback.

The implementation ledger must not promote an integrated feature to verified/released without evidence that matches the claimed environment and target.
