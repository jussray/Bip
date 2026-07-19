# Se'kret Bip 💜

> **Copyright © 2024–2026 Juss Ray. All rights reserved.**  
> Proprietary software. No license to use, copy, modify, or distribute is granted. See [LICENSE](LICENSE).

---

## The real story

I'm a single mom of 8 in Pittsburgh building a mental wellness app for teens — at $0, no team, no VC, no co-founder. Just me, my kids, real teen users already waiting on the app, and a system I built myself because I couldn't afford to outsource it.

Se'kret Bip is the product. The [Founder Control Room](https://github.com/jussray/founder-control-room) is the operating system I built to govern it. Every approval, every deploy, every change proposal goes through a system I designed from scratch while raising 8 kids.

This isn't a side project. This is the whole thing.

---

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

## Code audit status

A repository-wide code audit is in progress. The project has substantial automated verification, authorization evidence, release metadata, and privacy guardrails, but those controls do not mean the product is ready for public launch.

Current launch blockers remain authoritative: complete account deletion across every storage and relationship boundary; production proof for Bridge and parent journeys; remaining negative-authorization tests; physical-device, accessibility, offline, notification, moderation, recovery, incident-response, backup, restore, and rollback validation. Planned L4/L5 intelligence must not be represented as implemented or production-ready.

See `docs/LAUNCH_ROADMAP.md`, `SPRINT.md`, `docs/CURRENT_STATUS.md`, and `implementation-ledger.json` for current evidence and status.

### Current production signup evidence

On July 18, 2026, [PR #517](https://github.com/jussray/Sekret-Bip/pull/517) merged bounded recovery for ambiguous Supabase Auth signup timeouts. It prevents raw browser-level `Failed to fetch` errors from stranding users when a request may have reached Auth, performs one bounded recovery probe, and includes a Playwright regression that blocks real Auth mutation.

[PR #518](https://github.com/jussray/Sekret-Bip/pull/518) then merged a read-only production-browser reachability test for the configured Supabase Auth boundary. The static contract passed locally. Exact live execution against `sekretbip.net` remains pending because GitHub Actions has not produced normal hosted-runner evidence for the merged head.

Founder Control Room [issue #514](https://github.com/jussray/Sekret-Bip/issues/514) remains the authoritative incident record until hosted Playwright executes and passes. Zero-step or no-log failures remain classified as `runner_startup_failure` infrastructure evidence, not a code regression.

> Warm, funny, soft, slightly nosy, and never clinical.

## Start here

- [`docs/LAUNCH_ROADMAP.md`](docs/LAUNCH_ROADMAP.md) — visual path from the current foundation to controlled alpha and public launch
- [`SPRINT.md`](SPRINT.md) — current execution window, blockers, order, and definition of done
- [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md) — human-readable current product state
- [`docs/DOCUMENTATION_MAP.md`](docs/DOCUMENTATION_MAP.md) — which documents are authoritative and how stale plans are handled
- [`implementation-ledger.json`](implementation-ledger.json) — machine-checked feature status and evidence
- [`docs/WIRING_STATUS.md`](docs/WIRING_STATUS.md) — runtime, database, and deployment wiring
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — canonical production path and exact-release verification
- [`docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`](docs/security/SUPABASE_AUTHORIZATION_PHASE0.md) — live authorization evidence and remaining blockers
- [`docs/FOUNDER_CONTROL_ROOM.md`](docs/FOUNDER_CONTROL_ROOM.md) — founder-only operational system and evidence model
- [`.control-room/README_SYNC_POLICY.md`](.control-room/README_SYNC_POLICY.md) — Founder Control Room README sync ownership and completion gate

Architecture, roadmap, current-status, sprint, and agent-skill changes must reconcile the implementation ledger. CI rejects unsupported implementation claims.

Founder Control Room owns the README sync decision for nontrivial incidents, fixes, merges, deployment changes, migration changes, validation changes, and authority changes. Every such change must record README impact as `required`, `not_required`, or `deferred_with_reason`. When impact is `required`, update this README in the same pull request whenever practical and keep merged code, local verification, hosted verification, deployment, and live production proof distinct.

## AI operating contracts

- [`GLOBAL_AI.md`](GLOBAL_AI.md) — provider-neutral founder and product contract
- [`AGENTS.md`](AGENTS.md) — Codex, ChatGPT, and repository-agent instructions
- [`CLAUDE.md`](CLAUDE.md) — verified design-system and Figma integration reference
- [`docs/PROVIDERS.md`](docs/PROVIDERS.md) — provider boundaries

Shared founder stack:

```text
/garyvee lindymode redteam l99 redteam ooda
```

The first red-team pass attacks the premise and evidence. The second attacks implementation, privacy blast radius, rollback, and proof. Project-local instructions may become stricter, but they may not weaken teen privacy, consent, security, provenance, evidence, or rollback.

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
- Raylene, Rylane, Cloud, and Night companion experiences
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

Parent routes, account linking, Bridge data contracts, and guarded parent surfaces exist. The parent product remains in progress until lifecycle states, Bridge production proof, Parent Circle boundaries, Parent Coach boundaries, notifications, device QA, and end-to-end privacy evidence are complete. Documentation and demos must not imply broader parent visibility than the server and RLS layers enforce.

## Current implementation state

### Integrated

- Expo Router teen and parent route groups
- Supabase Auth, synchronization, migrations, RLS, Storage, and Edge Functions
- Cloudflare Worker API, AI reply, transcription, TTS, and metadata-only telemetry
- Shared typed frontend-to-Worker contracts and stable failure mapping
- Se'kret identity boundary and versioned companion-style runtime wrapper
- Privacy-safe Daily Intentions with local deterministic generation and owner-only durable records
- Mind + Body Reset regulation and workout flows
- Founder Control Room operational data sources and repository capability contracts
- Bridge data model, consent contracts, and controlled rollout paths
- Exact production release verification using Worker checks, `release.json`, health verification, production Playwright, and retained evidence
- Runtime-truth gates that compare repository claims with live Supabase and deployment witnesses

### Verified authorization and security slices

- Owner access and anonymous/cross-user denial proof for sampled private tables
- Server-only configuration tables with zero client grants and preserved rows
- JWT-protected HTTP 410 retirement of obsolete release/probe Edge Functions
- `notification_deliveries` documented and verified as service-role-only
- Permanent-account restrictions for sampled private self-data
- Fail-closed negative-auth contracts for `account-delete` and `safety-scan`
- Safety-scan contract limiting durable output to reduced metadata rather than raw content

### Planned, not implemented

- Durable L4 continuity memory
- Persistent companion goals
- Scheduled reflection jobs
- Relationship phases derived from durable evidence
- Inter-companion coordination
- L5 cross-companion synthesis and consented autonomous goal proposals

L5 is explicitly blocked until L4 reaches `verified`. See `implementation-ledger.json` and `docs/AGENT_L4_ARCHITECTURE.md` for the exact boundary.

## Architecture

- **Frontend:** React Native, Expo Router, TypeScript
- **Routes:** separate teen and parent route groups
- **Local state:** React state, context, hooks, and AsyncStorage
- **Cloud data:** Supabase Auth, Postgres, RLS, Storage, Edge Functions, and ordered migrations
- **API layer:** canonical Cloudflare Worker `sekret-backend`
- **Web deployment:** Cloudflare Pages project `sekret-bip`
- **Production verification:** exact commit marker plus Worker check, health probe, production Playwright, and retained evidence
- **Schema source of truth:** `supabase/migrations/`

Legacy compatibility files are not a second production authority.

## Companion intelligence

The current companion system supports short-term conversation history and approved context. The production Worker and TTS paths consume canonical identity and style contracts.

Durable semantic memory, goals, scheduled reflection, relationship phases, and inter-companion coordination remain blocked until their ownership, provenance, correction, expiry, deletion, consent, RLS, runtime use, denial tests, rollout, telemetry, and rollback exist. L4 and L5 must not be invented as parallel implementations ahead of those boundaries.

## Launch posture

The canonical phase map is [`docs/LAUNCH_ROADMAP.md`](docs/LAUNCH_ROADMAP.md). The current execution order is [`SPRINT.md`](SPRINT.md).

A controlled internal demo may use synthetic or non-sensitive data while unfinished areas are clearly labeled. Controlled alpha and public launch remain separate decisions.

Current launch-critical blockers include:

1. controlled production proof for Bridge and parent relationship journeys;
2. account deletion across database, Auth, Storage, local caches, relationship access, retries, and isolation;
3. focused denial proof for remaining launch-critical private surfaces;
4. behavior tests for remaining high-blast-radius authenticated database functions;
5. password-breach protection planning and Auth regression evidence;
6. physical-device, accessibility, offline, notification, moderation, and failure-state QA;
7. legal, safeguarding, app-store, support, incident-response, backup, restore, and rollback readiness;
8. exact production evidence for features still marked integrated rather than verified or released.

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
```

Full repository gate:

```bash
npm run verify:prepush
```

Production verification is documented in `DEPLOYMENT.md`. Production Playwright must distinguish a test committed to the repository from a test that actually executed against the deployed exact head.

## Key guides

- `docs/LAUNCH_ROADMAP.md`
- `docs/DOCUMENTATION_MAP.md`
- `SPRINT.md`
- `docs/CURRENT_STATUS.md`
- `docs/WIRING_STATUS.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/SUPABASE.md`
- `docs/BRIDGE_CONNECTION_AUDIT.md`
- `docs/AGENT_L4_ARCHITECTURE.md`
- `docs/RLS_POLICY_AUDIT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `docs/FOUNDER_CONTROL_ROOM.md`
- `.control-room/README_SYNC_POLICY.md`
- `DEPLOYMENT.md`

Documentation is an implementation guardrail. When code, production configuration, and docs disagree, fix the stale source and preserve the evidence trail.

## License

Copyright © 2024–2026 Juss Ray. All rights reserved.  
Proprietary software — see [LICENSE](LICENSE).
