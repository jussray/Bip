# Se'kret Bip 💜

🌐 **Official site:** [sekretbip.net](https://sekretbip.net)

> **Copyright © 2024–2026 Juss Ray. All rights reserved.**  
> Proprietary software. No license to use, copy, modify, or distribute is granted. See [LICENSE](LICENSE).

---

## The real story

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built by a solo founder with React Native, Expo Router, TypeScript, Supabase, and Cloudflare.

Se'kret Bip is the product. [Founder Control Room](https://github.com/jussray/founder-control-room) is the operating and evidence layer that governs approvals, changes, deployments, verification, and rollback.

## Current repository truth

**Last refreshed:** 2026-08-15  
**Implementation baseline audited for this documentation:** `802dbcecfa58a9b00e3f2f5605d7161771fd0d81`  
**Current status:** [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md)  
**Launch-status overlay:** [`docs/LAUNCH_GATE_STATUS_2026-07-31.md`](docs/LAUNCH_GATE_STATUS_2026-07-31.md)  
**Current execution:** [`SPRINT.md`](SPRINT.md)

The documentation repair itself may advance `main` beyond the audited implementation baseline without changing application behavior. Always resolve fresh current `main` before making a new exact-head claim.

The older reviewed application baseline `824b4dcffb9e0ffc7468a002f0390cbba98d79ae` remains historical evidence for the scope reviewed at that time. It is **not current `main`** and must not be used as a substitute for a fresh repository lookup.

Recent merged repository work includes:

- fail-closed Cloudflare reconciliation for restoring Pages ownership of `app.sekretbip.net` while preserving `api.sekretbip.net` / `sekret-backend` authority;
- retained sanitized Cloudflare preflight-failure receipts;
- ChatGPT plugin-management contracts with privacy and live-state boundaries;
- recursive hardening against nested live-state claims; and
- an exact-current-main founder command that can dispatch only the existing bounded app-domain reconciler.

### Immediate production gate

The latest exact-main app-domain reconcile evidence on `802dbcecfa58a9b00e3f2f5605d7161771fd0d81` is GitHub Actions run `31857828587`, attempt 3.

Repository-side and exact-main gates passed through credential-presence validation. The provider operation then failed at Cloudflare **`pages-domains-read`** with HTTP **403** / provider code **10000**.

Its retained receipt records:

```text
phase: preflight-failed-before-mutation
mutationState: not-reachable
actions: []
```

So no Cloudflare route/domain deletion, Pages binding change, Worker binding change, or Supabase mutation occurred.

Do not bypass the Pages ownership precondition. The next provider gate is reconciling the Cloudflare API token/account permission needed to read Pages domains, then rerunning the same bounded exact-main reconciliation path.

### Release truth

[P0 issue #696](https://github.com/jussray/Sekret-Bip/issues/696) remains open for exact-production release proof. Its older intended-release SHA and historical receipts do not override current `main`.

Issue #646 is **closed/completed**. Its Cloudflare branch-control evidence remains useful historical/provider proof, but it is not a current open implementation-branch blocker.

Do not infer public launch, deployed exact SHA, or browser readiness from a merge, a build badge, a Worker upload, or an HTTP success alone. Production claims still require the applicable release-marker, Worker, health, browser, device, account, privacy, database, and operational witnesses.

## State → Evidence → Claim

Completion is evidence-bearing, not optimistic UI or documentation copy.

For a material claim, name:

1. the state that changed;
2. the evidence proving it;
3. the authority that produced that evidence; and
4. the boundaries the evidence actually covers.

Keep repository, CI, Cloudflare, Supabase, browser, device, and account witnesses separate.

## Founder Control Room README sync

Founder Control Room owns the README sync decision for nontrivial incidents, fixes, merges, deployment changes, migration changes, validation changes, and authority changes. Record the README impact as `required`, `not_required`, or `deferred_with_reason`.

A zero-step, `steps:null`, or no-log GitHub Actions failure remains `runner_startup_failure` infrastructure evidence, not a code regression and not a pass. Follow [`.control-room/README_SYNC_POLICY.md`](.control-room/README_SYNC_POLICY.md) before claiming the documentation impact is complete.

## Product promise

- Private reflections stay private.
- Teens choose what they share.
- Parent access is relationship-based, not surveillance-based.
- Identity and permission rules are enforced by runtime checks, Supabase policies, and server boundaries rather than UI hiding.
- Operational evidence remains metadata-safe and never becomes a back door into private teen content.

## Product and UX direction

Se'kret Bip is a real premium, living app experience. Cosmic and character art is visual DNA and atmosphere, not the product architecture.

Prioritize:

- interactive product states;
- companions embedded into real flows;
- responsive emotional feedback;
- personalized home behavior;
- clear Teen / Parent / Bip Jr journeys;
- accessible motion and interaction; and
- a coherent mobile design system.

Do not regress the product into a static splash-art-led experience.

## Product areas

### Teen

- Room, Pages, journaling, and voice reflection
- Suhana, Sy, Cloud, and Night companion experiences
- Se'kret continuity presence and rules-based safety boundaries
- Privacy-safe Daily Intentions with Basic, opt-in Personalized, and Off modes
- Calm, Comfort, Mind + Body Reset, and Cloud Thoughts
- Bippin 2, Growth, Insights, History, and Memories
- Period Calendar, points, and rewards infrastructure

### Social and trusted connection

- **Circle** — anonymous or circle-safe community posting
- **Bip Crew** — trusted accountability relationships
- **Bridge** — intentional teen-parent sharing and relationship support
- **Parent Circle** — separate parent-to-parent community space
- no open stranger direct messages

### Parent

Parent routes, account linking, Bridge data contracts, and guarded parent surfaces exist. Parent launch-readiness remains evidence-gated across lifecycle, privacy, production, notification, device, and end-to-end relationship journeys.

Documentation and demos must not imply broader parent visibility than server and RLS layers enforce.

## Current implementation state

> **Release evidence warning:** repository capability does not equal production release. Read [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md) before making current-state, routing, deployment, or launch claims.

### Integrated

- Expo Router auth, onboarding, Teen, Parent, and founder/internal route groups
- Supabase Auth, synchronization, ordered migrations, RLS, Storage, and Edge Functions
- canonical Cloudflare Worker API `sekret-backend`
- canonical Cloudflare Pages project `sekret-bip`
- shared typed frontend-to-Worker contracts and stable failure mapping
- Se'kret identity boundary and versioned companion-style runtime wrapper
- Privacy-safe Daily Intentions
- Mind + Body Reset regulation and workout flows
- Founder Control Room operational data sources and repository capability contracts
- Bridge data model, consent contracts, and controlled rollout paths
- exact production release-verification machinery
- runtime-truth gates that separate repository claims from provider and production witnesses
- fail-closed app-domain reconciliation machinery
- governed plugin-management contracts that do not treat repository configuration as live provider truth

### Verified authorization and security slices

Repository history contains bounded proof for sampled owner/anonymous/cross-user denial, server-only configuration boundaries, service-role-only delivery state, permanent-account restrictions, selected negative-auth contracts, reduced-metadata safety outputs, and selected trigger behavior. Those slices do not imply global authorization or production completeness.

### Planned, not implemented

Unless newer exact implementation proves otherwise:

- durable L4 continuity memory;
- persistent companion goals;
- scheduled reflection jobs;
- relationship phases derived from durable evidence;
- inter-companion coordination;
- L5 cross-companion synthesis and consented autonomous goal proposals.

L5 remains blocked until L4 reaches `verified` under a separately approved consent and authority contract.

## Architecture

- **Frontend:** React Native, Expo Router, TypeScript
- **Routes:** auth, onboarding, Teen, Parent, and founder/internal groups
- **Local state:** React state, context, hooks, and AsyncStorage
- **Cloud data:** Supabase Auth, Postgres, RLS, Storage, Edge Functions, and ordered migrations
- **API layer:** canonical Cloudflare Worker `sekret-backend`
- **Web deployment:** Cloudflare Pages project `sekret-bip`
- **Production verification:** exact commit marker plus Worker check, health probe, production Playwright, and retained evidence
- **Schema source of truth:** `supabase/migrations/`

Legacy compatibility files and historical provider identities are not a second production authority.

## Launch posture

A controlled internal demo may use synthetic or non-sensitive data while unfinished areas are clearly labeled. Controlled alpha and public launch remain separate decisions.

Launch-critical evidence still includes, where applicable:

- exact production routing and release proof;
- founder access and complete real-account auth/onboarding/recovery journeys;
- complete repository type/lint/test/bundle/audit/Playwright proof for the exact candidate;
- remaining live database and high-risk behavior verification;
- controlled production proof for Bridge and Parent relationship journeys;
- account deletion across database, Auth, Storage, caches, relationships, retries, and receipts;
- focused denial and behavior proof for remaining private surfaces;
- physical-device, accessibility, offline, notification, moderation, and failure-state QA;
- legal, safeguarding, app-store, support, incident-response, backup, restore, and rollback readiness.

L4 and L5 are preserved future lanes, not automatic public-launch dependencies.

## Project structure

```text
app/                 Expo Router route groups
screens/             compatibility screen implementations
src/                 components, features, hooks, services, types, utilities
worker/              Cloudflare Worker
supabase/            ordered migrations and Edge Functions
assets/              app artwork and media
docs/                roadmap, architecture, operations, privacy, and evidence
scripts/             audits and validation tools
test/                automated tests
e2e/                 Playwright smoke and guardrail tests
```

## Setup

```bash
gh repo clone jussray/Sekret-Bip
cd Sekret-Bip
npm install --legacy-peer-deps
cp .env.example .env.local
npx expo start --web -c
```

Hydrate Git LFS assets before visual or archive validation:

```bash
git lfs pull
```

### Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not maintain a second schema bootstrap file. Use the ordered migration chain.

## Validation

```bash
npm run type-check
npm test
npm run lint
npm run verify:bundle
npm run audit:control-room
npm run validate:companions
npm run test:e2e
npm run test:e2e:production
npm run verify:prepush
```

Production verification is documented in `DEPLOYMENT.md`. A Playwright test committed to the repository is not proof that it executed against deployed current `main`.

## AI operating contracts

- [`GLOBAL_AI.md`](GLOBAL_AI.md)
- [`AGENTS.md`](AGENTS.md)
- [`CLAUDE.md`](CLAUDE.md)
- [`docs/PROVIDERS.md`](docs/PROVIDERS.md)

Shared founder stack:

```text
/elonmusk /garyvee lindymode redteam l99 redteam ooda /truthmode
```

Project-local instructions may become stricter, but they may not weaken teen privacy, consent, security, provenance, evidence, or rollback.

## Key guides

- `docs/CURRENT_STATUS.md`
- `SPRINT.md`
- `docs/LAUNCH_GATE_STATUS_2026-07-31.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/DOCUMENTATION_MAP.md`
- `docs/WIRING_STATUS.md`
- `DEPLOYMENT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `docs/FOUNDER_CONTROL_ROOM.md`

Dated documents, historical PR bodies, and older SHAs remain evidence for the time they describe. They do not override a fresh current-main lookup.

Documentation is an implementation guardrail. When code, production configuration, evidence, and docs disagree, fix the stale source and preserve the evidence trail.

## License

Copyright © 2024–2026 Juss Ray. All rights reserved.  
Proprietary software — see [LICENSE](LICENSE).
