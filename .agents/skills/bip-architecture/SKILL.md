# bip-architecture

## Trigger
Any session involving: new features, refactors, routing changes,
context/state work, character/AI integration, or onboarding flow changes.

## Verified Repo Structure (jussray/Bip, main, 2026-07-06)

### Route Groups (Expo Router)
```
app/
  (auth)/         — authentication (login, sign-up)
  (onboarding)/   — first-run onboarding flow
  (teen)/         — teen user experience (all teen-facing screens)
  (parent)/       — parent/guardian experience
  (modals)/       — modal overlays (context-preserving, overlay current route)
  (dev)/          — dev/debug tooling (strip or gate in prod builds)
  +not-found.tsx  — 404 handler
  _layout.tsx     — root layout (auth guard lives here)
  index.tsx       — entry point / redirect logic
```

**The `(teen)` / `(parent)` split is the primary privacy boundary in the router.**
Any route that accidentally bleeds teen data into `(parent)` or vice versa is an
architectural violation, not just a UI bug. New routes MUST land in the correct group.
Do not create routes at the app/ root level — they belong in a group.

### Key Source Files (verified paths)
```
constants/
  bip_voice.ts          — character voice definitions, copy source of truth (38KB)
  characterAssets.ts    — character asset mappings
  characterAvatars.ts   — character avatar mappings
  characterStickers.ts  — character sticker sets
  guardrails.ts         — AI safety guardrails
  parentSekret.ts       — parent-facing Sekret character config
  theme.ts              — app theme tokens
  vibeColors.ts         — vibe/mood color system
  voiceBip.ts           — Bip voice config (separate from bip_voice.ts)

context/               — React contexts (load to verify SekretContext name)
services/              — API/service layer
worker/                — Cloudflare Worker (wrangler.toml at root)
supabase/              — migrations and RLS policies
```

**No `constants/characters.ts` exists.** Character config is split across
`characterAssets.ts`, `characterAvatars.ts`, `characterStickers.ts`, and `parentSekret.ts`.
Do not reference a monolithic `characters.ts` — it does not exist.

### Contracts to Verify Each Session
Before writing code that touches AI/character flow:
1. Open `context/` and confirm the current name of SekretContext
2. Open `services/` and confirm the current signature of the brain reply function
3. Open `constants/bip_voice.ts` and confirm the character key you need exists

### State Architecture
- Supabase Realtime: circle membership, live posts
- Local state (Context): UI state, transient AI conversation
- Never store sensitive user content in AsyncStorage unencrypted
- `author_user_id` never in client-side state exposed to untrusted surfaces

### Deploy Pipeline
- Mobile: Expo EAS Build → TestFlight / Play Store internal track
- Worker: Wrangler → Cloudflare
- Supabase: migrations via CLI only — never dashboard edits in prod

**Staging enforcement note:** The rules "validate in staging before prod" and
"no Worker hotfix without staging validation" are the target state. Enforce them
only if a staging Supabase project and staging Worker environment are confirmed
to exist and be configured. If staging infrastructure is not yet in place, treat
these as aspirational constraints and note the gap — do not block legitimate work
on infrastructure that does not exist yet.

## Output
When starting a session: confirm which route group and which source files you are
touching before writing a single line. If unsure, read the file first.
