<!-- truth-mode: durable -->
# Se’kret Bip — Deployment Guide

This guide defines the deployment contract. It does not declare the live release state.

## Live truth boundary

Before any deployment or release claim, resolve fresh GitHub `main`, the newest marked exact-production receipt on issue #696, Cloudflare provider/runtime evidence for the same release target, the intended Supabase project, and applicable production browser/account/device evidence. See `docs/TRUTH_AUTHORITY.md` for scope-aware expiry and supersession.

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

The repository-owned Pages build contract is durable:

- Node runtime: `.node-version` must resolve to `22.16.0`;
- build command: `npm run build:web`;
- output directory: `dist`.

Expo SDK 56 requires Node 22.13 or newer. The repository pin keeps the build on a supported runtime without relying on a provider-side default.

Emergency manual preview fallback:

```bash
npm run deploy:pages
```

Preview success is preview evidence only. It must not be promoted into canonical-domain production proof.

## Repository head versus production release target

Keep repository identity and release identity exact, but do not pretend they are always the same fact.

- `repository_head_sha` is the exact current GitHub `main` commit.
- `release_target_sha` is the exact source commit represented by the canonical production release witness.

A production-impacting or unknown-scope `main` change invalidates current release authority until the new intended release target is verified. A positively verified non-production-only merge may advance `repository_head_sha` without changing `release_target_sha`.

Non-production-only classification is fail-closed and requires the exact merged diff plus current ownership/build contracts. A workflow path filter is supporting evidence, not sole authority. Any ambiguous path or effect must be treated as production-impacting/UNKNOWN and re-verified.

An isolated tooling, documentation, test-only, or internal-control-plane change qualifies only when it cannot alter the canonical app, `sekret-backend`, `sekret-bip`, Supabase production behavior, native release artifact, production route, secret/config binding, or deployment authority.

This distinction cannot turn a known failed provider check into success. If the retained release target is blocked, it remains blocked until newer authoritative provider/runtime evidence supersedes that blocker.

## Exact production verification

A production release is VERIFIED only when the same intended `release_target_sha` has all applicable witnesses:

1. exact repository authority records both the then-current `repository_head_sha` and the exact `release_target_sha`, including scope evidence if they differ;
2. successful canonical Pages provider event and deployed release marker matching `release_target_sha`;
3. canonical `sekret-backend` identity and healthy runtime for `release_target_sha`;
4. live Supabase migration/schema/runtime evidence for the intended project;
5. read-only production Playwright against that exact deployment;
6. any required controlled-account or physical-device journeys.

If Cloudflare Access protects a verification path, use only an explicitly authorized service-auth verification lane. Never weaken Access, leak credentials into traces/artifacts, or treat an interception as application success.

The verifier must fail closed. Zero-step/no-log jobs, missing markers, stale SHAs, skipped browser steps, provider upload receipts, unauthenticated control-plane reads, or unclassified repository/release-target divergence cannot be relabeled as release proof.

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

The implementation ledger must not promote an integrated feature to verified/released without evidence that matches the claimed environment, target, and scope.
