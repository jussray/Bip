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
├── hooks/                     # Existing shared hooks
├── utils/                     # Storage, API, Supabase, and compatibility utilities
├── supabase/
│   ├── functions/             # Edge Functions
│   └── migrations/            # Database migrations and RLS changes
├── assets/images/             # Companion, room, splash, and screen artwork
├── design-references/         # Visual reference assets
├── docs/                      # Implementation and asset guardrails
├── .github/workflows/         # CI, regression, and deployment workflows
├── .env.example               # Environment template
└── app.json                   # Expo configuration
```

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
```

When available, run:

```bash
npm run verify:prepush
```

Do not claim tests passed unless they were actually executed by a shell or CI run.

## Guides

- [Codespaces setup](docs/CODESPACES.md)
- [Dependency audit](docs/DEPENDENCY_AUDIT.md)
- [Room art guide](docs/ROOM_ART_GUIDE.md)
- [Phase 2 room integration](docs/PHASE_2_ROOM_INTEGRATION.md)
- [Asset backup rules](docs/ASSET_BACKUP_RULES.md)

Additional vision, privacy, safety, and Figma documentation should live under `docs/` and be treated as implementation guardrails rather than disposable planning notes.

## License

Private project.
