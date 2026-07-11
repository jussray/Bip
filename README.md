# Se'kret Bip 💜

Se'kret Bip is a privacy-first emotional growth and self-expression app for teens, built with React Native, Expo Router, TypeScript, Supabase, and Cloudflare Workers.

> Warm, funny, soft, slightly nosy, and never clinical.

## AI operating contracts

- [`GLOBAL_AI.md`](GLOBAL_AI.md) — provider-neutral founder and product contract
- [`AGENTS.md`](AGENTS.md) — Codex, ChatGPT, and repository-agent instructions
- [`CLAUDE.md`](CLAUDE.md) — verified design-system and Figma integration reference
- [`docs/PROVIDERS.md`](docs/PROVIDERS.md) — Claude, Codex, OpenAI, Anthropic, Perplexity, GitHub, Supabase, Cloudflare, and Expo boundaries

Shared founder stack:

```text
/garyvee lindymode redteam l99 redteam ooda
```

The first redteam attacks the product premise and evidence. The second attacks the selected implementation, privacy blast radius, rollback, and proof. Project-local instructions may become stricter, but they may not weaken teen privacy, consent, security, evidence, approval, provenance, or rollback.

## Why Se'kret Bip exists

Teens need room to process emotions, build habits, and ask for support without feeling watched. Parents need a healthier way to stay connected without being given unrestricted access to private reflections.

Se'kret Bip is designed around that tension: private by default, intentional sharing by choice, and relationship-based support instead of surveillance.

## Who it is for

- Teens who want a private, expressive space for journaling, voice reflection, emotional regulation, habits, and trusted connection.
- Parents and guardians who want a consent-based window into what a teen intentionally chooses to share.
- Youth-serving partners interested in privacy-preserving wellbeing, family communication, digital literacy, accessibility, and responsible AI.

## What support unlocks

Funding and strategic support are intended to accelerate concrete readiness milestones:
- independent privacy and security review
- teen and parent usability testing
- accessibility testing and remediation
- parent-side completion and end-to-end Bridge verification
- moderation, safeguarding, and release-readiness work
- infrastructure, AI, voice, storage, and device-testing costs
- pilot preparation with qualified youth-serving organizations

See `docs/SUPPORT_AND_PARTNERSHIPS.md` and `docs/FUNDER_OVERVIEW.md` for current support priorities and due-diligence guidance.

## Product promise

- Private reflections stay private.
- Teens choose what they share.
- Parent access is relationship-based, not surveillance-based.
- Identity and permission rules are enforced across services and Supabase policies.

## Product areas

### Teen

- Room and User Room
- Pages and journal flows
- Voice Bip
- Raylene, Rylane, Cloud, Night, and Oracle/Se'kret
- Calm, Comfort, Mind-Body Reset, and Cloud Thoughts
- Bippin 2, Growth, Insights, History, and Memories
- Period Calendar
- Points and Rewards

### Social and trusted connection

- **Circle** — anonymous or circle-safe community posting
- **Bip Crew** — trusted accountability relationships
- **Bridge** — the private teen-parent connection system
  - Doorbell is the signal layer inside Bridge
  - S2Tell is the intentional share composer inside Bridge
  - Parent Bridge is the parent view of the linked relationship
- **Parent Circle** — separate parent-to-parent community space
- No open stranger direct messages

### Parent

Parent routes and linked-account data exist, but parent product completion is now an enforced release gate. The parent experience remains in-progress until issue #212 verifies Parent Bridge presentation, onboarding, link lifecycle states, Parent Circle privacy, Parent Coach boundaries, period-sharing permissions, notifications, and end-to-end privacy tests. Demo scripts must avoid implying those flows are production-complete.

## Privacy boundaries

Parent surfaces must not read:

- raw journal text
- Voice Bip transcripts
- private companion chats
- private character memory
- private notes
- unshared messages
- general app activity history

Bridge contains only content intentionally sent into the linked relationship. Circle and Bridge remain separate systems.

## Architecture

- **Frontend:** React Native, Expo Router, TypeScript
- **Routes:** separate teen and parent route groups
- **Local state:** React state, context, hooks, and AsyncStorage
- **Cloud data:** Supabase Auth, Postgres, RLS, Storage, functions, and migrations
- **API layer:** Cloudflare Worker for AI, voice, authenticated APIs, and metadata-only telemetry
- **Deployment direction:** Cloudflare-first, with remaining Vercel compatibility treated as transitional
- **Schema source of truth:** `supabase/migrations/`

## Companion intelligence

The enforced companion implementation is L2: short-term history and approved context are passed into each turn. Durable semantic memory, persistent goals, scheduled reflection, and inter-companion coordination must not be presented as implemented until the migrations, services, privacy controls, and tests described in `docs/AGENT_L4_ARCHITECTURE.md` exist.

## Enforced readiness gates

1. Parent/Bridge completion is blocked on issue #212 and may not expand parent visibility.
2. Live demo readiness requires verified Cloudflare Worker/web secrets, restricted CORS, authenticated Worker handling, deployed Supabase functions, clean migration replay, and release-health telemetry.
3. Parent-link, storage, RLS, identity, founder, age-gate, and deletion boundaries must be enforced by services/RLS/RPCs/storage policies, not UI hiding.
4. The `notification_deliveries` RLS scanner warning is release-blocking until a policy or documented service-role-only exception is implemented.
5. Durable character memory remains a roadmap item until privacy boundaries, migrations, and tests are implemented.

## Project structure

```text
app/                 Expo Router route groups
screens/             compatibility screen implementations
src/                 components, features, hooks, services, types, utilities
worker/              Cloudflare Worker
supabase/            migrations and functions
assets/              app artwork and media
docs/                architecture and implementation guidance
scripts/             audits and validation tools
test/                automated tests
```

## Setup

```bash
gh repo clone jussray/Bip
cd Bip
npm install --legacy-peer-deps
cp .env.example .env.local
npx expo start --web -c
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
npm run test:oracle
npm run test:voice-intelligence
npm run test:device-sync
npm run audit:control-room
npm run validate:companions
```

Full check:

```bash
npm run verify:prepush
```

## Key guides

- `GLOBAL_AI.md`
- `docs/PROVIDERS.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`
- `docs/CURRENT_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/SUPABASE.md`
- `docs/BRIDGE_CONNECTION_AUDIT.md`
- `docs/AGENT_L4_ARCHITECTURE.md`
- `docs/RLS_POLICY_AUDIT.md`
- `docs/COPPA_COMPLIANCE.md`
- `docs/PRIVACY_POLICY.md`
- `docs/SUPPORT_AND_PARTNERSHIPS.md`
- `docs/FUNDER_OVERVIEW.md`
- `DEPLOYMENT.md`

Documentation is an implementation guardrail. When code and docs disagree, fix the stale source.

## License

Private project.
