# Se'kret Bip 💜

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

> Cool cousin energy: warm, slightly nosy, funny, soft, never clinical.
>
> Dark-night scrapbook visuals, private rooms, taped notes, stickers, clouds, moonlight, and companion-led support.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/jussray/Bip?quickstart=1)

## Product Promise

Se'kret Bip is designed around four rules:

- **Privacy by default** — private journals, Voice Bip, AI companion chats, and private memories stay private.
- **Support by choice** — teens decide what they explicitly share through Bridge, Parent Pages, and other supported surfaces.
- **Protection by architecture** — identity, verification, permissions, safety events, and parent visibility are modeled centrally rather than patched into individual screens.
- **Parents verify safety, not thoughts** — parent access is event-based and consent-based, never surveillance-based.

## Core Product Areas

### Teen experience

- **Room / User Room** — personal emotional home with companion and time-of-day room scenes
- **Pages** — private journal and scrapbook creation
- **Voice Bip** — voice-first reflection and companion response flows
- **Se'kret companions** — Raylene, Rylane, Cloud, Night, and Oracle experiences
- **Calm / Comfort / MindBody Reset** — grounding and coping tools
- **Cloud Thoughts** — quiet thought space
- **Bippin 2** — growth, development, and identity support; Manhood/Womanhood concepts are being folded into this system
- **Growth / Insights / History / Memories** — private progress and reflection systems
- **Period Calendar** — private cycle tracking
- **Points / Rewards** — positive habit and participation rewards

### Social and trusted connection

- **Circle** — anonymous or circle-safe community posting
- **Bip Crew** — trusted mutual accountability relationships
- **Connection Hub** — managed relationship and connection surfaces
- **Bridge / Parent Bridge** — teen-controlled support sharing
- **Parent Circle** — parent-to-parent support space
- **Messages** — bounded app communication; the product does not support open stranger DMs

### Safety

- **Age gate and trusted-adult verification**
- **Limited Mode** before verification
- **Report and block flows**
- **Emergency shutoff and safety check-ins**
- **Suspicious-behavior detection architecture**
- **Parent Doorbell events** — safety and verification summaries without private teen content
- **Account deletion request and grace-period flow**
- **Row Level Security and private storage policies in Supabase**

## Identity and Privacy Model

Bip keeps different identity contexts separate:

- **Account identity** — private authenticated account facts
- **Circle identity** — safe social display name and avatar per circle
- **Crew identity** — trusted relationship presentation and support preferences
- **Parent connection identity** — relationship and verification metadata only

Public Circle surfaces must never fall back to a teen's real account name.

Parent-visible data must never include:

- raw journal text
- Voice Bip transcripts
- AI companion chat content
- private memories
- private notes
- private message bodies

## Current Architecture

- **Frontend:** React Native + Expo Router + TypeScript
- **State:** local React state and AsyncStorage for offline/local experiences, with Supabase-backed sync for supported account data
- **Backend:** Supabase Auth, Postgres, Row Level Security, Storage, migrations, and Edge Functions
- **Worker/API layer:** Cloudflare Worker services for selected AI and app integrations
- **Navigation:** Expo Router with ongoing migration toward domain route groups
- **Styling:** React Native StyleSheet, design tokens, scrapbook/night visual system
- **Assets:** companion art, room scenes, splash screens, stickers, and design references under `assets/` and `design-references/`

## Architecture Roadmap

The current roadmap is architecture-first so every new screen inherits the same privacy and trust rules.

1. **Identity foundation**
   - `AccountIdentity`
   - `CircleIdentity`
   - `CrewIdentity`
   - `ProfileMemory`

2. **Verification state machine**
   - unverified
   - pending parent/trusted adult
   - limited mode
   - verified teen
   - expired
   - manual review
   - suspended

3. **Domain route groups**
   - `(auth)`
   - `(teen)`
   - `(parent)`
   - `(profile)`
   - `(safety)`
   - `(social)`

4. **Front door and onboarding**
   - Welcome
   - Sign up / Login
   - Teen onboarding
   - Parent onboarding
   - Parent link verification
   - Limited Mode

5. **Shared safety services**
   - Doorbell events
   - report/block services
   - emergency flow
   - suspicious behavior signals
   - parent-safe payload redaction

6. **Profile and identity platform**
   - profile
   - Circle identity management
   - avatar customization
   - room themes
   - privacy settings

7. **Figma-led screen expansion**
   - onboarding and verification screens first
   - safety and Parent Doorbell screens next
   - profile and parent platform screens after trust architecture is stable
   - search, discover, post detail, and reply threads later

## Project Structure

```text
Bip/
├── app/                       # Expo Router route entry points
├── screens/                   # Full-page screen implementations
├── src/
│   ├── components/            # Shared UI and safety components
│   ├── context/               # App context
│   ├── features/              # Domain feature logic
│   ├── hooks/                 # App hooks
│   ├── services/              # AI, permissions, verification, safety, sync helpers
│   ├── types/                 # Canonical TypeScript domain models
│   └── utils/                 # Shared utilities and sync helpers
├── components/                # Legacy/shared UI still being migrated
├── constants/                 # Theme, images, voice, and design constants
├── context/                   # Root-level app context (pre-src/ legacy)
├── hooks/                     # Existing shared hooks
├── utils/                     # Storage, API, Supabase, and compatibility utilities
├── services/                  # Oracle, Se'kret memory/voice, audio, and Piper TTS service code
├── types/                     # Root-level shared TypeScript models (bridge, circle, oracle, privacy…)
├── worker/                    # Cloudflare Worker source (entry: worker/observed-index.ts, per wrangler.toml)
├── supabase/
│   ├── functions/             # Edge Functions (account deletion flow, release-health, safety-scan)
│   └── migrations/            # Single source of truth for schema — see docs/SUPABASE.md
├── db/                        # storage.sql only (Supabase Storage bucket policies) — db/schema.sql was retired
├── assets/images/             # Companion, room, splash, and screen artwork
├── design-references/         # Visual reference assets
├── figma/                     # Figma plugin (code.js/manifest.json) for design sync
├── tools/                     # Standalone dev tooling (e.g. figma-vibe-builder)
├── test/                      # node:test suite (`npm test`)
├── scripts/                   # Audit, validation, and CI-support scripts
├── docs/                      # Implementation, safety, and asset guardrails — see Guides below
├── .github/workflows/         # CI, regression, and deployment workflows
├── .env.example               # Environment template
└── app.json                   # Expo configuration
```

## Backend & Deployment

- **Database:** `supabase/migrations/` is the single source of truth for schema (47 migrations as of this writing). Apply with the Supabase CLI — see [`docs/SUPABASE.md`](docs/SUPABASE.md). `db/schema.sql` was retired; do not recreate it as a second schema source.
- **Edge Functions:** `supabase/functions/` — `account-delete`, `account-deletion-request`, `account-request-cancel`, `release-health`, `safety-scan`.
- **Worker/API:** Cloudflare Worker at `worker/` (entry point `worker/observed-index.ts` per `wrangler.toml`). Deploy with `npm run deploy:worker`.
- **Web:** Cloudflare Pages, built via `npm run build:web` (aliased as `vercel-build` for the Pages project's configured build command) and deployed with `npm run deploy:pages`.
- **CI:** `.github/workflows/` runs type-check, lint, the `node:test` suite, control-room audits, and companion/room-archive validation on every PR into `main`; `deploy-cloudflare.yml` and `deploy-worker.yml` push Worker/Pages changes on merge to `main`.

> **Known issue:** the Worker deploy job currently fails on every run due to an invalid `CLOUDFLARE_API_TOKEN` repo secret — see [issue #210](https://github.com/jussray/Bip/issues/210). Fixing it requires updating the secret in the Cloudflare/GitHub dashboards, not a code change.

## Setup

### GitHub Codespaces

1. Open the repository in Codespaces.
2. Allow the devcontainer to install dependencies.
3. Copy `.env.example` to `.env.local` when needed.
4. Run:

```bash
npx expo start --web -c
```

### Local development

Prerequisites: Node.js and npm.

```bash
gh repo clone jussray/Bip
cd Bip
npm install --legacy-peer-deps
cp .env.example .env.local
npx expo start --web -c
```

Other targets:

```bash
npm run ios
npm run android
```

The app runs fully offline without Supabase configured — every cloud call is a safe no-op and state stays in AsyncStorage. To wire up cross-device sync, durable history, and real crew invites, see [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Environment and Secret Safety

Only `EXPO_PUBLIC_*` variables may be exposed to the client bundle.

Never commit:

- `.env.local`
- Supabase `service_role` keys
- Cloudflare API tokens
- account deletion processing secrets
- AI provider secret keys
- webhook secrets

Use the active Supabase project configured for this repository. Do not copy project references or keys from older Bip environments.

## Validation

Use the repository scripts and CI workflows before merging meaningful implementation changes.

Typical checks include:

```bash
npm run type-check
npm test
npm run test:oracle
npm run test:voice-intelligence
npm run test:device-sync
npm run audit:control-room   # structural + RLS drift scanners, see docs/RLS_POLICY_AUDIT.md
```

When available, run:

```bash
npm run verify:prepush
```

Do not claim tests passed unless they were actually executed by a shell or CI run.

## Guides

`docs/` holds the full set (30+ files) of architecture, safety, and asset guardrails. Most load-bearing:

**Architecture & product**
- [Architecture](docs/ARCHITECTURE.md) · [Vision](docs/VISION.md) · [User Room architecture](docs/USER_ROOM_ARCHITECTURE.md)
- [Agent L4 architecture decision matrix](docs/AGENT_L4_ARCHITECTURE.md) — companion memory/orchestration design
- [Founder Control Room](docs/FOUNDER_CONTROL_ROOM.md) · [Companion production pipeline](docs/COMPANION_PIPELINE.md)

**Backend & data**
- [Supabase setup](docs/SUPABASE.md) — env vars, migrations, anonymous auth, sync model
- [RLS policy audit](docs/RLS_POLICY_AUDIT.md) — schema drift history and current RLS coverage
- [Dependency audit](docs/DEPENDENCY_AUDIT.md)

**Safety & compliance**
- [COPPA compliance](docs/COPPA_COMPLIANCE.md) · [Privacy policy](docs/PRIVACY_POLICY.md) · [Terms of service](docs/TERMS_OF_SERVICE.md)
- [Bridge connection audit](docs/BRIDGE_CONNECTION_AUDIT.md)
- Legal drafts and launch checklist: `docs/legal/`

**Design & assets**
- [Room art guide](docs/ROOM_ART_GUIDE.md) · [Asset backup rules](docs/ASSET_BACKUP_RULES.md)
- [Phase 2 room integration](docs/PHASE_2_ROOM_INTEGRATION.md) · [Figma MCP setup](docs/FIGMA_MCP_SETUP.md)

**Dev environment**
- [Codespaces setup](docs/CODESPACES.md) · [Piper TTS](docs/PIPER_TTS.md)

The rest of `docs/` (screen/UX audits, circle v1/v2 specs, phase-specific specs, dated fix audits) are point-in-time planning and audit records — treat them as historical context, not always-current instructions. Root-level `DEPLOYMENT.md` predates the Cloudflare-first migration and describes a Vercel/EAS deploy path that's no longer how this repo ships — use [Backend & Deployment](#backend--deployment) above instead.

## License

Private project.
