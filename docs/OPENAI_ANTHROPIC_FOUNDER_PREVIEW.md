# OpenAI + Anthropic Handoff: Se’kret Bip Founder Preview

Status: **development-only implementation in `agent/founder-preview-unlock`**

Audience:

- OpenAI Codex / ChatGPT coding agents
- Anthropic Claude Code / Claude coding agents
- Human maintainers reviewing Se’kret Bip feature readiness

This document is the shared operating contract for temporarily opening every inspectable Se’kret Bip product surface to the founder without opening unfinished or sensitive features to public users.

## 1. Founder request translated into engineering scope

“All features unlocked” means:

1. Every built Teen route is reachable in Expo Go/development.
2. Every built Parent route is reachable in Expo Go/development.
3. Point-gated companion UI opens without modifying the real point wallet.
4. Hidden Expo Router routes are available from one Founder Feature Catalog.
5. Implemented relationship features such as Crew and Bridge pass their client-side feature gates in development.
6. Features that need real linked accounts remain honest about that dependency.
7. Features that exist only as architecture, types, or design concepts receive a clearly labeled prototype or `not built` state.
8. Production behavior remains fail-closed.

It does **not** mean bypassing:

- age verification;
- authentication;
- guardian or parent consent;
- accepted Bip-ID relationships;
- Supabase Row Level Security;
- account ownership checks;
- privacy boundaries;
- moderation and safety checks;
- microphone or device permissions;
- server-side rollout controls.

Those are safety and authorization boundaries, not product unlocks.

## 2. How Founder Preview is enabled

Canonical gate:

```text
src/constants/founderPreview.ts
```

`isFounderPreviewEnabled()` returns true only when React Native `__DEV__` is true and `EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW` is not set to `false`.

Production builds always return false, even if somebody accidentally leaves the environment variable set to `true`.

Local options:

```bash
# Founder Preview is already on by default in Expo Go/development
npx expo start --clear

# Explicitly enable it
EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW=true npx expo start --clear

# Test ordinary locked behavior in development
EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW=false npx expo start --clear
```

Do not redesign this as a client-only production founder authorization mechanism. Production founder/admin access must continue to use authenticated `app_profiles` role and permission fields.

## 3. Where the founder opens every feature

Primary route:

```text
/(dev)/feature-preview
```

Visible entry points:

- Teen side → **More** → **Open every Bip feature**
- Parent side → **Parent More** → **Open every Bip feature**

Source:

```text
app/(dev)/feature-preview.tsx
src/constants/founderPreview.ts
```

The catalog is grouped across Teen, Parent, and Founder surfaces. It includes canonical routes plus hidden routes such as Breathe, Pages History, Body Workout, Circle Weather, Parent Repair, Parent Approvals, Control Room, and Split View.

Status meanings:

| Status | Meaning |
|---|---|
| `OPEN NOW` | The screen and core local flow are implemented. |
| `OPEN · NEEDS REAL DATA` | The screen is open, but meaningful use requires a real account, permission, linked person, record, or configured backend. |
| `SERVER ROLLOUT CLOSED` | Client UI exists, but the Worker or other server-side cohort gate remains closed. |
| `FOUNDER PREVIEW` | A clearly labeled local prototype or partial implementation is available for inspection. |
| `NOT BUILT YET` | Types, plans, or architecture may exist, but no honest product surface is complete. |

Never rewrite these labels merely to make the app appear more complete.

## 4. What was unlocked

### Route and onboarding visibility

Files:

```text
app/(teen)/_layout.tsx
app/(parent)/_layout.tsx
```

In development Founder Preview, the route layouts render their tab stacks even when Teen or Parent onboarding is incomplete. Individual screens still enforce real authentication, RLS, linking, permissions, and safety requirements when they access data or devices.

### Point-gated companions

File:

```text
src/features/activity/ledger.ts
```

Founder Preview exposes a display-only total of `999` points so Rylane, Cloud, and Night pass existing UI thresholds in Pages and Discover.

This must never:

- insert a `point_transactions` row;
- modify `point_balances`;
- create Bip Tickets;
- reserve or redeem a reward;
- change the intentional Bip Energy fade;
- unlock a permanent room item.

The ledger retains `actualTotal` for diagnostics and marks the displayed value with `isPreview`.

### Relationship feature flags

Files:

```text
src/constants/relationshipFeatureFlags.ts
src/services/crewAccountabilityService.ts
src/services/bridgeSummaryService.ts
```

Founder Preview opens only the relationship features with implemented client/runtime surfaces:

- `bridgeSummaries`
- `crewAccountability`

It does not falsely mark these as complete:

- `emotionalScrapbook`
- `companionMemory`

### Bip Crew sample mode

File:

```text
src/screens/CrewAccountabilityScreen.tsx
```

When no real accepted Crew data is available, development Founder Preview loads local sample members, check-ins, and encouragements. Interactions update local React state only.

The sample mode writes nothing to Supabase.

The real Crew path now uses the guarded `get_public_circle_profiles` RPC rather than directly selecting `circle_profiles`.

### Bridge Summary sample mode

File:

```text
src/features/bridge/ParentBridgeSummaryInbox.tsx
```

When no real Bridge Summary exists, Founder Preview displays one clearly marked privacy-safe sample. It does not read teen content and does not insert a summary.

The sample demonstrates:

- generalized themes;
- non-surveillant conversation starters;
- explicit limitations;
- viewed/unviewed interaction.

### Emotional Scrapbook prototype

File:

```text
app/(dev)/scrapbook-preview.tsx
```

This is a founder-only visual prototype based on `ScrapbookMemoryRecord` in `src/types/relationshipLayer.ts`.

It demonstrates:

- private memory cards;
- frames;
- stickers;
- mood and soundtrack metadata;
- private-by-default copy;
- future visibility boundaries.

It does not provide persistence, upload, sharing, storage, moderation, archive, edit, delete, or offline sync. Do not call it implemented or released.

## 5. Complete feature source of truth

The catalog is intentionally code-backed rather than duplicated here line by line:

```text
FOUNDER_PREVIEW_FEATURES
src/constants/founderPreview.ts
```

When a route is added, removed, renamed, or materially changes readiness, update that catalog and its source-contract test in the same change.

Current catalog coverage includes:

### Teen

- Room and Bip Story return loop
- Pages, New Page, and Pages History
- Calm and Breathe
- Voice Bip
- Circle and Circle Weather
- More
- Discover and Companion Picker
- Raylene, Rylane, Cloud, and Night chat routes
- Cloud Thoughts
- Emergency Comfort
- Meaningful History
- Bip Points and Energy
- Growth Tools
- Bippin 2
- Mind Reset, Body Reset, and Body Workout
- Period Calendar
- Chores
- Bip Crew
- Bridge and Se’krets 2 Tell compose mode
- Parent Link verification
- Memory & Continuity
- Profile, Settings, Resources
- Emotional Scrapbook prototype
- Approved Companion Memory status

### Parent

- Parent Room
- Parent Bridge
- Bridge AI Summary status
- Parent Pages
- Parent Circle
- Parent More
- Parent Dashboard
- Parent Calm
- Parent Voice Bip and Voice Reflect
- Repair Tools
- Parent Growth
- Parent Se’kret Coach
- Parent S2Tell Inbox
- Parent Approvals
- Parent Period Calendar
- Parent Profile, Settings, Resources

### Founder

- Control Room
- Teen + Parent Split View
- Founder Feature Catalog
- Emotional Scrapbook prototype

## 6. Bridge AI Summary server rollout

The client preview does not override this server control:

```text
wrangler.toml
BRIDGE_SUMMARIES_ROLLOUT = "disabled"
```

The Worker accepts:

- `disabled` or blank: nobody;
- `enabled`: everybody;
- comma-separated authenticated user UUIDs: controlled cohort.

Never set it to `enabled` merely so the founder can test.

As of July 14, 2026, neither `mcgill.raylene@gmail.com` nor `sekretbip@gmail.com` exists in this project’s `auth.users` or `public.app_profiles`, so there is no verified founder UUID to allowlist yet.

Once the founder creates the real account:

1. Verify the email and UUID in Supabase Auth and `public.app_profiles`.
2. Verify `role`, `can_view_audits`, and `can_manage_app` are set by a trusted server/admin path, not user-editable metadata.
3. Set the Worker rollout to the exact UUID only:

```bash
npx wrangler secret put BRIDGE_SUMMARIES_ROLLOUT --name sekret-backend
# value: the exact founder UUID, or a comma-separated controlled test cohort
```

4. Deploy and run a controlled teen/parent proof.
5. Keep the static sample until real proof passes, then decide whether it remains useful for design review.

## 7. OpenAI implementation boundary

OpenAI-backed features must remain server-side.

Current Worker configuration uses OpenAI for chat, speech-to-text, and text-to-speech. Never place an OpenAI secret in Expo, React Native, committed `.env` files, or client bundle extras.

For Bridge Summaries:

- preserve `BRIDGE_JSON_SCHEMA`;
- preserve `passesPrivacyValidator`;
- never return source snippets to the parent;
- never persist raw prompt snippets as summary output;
- keep generalized themes and conversation starters;
- retain static fallback behavior when model output fails validation;
- preserve authenticated user ownership and cohort rollout checks.

OpenAI agents must not claim an API-backed feature works merely because its screen renders in sample mode.

## 8. Anthropic implementation boundary

Anthropic is not currently the configured production model provider in this repository.

If Claude is asked to introduce an Anthropic provider:

1. Add or use a server-side provider adapter. Do not call Anthropic directly from the mobile client.
2. Preserve the same JSON schema and privacy-validator contract.
3. Preserve model provenance fields without exposing private source content.
4. Keep the OpenAI path available until an explicit provider migration is approved.
5. Add provider-specific contract tests and failure/fallback tests.
6. Do not silently reinterpret the founder’s request as permission to replace OpenAI throughout the app.

Claude Code may edit this repository, but “Anthropic coding agent” and “Anthropic runtime provider” are separate decisions.

## 9. Safety rules both providers must preserve

OpenAI and Anthropic agents must not:

- bypass age, login, guardian, consent, or linking flows in production;
- weaken RLS or direct-table grants to make a preview load;
- use `user_metadata` for authorization;
- expose teen journals, voice notes, chats, mood history, or private media to parents;
- turn Circle support into public popularity totals;
- write fake founder-preview points into the economy;
- subtract Bip Tickets, redeemed rewards, or unlocked room items;
- disable the intentional Bip Energy fade;
- set `BRIDGE_SUMMARIES_ROLLOUT=enabled` for convenience;
- label a local sample as live backend proof;
- label a type definition as a completed feature.

## 10. Validation required before merge

At minimum run:

```bash
npm run type-check
node --test test/founder-preview-unlock.test.mjs
node --test test/feature-flow-contracts.test.mjs
node scripts/verify-implementation-ledger.mjs
```

Then require the repository’s full exact-head checks:

- CI
- Type Check
- Quality Gate
- Regression Tests
- Pre-Push Checks
- Playwright smoke and guardrails
- Implementation Evidence

Manual Expo Go proof:

1. Open Teen More.
2. Tap **Open every Bip feature**.
3. Open Rylane, Cloud, and Night without real point changes.
4. Open Crew and interact with the sample state.
5. Open Parent Bridge and mark the sample summary viewed.
6. Open the Emotional Scrapbook prototype and change frames/stickers.
7. Switch between Teen and Parent routes.
8. Confirm Supabase point balance and transactions did not change because of preview points or sample interactions.
9. Set `EXPO_PUBLIC_ENABLE_FOUNDER_PREVIEW=false`, reload, and confirm normal locks return.

## 11. Truthful release state

Founder Preview is not a public release mechanism.

A feature remains:

- **prototype** until its durable data and user path exist;
- **integrated** until exact-head and controlled-account proof pass;
- **verified** only after physical-device and authorization-boundary tests;
- **released** only after a real build/deployment and observation window.

The purpose of Founder Preview is to let the founder see the full product shape without corrupting production security or pretending unfinished work is finished.
