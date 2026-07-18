# Se'kret Bip 💜

> **Copyright © 2024–2026 Juss Ray. All rights reserved.**
> This is proprietary software. No license to use, copy, modify, distribute,
> sublicense, or create derivative works is granted. See [LICENSE](LICENSE).

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

## Code audit status

A repository-wide code audit is in progress. The project has substantial automated verification, authorization evidence, release metadata, and privacy guardrails, but those controls do not mean the product is ready for public launch.

Current launch blockers remain authoritative: complete account deletion across every storage and relationship boundary; production proof for Bridge and parent journeys; remaining negative-authorization tests; physical-device, accessibility, offline, notification, moderation, recovery, incident-response, backup, restore, and rollback validation. Planned L4/L5 intelligence must not be represented as implemented or production-ready.

See `docs/LAUNCH_ROADMAP.md`, `SPRINT.md`, `docs/CURRENT_STATUS.md`, and `implementation-ledger.json` for current evidence and status.


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

Architecture, roadmap, current-status, sprint, and agent-skill changes must reconcile the implementation ledger. CI rejects unsupported implementation claims.

## AI operating contracts

- [`GLOBAL_AI.md`](GLOBAL_AI.md) — provider-neutral founder and product contract
- [`AGENTS.md`](AGENTS.md) — Codex, ChatGPT, and repository-agent instructions
- [`CLAUDE.md`](CLAUDE.md) — verified design-system and Figma integration reference
- [`docs/PROVIDERS.md`](docs/PROVIDERS.md) — provider boundaries
- [`.agents/skills/bip-control-room/SKILL.md`](.agents/skills/bip-control-room/SKILL.md) — canonical 5W1H behavior and guarded Control Room execution boundary

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

### Founder Control Room

To start the founder-only Control Room with live, guarded local mission buttons:

```bash
npm run control-room:dev
```

The command starts Expo web and a loopback-only local agent with an ephemeral token. The UI can run only the documented allowlisted verification and recovery missions; timed-out missions terminate their descendant process tree before another mission can start. Real Playwright runs retain JSON, HTML, traces, screenshots, and videos under `reports/control-room/playwright/<run-id>/`.

The founder-only **Founder Operator** surface turns a mission into a 5W1H artifact plan and may persist it only through the authenticated loopback endpoint. Persistence is append-only for versioned history, rejects private or credential-shaped fields, unsafe artifact paths and symlinks, unsupported schemas, unverified hosted/deployed evidence levels, and approval-gated artifacts falsely marked complete. Recording approval does not execute or verify the external action. Release deployment remains a manual, exact-head gate. See `docs/CONTROL_ROOM.md` and `docs/CONTROL_ROOM_FOUNDER_OPERATOR.md`.

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
```

Full repository gate:

```bash
npm run verify:prepush
```

Production verification is documented in `DEPLOYMENT.md`.

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
- `DEPLOYMENT.md`

Documentation is an implementation guardrail. When code, production configuration, and docs disagree, fix the stale source and preserve the evidence trail.

## License

Copyright © 2024–2026 Juss Ray. All rights reserved.  
Proprietary software — see [LICENSE](LICENSE).
