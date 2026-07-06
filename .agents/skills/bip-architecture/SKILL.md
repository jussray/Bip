# bip-architecture

## Trigger
Any session involving: new features, refactors, routing changes,
context/state work, character/AI integration, or onboarding flow changes.

## Verified Repo Structure (jussray/Bip, main, 2026-07-06)

This section is a snapshot, not permanent truth. Run `bip-repo-truth` first and verify paths
before relying on it. If the repository has changed, update this skill in the same PR or open
a follow-up issue rather than silently working from stale architecture.

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

**The `(teen)` / `(parent)` split is a routing and presentation boundary, not the sole privacy control.**
New routes must land in the correct group, but authorization must also be enforced by Supabase
RLS, RPC/Worker checks, consent records, and response minimization. A route-group split alone
must never be treated as sufficient protection.

Do not create new feature routes at the `app/` root without an explicit architectural reason.
Framework-required files such as `_layout.tsx`, `index.tsx`, and `+not-found.tsx` remain valid root files.

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

context/               — React contexts; verify exact exported names before use
services/              — API/service layer; verify current function signatures
worker/                — Cloudflare Worker source; production Worker is `sekret`
supabase/              — migrations, functions, and RLS policies
```

**No `constants/characters.ts` existed in the verified snapshot.** Character config was split
across `characterAssets.ts`, `characterAvatars.ts`, `characterStickers.ts`, and `parentSekret.ts`.
Do not invent or reference a monolithic file without first checking the current repo.

### Contracts to Verify Each Session
Before writing code that touches AI/character flow:
1. Open `context/` and confirm current context names and ownership boundaries.
2. Open `services/` and confirm the current brain-reply entry point and signature.
3. Open `constants/bip_voice.ts`, `constants/voiceBip.ts`, and relevant Worker files.
4. Confirm whether the change belongs in app state, server state, prompt/persona config, or copy config.
5. Confirm the response/auth boundary before passing sensitive data between layers.

Do not duplicate state or persona configuration merely because a remembered contract says it exists.

## State and Data Architecture
- Supabase Realtime may carry live membership/post updates; verify current subscriptions, payloads, and RLS.
- Context/local state owns transient UI and conversation state only where the current implementation says so.
- Never store sensitive user content in AsyncStorage unencrypted unless an explicit reviewed exception exists.
- Identity-bearing fields must not enter client state for audiences unauthorized to receive them.
- Parent Bridge data must remain consent-based and summary-only at the response boundary.
- Route separation never substitutes for database and server authorization.

## Deploy Pipeline
The intended deployment paths are:
- Mobile: Expo EAS Build / Update according to target channel and native-change requirements.
- Worker: Wrangler / GitHub Actions to Cloudflare Worker `sekret`.
- Supabase: versioned migrations and functions through the repository-controlled deployment path.

These are intentions that must be verified against current workflows and environments before use.

### Environment-Aware Deployment Rules
- If a configured staging environment exists for the affected layer, validate there before production.
- If staging does not exist, do not invent a nonexistent gate or claim staging validation occurred.
- Instead, document the available local/preview/test path, run applicable automated checks, and require explicit production-deploy approval.
- Never make untracked production dashboard edits when a repository-controlled migration/config path exists.
- For an emergency production fix, record the exact change, deployed version, validation performed, and required repository reconciliation immediately afterward.

## Output
When starting a session, report:
- verified commit/branch and timestamp;
- route group and source files being touched;
- data/auth/privacy boundaries that apply;
- target environment and whether staging actually exists;
- any architecture snapshot in this skill that is now stale.

Read the file before changing it. Repository truth overrides this snapshot.
