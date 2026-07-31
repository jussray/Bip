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

**Last refreshed:** 2026-07-31  
**Reviewed application baseline:** `824b4dcffb9e0ffc7468a002f0390cbba98d79ae`  

This is the last reviewed application-code baseline; later documentation-only merges may advance `main` without changing application evidence.
**Active launch gate:** [`docs/LAUNCH_GATE_STATUS_2026-07-31.md`](docs/LAUNCH_GATE_STATUS_2026-07-31.md)

The current repository has merged the onboarding repair (PR #595), Crew invite contract (PR #596), restored-session fail-closed boundary (PR #688), main-contract repair (PR #691), Cloudflare operator-document reconciliation (PR #695), password-recovery route continuity (PR #698), the reconstructed Calm mood/plan controls repair (PR #700), canonical companion naming in Settings (PR #701), and the repository failure-truth, branch-hygiene, and post-merge gate-verification auditors (PR #703, #704, #706).

**Public launch is blocked** on two open founder gates:

- [P0 issue #696](https://github.com/jussray/Sekret-Bip/issues/696) — neither public release-marker URL returns JSON, so an exact deployed frontend commit cannot be claimed.
- [Issue #646](https://github.com/jussray/Sekret-Bip/issues/646) — Cloudflare branch controls for the production-named Workers are not yet proven main-only; ordinary PR branches have repeatedly triggered automatic production deployments before merge.

Current drafts remain evidence-gated:

- PR #698: password-recovery route continuity is merged; PR #690 is closed as the preserved historical candidate.
- PR #692: Calm controls; closed and preserved as historical source after its implementation was reconstructed as a focused branch and merged via PR #700.

Read the launch-gate status before making current-state, deployment, or launch claims. Historical milestones below are preserved context; they do not override the reviewed ref or live evidence above.

## Founder Control Room README sync

Founder Control Room owns the README sync decision for nontrivial incidents, fixes, merges, deployment changes, migration changes, validation changes, and authority changes. Record the README impact as `required`, `not_required`, or `deferred_with_reason`. When the value is `required`, update this README in the same pull request whenever practical and keep repository, hosted-check, deployment, database, browser, and device witnesses distinct.

A zero-step or no-log GitHub Actions failure remains `runner_startup_failure` infrastructure evidence, not a code regression. Follow [`.control-room/README_SYNC_POLICY.md`](.control-room/README_SYNC_POLICY.md) before claiming the documentation impact is complete.

## Historical merged progress (preserved context)

### Canonical onboarding-state and verification repair

PR #595 merged at `f0669991807106f01bd8bcedc3fbc00986f5ae3b`.

It repaired the active onboarding path so it targets `user_onboarding_state`, checks Supabase failures, prevents conflicting or regressive state writes, waits for confirmed writes before navigation, preserves historical import paths as compatibility re-exports, clears the known TypeScript and prototype-lint blockers, and adds an exact-head onboarding verification workflow.

This proves the repository repair was merged. It does not by itself prove the live database, a production deployment, founder access on a physical device, or a complete real-account onboarding journey.

### Authenticated RPC behavior contracts

PR #596 merged at `1239841a5e3474cdc1108c255bf1eb138f8a9a97`.

It added positive and negative source-contract coverage for `redeem_crew_invite(text, text)`, including authentication, invite-state, self-linking, blocked-relationship, profile-completion, and server-owned display-name boundaries.

That is static repository contract evidence, not live Supabase execution proof. The remaining untested high-blast-radius authenticated RPCs stay in the verification queue.

### Bridge Learning Oracle grounding boundary

PR #600 merged at `da87cc9e679f67d5d60105f33d8d372da990108c`.

It documents search-grounded Oracle teaching as a planned future slice, not an implemented feature. No endpoint, provider call, schema, secret, deployment, or teen-facing runtime was added.

### Trigger behavior proof phase 1

PR #601 merged at `0ada7d9e7f91c36fee38452f036b663536ecaae5`.

A rollback-contained live Supabase probe verified the documented behavior of four bounded `SECURITY DEFINER` trigger functions. Seven checks passed and a follow-up read confirmed that no synthetic rows remained.

The repository intentionally keeps global live-behavior verification false because other reviewed triggers remain untested, undeployed, live-only drift, or too high-risk for the same probe method.

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

> **Release evidence warning:** [#696](https://github.com/jussray/Sekret-Bip/issues/696) is open. Repository machinery and local build output exist, but the live Pages marker currently does not return JSON. Do not read this implementation inventory as a production-release claim.

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
- Exact production release verification machinery using Worker checks, `/.well-known/sekret-release.json`, health verification, production Playwright, and retained evidence
- Runtime-truth gates that compare repository claims with live Supabase and deployment witnesses

### Verified authorization and security slices

- owner access and anonymous/cross-user denial proof for sampled private tables;
- server-only configuration tables with zero client grants and preserved rows;
- JWT-protected HTTP 410 retirement of obsolete release/probe Edge Functions;
- `notification_deliveries` verified as service-role-only;
- permanent-account restrictions for sampled private self-data;
- fail-closed negative-auth source contracts for `account-delete` and `safety-scan`;
- safety-scan durable output restricted to reduced metadata;
- structural trigger inventory and migration-history parity improvements;
- rollback-contained live behavior proof for four bounded `SECURITY DEFINER` trigger functions.

### Planned, not implemented

- durable L4 continuity memory;
- persistent companion goals;
- scheduled reflection jobs;
- relationship phases derived from durable evidence;
- inter-companion coordination;
- L5 cross-companion synthesis and consented autonomous goal proposals;
- Bridge Learning Oracle search grounding and teaching endpoint.

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

1. founder access recovery plus a complete real-account onboarding journey on a physical device;
2. complete repository type, lint, test, bundle, audit, and Playwright proof against the exact release candidate;
3. remaining live migration, catalog, and behavior verification for trigger-history repairs and high-risk database functions;
4. controlled production proof for Bridge and parent relationship journeys;
5. account deletion across database, Auth, Storage, caches, relationship access, retries, receipts, and isolation;
6. focused denial and behavior proof for remaining private surfaces and high-blast-radius RPCs;
7. controlled trigger assurance for paths with external effects or `auth.users` writes;
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
