# Se'kret Bip 💜

🌐 **Official site:** [sekretbip.net](https://sekretbip.net)

> **Copyright © 2024–2026 Juss Ray. All rights reserved.**  
> Proprietary software. No license to use, copy, modify, or distribute is granted. See [LICENSE](LICENSE).

---

## The real story

I'm a single mom of 8 in Pittsburgh building a mental wellness app for teens at $0, with no team, VC, or co-founder. Just me, my kids, real teen users waiting on the app, and an operating system I built because I could not afford to outsource the work.

Se'kret Bip is the product. The [Founder Control Room](https://github.com/jussray/founder-control-room) is the operating system that governs approvals, changes, deployments, evidence, and rollback.

This is not a side project. This is the whole thing.

---

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

## Current repository truth

**Last refreshed:** July 23, 2026  
**Reviewed `main`:** `9cd5d6d4641160b9425320e31482a4bd05eb25c2`

Read these before making current-state claims:

- [`docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`](docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md)
- [`SPRINT.md`](SPRINT.md)
- [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md)
- [`docs/WIRING_STATUS.md`](docs/WIRING_STATUS.md)
- [`docs/DOCUMENTATION_MAP.md`](docs/DOCUMENTATION_MAP.md)
- [`implementation-ledger.json`](implementation-ledger.json)

Any summary that describes the app as a one-file prototype, missing `app/`, missing Supabase Auth, or missing Expo Router route groups is stale unless it names the exact old commit it inspected.

Keep these proof layers separate:

- repository code;
- local checks;
- exact-head GitHub checks;
- checks against the merge SHA on `main`;
- Cloudflare build or deployment evidence;
- live Supabase migrations and authorization evidence;
- production-browser evidence;
- physical-device and real-account evidence;
- Figma, Canva, screenshots, and static design evidence.

A green signal in one layer does not silently prove the others.

## Founder Control Room README sync

Founder Control Room owns the README sync decision for nontrivial incidents, fixes, merges, deployment changes, migration changes, validation changes, and authority changes. Record the README impact as `required`, `not_required`, or `deferred_with_reason`. When the value is `required`, update this README in the same pull request whenever practical and keep repository, hosted-check, deployment, database, browser, and device witnesses distinct.

A zero-step or no-log GitHub Actions failure remains `runner_startup_failure` infrastructure evidence, not a code regression. Follow [`.control-room/README_SYNC_POLICY.md`](.control-room/README_SYNC_POLICY.md) before claiming the documentation impact is complete.

## Latest merged progress

### Polished web welcome front door

PR #594 merged the responsive polished welcome screen into the Expo web root.

Its exact head `e3f8f38bced1e3a5b27ef9fd35a3d5b06019ba9c` passed:

- Cookie Contract Mirror;
- Front Door Exact-Head Gate;
- no-new-TypeScript-diagnostics comparison against its base;
- focused Playwright for render, click and keyboard entry, age-bucket continuation, and narrow-phone overflow.

That proves the scoped PR head. It does not by itself prove the later merge SHA, `sekretbip.net`, Supabase Auth, RLS, native devices, or a complete founder-access journey.

### Test and trigger-history repair

PR #577 merged into `main` at `9cd5d6d4641160b9425320e31482a4bd05eb25c2`.

It repaired 18 failing or stale unit-test assertions, aligned the `expo-splash-screen` lockfile range, repaired the forgot-password JSX string, and improved migration-history parity for reviewed trigger functions.

The PR reported 877 passing unit tests locally. The complete repository gate did not execute against the merge commit on `main`.

### Canonical companion names

Suhana and Sy are the canonical display/canon names.

Legacy identifiers `raylene` and `rylane` remain only where database, storage, route, fixture, analytics, or saved-state compatibility requires them. User-facing and AI-facing paths must normalize legacy values instead of leaking retired display names.

## Current repair queue

### PR #595 — onboarding-state and type-check repair

Draft PR #595 reports that active onboarding screens use `src/services/onboarding.ts`, which targets `onboarding_state`, a table that no repository migration creates. The real hardened table is `user_onboarding_state`.

It also reports that active screens call `markActivated()` while the current active service does not define it, and that a more complete duplicate implementation exists outside the active import path.

Until reviewed and merged, treat this as an open runtime risk.

The branch reports 906 passing unit tests locally, one remaining TypeScript error from an unused Apple sign-in component importing an uninstalled package, and two pre-existing prototype lint errors.

### PR #596 — Crew invite RPC behavior contract

Draft PR #596 adds static positive and negative contract coverage for `redeem_crew_invite(text, text)` and reports 911 passing unit tests locally. No exact-head GitHub Actions run is attached yet.

Draft PR bodies and local reports are proposed evidence, not merged or independently verified truth.

## Why Se'kret Bip exists

Teens need room to process emotions, build habits, and ask for support without feeling watched. Parents need a healthier way to stay connected without unrestricted access to private reflections.

Se'kret Bip is designed around that tension: private by default, intentional sharing by choice, and relationship-based support instead of surveillance.

## Product promise

- Private reflections stay private.
- Teens choose what they share.
- Parent access is relationship-based, not surveillance-based.
- Identity and permission rules are enforced by runtime checks, Supabase policies, and server boundaries rather than UI hiding.
- Operational evidence remains metadata-safe and never becomes a back door into private teen content.

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
- No open stranger direct messages

### Parent

Parent routes, account linking, Bridge data contracts, and guarded parent surfaces exist. The parent product remains in progress until lifecycle states, Bridge production proof, Parent Circle boundaries, Parent Coach boundaries, notifications, device QA, and end-to-end privacy evidence are complete.

Documentation and demos must not imply broader parent visibility than the server and RLS layers enforce.

## Current implementation state

### Integrated

- Expo Router auth, onboarding, teen, parent, and founder/internal route groups
- Supabase Auth, synchronization, migrations, RLS, Storage, and Edge Functions
- Cloudflare Worker API, AI reply, transcription, TTS, and metadata-only telemetry
- Shared typed frontend-to-Worker contracts and stable failure mapping
- Se'kret identity boundary and versioned companion-style runtime wrapper
- Privacy-safe Daily Intentions with local deterministic generation and owner-only durable records
- Mind + Body Reset regulation and workout flows
- Founder Control Room operational data sources and repository capability contracts
- Bridge data model, consent contracts, and controlled rollout paths
- Exact production release verification machinery using Worker checks, `release.json`, health verification, production Playwright, and retained evidence
- Runtime-truth gates that compare repository claims with live Supabase and deployment witnesses

### Verified authorization and security slices

- owner access and anonymous/cross-user denial proof for sampled private tables;
- server-only configuration tables with zero client grants and preserved rows;
- JWT-protected HTTP 410 retirement of obsolete release/probe Edge Functions;
- `notification_deliveries` verified as service-role-only;
- permanent-account restrictions for sampled private self-data;
- fail-closed negative-auth source contracts for `account-delete` and `safety-scan`;
- safety-scan durable output restricted to reduced metadata;
- structural trigger inventory and migration-history parity improvements.

### Planned, not implemented

- durable L4 continuity memory;
- persistent companion goals;
- scheduled reflection jobs;
- relationship phases derived from durable evidence;
- inter-companion coordination;
- L5 cross-companion synthesis and consented autonomous goal proposals.

L5 is blocked until L4 reaches `verified`.

## Architecture

- **Frontend:** React Native, Expo Router, TypeScript
- **Routes:** auth, onboarding, teen, parent, and founder/internal groups
- **Local state:** React state, context, hooks, and AsyncStorage
- **Cloud data:** Supabase Auth, Postgres, RLS, Storage, Edge Functions, and ordered migrations
- **API layer:** canonical Cloudflare Worker `sekret-backend`
- **Web deployment:** Cloudflare Pages project `sekret-bip`
- **Production verification:** exact commit marker plus Worker check, health probe, production Playwright, and retained evidence
- **Schema source of truth:** `supabase/migrations/`

Legacy compatibility files are not a second production authority.

## Launch posture

A controlled internal demo may use synthetic or non-sensitive data while unfinished areas are clearly labeled. Controlled alpha and public launch remain separate decisions.

Current launch-critical blockers include:

1. canonical onboarding-state repair and founder access recovery on a real device;
2. complete repository type, lint, test, bundle, audit, and Playwright proof;
3. live migration and catalog verification for recent trigger-history repairs;
4. controlled production proof for Bridge and parent relationship journeys;
5. account deletion across database, Auth, Storage, caches, relationship access, retries, receipts, and isolation;
6. focused denial and behavior proof for remaining private surfaces and high-blast-radius RPCs;
7. trigger behavioral assurance with controlled external effects;
8. physical-device, accessibility, offline, notification, moderation, and failure-state QA;
9. legal, safeguarding, app-store, support, incident-response, backup, restore, and rollback readiness;
10. exact production evidence for features still marked integrated rather than verified or released.

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

Production verification is documented in `DEPLOYMENT.md`. Production Playwright must distinguish a test committed to the repository from a test that actually executed against the deployed exact head.

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

- `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/DOCUMENTATION_MAP.md`
- `SPRINT.md`
- `docs/CURRENT_STATUS.md`
- `docs/WIRING_STATUS.md`
- `DEPLOYMENT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `docs/FOUNDER_CONTROL_ROOM.md`

Documentation is an implementation guardrail. When code, production configuration, evidence, and docs disagree, fix the stale source and preserve the evidence trail.

## License

Copyright © 2024–2026 Juss Ray. All rights reserved.  
Proprietary software — see [LICENSE](LICENSE).
