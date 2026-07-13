# Se'kret Bip 💜

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

> Warm, funny, soft, slightly nosy, and never clinical.

## Source-of-truth documents

- [`implementation-ledger.json`](implementation-ledger.json) — machine-checked feature status and evidence
- [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md) — human-readable current product state
- [`docs/WIRING_STATUS.md`](docs/WIRING_STATUS.md) — runtime, database, and deployment wiring
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — canonical production path and exact-release verification
- [`docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`](docs/security/SUPABASE_AUTHORIZATION_PHASE0.md) — live authorization evidence and remaining blockers

Architecture, roadmap, current-status, and agent-skill changes must update the implementation ledger. CI rejects unsupported implementation claims.

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

## Product areas

### Teen

- Room, Pages, journaling, and voice reflection
- Raylene, Rylane, Cloud, and Night companion experiences
- Se'kret continuity presence and rules-based safety boundaries
- Calm, Comfort, Mind-Body Reset, and Cloud Thoughts
- Bippin 2, Growth, Insights, History, and Memories
- Period Calendar, points, and rewards infrastructure

### Social and trusted connection

- **Circle** — anonymous or circle-safe community posting
- **Bip Crew** — trusted accountability relationships
- **Bridge** — intentional teen-parent sharing and relationship support
- **Parent Circle** — separate parent-to-parent community space
- No open stranger direct messages

### Parent

Parent routes, account linking, Bridge data contracts, and guarded parent surfaces exist. The parent product remains in progress until lifecycle states, Bridge production proof, Parent Circle boundaries, Parent Coach boundaries, notifications, and end-to-end privacy evidence are complete. Documentation and demos must not imply broader parent visibility than the server and RLS layers enforce.

## Current implementation state

### Integrated

- Expo Router teen and parent route groups
- Supabase Auth, synchronization, migrations, RLS, Storage, and Edge Functions
- Cloudflare Worker API, AI reply, transcription, TTS, and metadata-only telemetry
- Se'kret identity boundary and versioned companion-style runtime wrapper
- Founder Control Room operational data sources
- Bridge data model, consent contracts, and controlled rollout paths
- Exact production release verification using Worker checks, `release.json`, health verification, and read-only production Playwright

### Verified authorization slices

- Owner access and anonymous/cross-user denial proof for sampled private tables
- Server-only configuration tables with zero client grants and preserved rows
- JWT-protected HTTP 410 retirement of obsolete release/probe Edge Functions
- `notification_deliveries` documented and verified as service-role-only

### Planned, not implemented

- Durable L4 continuity memory
- Persistent companion goals
- Scheduled reflection jobs
- Inter-companion coordination
- Relationship phases derived from durable evidence

See `implementation-ledger.json` for exact status, evidence, rollout controls, and blockers.

## Architecture

- **Frontend:** React Native, Expo Router, TypeScript
- **Routes:** separate teen and parent route groups
- **Local state:** React state, context, hooks, and AsyncStorage
- **Cloud data:** Supabase Auth, Postgres, RLS, Storage, Edge Functions, and ordered migrations
- **API layer:** canonical Cloudflare Worker `sekret-backend`
- **Web deployment:** Cloudflare Pages project `sekret-bip`
- **Production verification:** exact commit marker plus Worker check, health probe, and production Playwright
- **Schema source of truth:** `supabase/migrations/`

Legacy compatibility files are not a second production authority.

## Companion intelligence

The current companion system supports short-term conversation history and approved context. The production Worker and TTS paths consume the canonical identity and style contracts. Durable semantic memory, goals, scheduled reflection, and inter-companion coordination remain blocked until their schema, provenance, correction, expiry, deletion, RLS, runtime use, and denial tests exist.

## Release posture

A controlled internal demo may use synthetic or non-sensitive data while unfinished areas are clearly labeled. Public launch, app-store release, or production teen-data collection remains blocked until the applicable legal, parent/Bridge, deletion, authorization, safety, accessibility, and operational gates have evidence.

Current high-priority blockers include:

1. controlled production proof for Bridge and parent relationship journeys;
2. behavior tests for high-blast-radius authenticated database functions;
3. negative tests for the two remaining custom-auth Edge Functions;
4. password-breach protection planning and Auth regression evidence;
5. account deletion and privacy lifecycle completion;
6. L4 continuity work only after its authorization boundary is approved.

## Project structure

```text
app/                 Expo Router route groups
screens/             compatibility screen implementations
src/                 components, features, hooks, services, types, utilities
worker/              Cloudflare Worker
supabase/            ordered migrations and Edge Functions
assets/              app artwork and media
docs/                architecture, operations, privacy, and implementation guidance
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
```

Full repository gate:

```bash
npm run verify:prepush
```

Production verification is documented in `DEPLOYMENT.md`.

## Key guides

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

Private project.
