# Se'kret Bip — Current Sprint State

This file records volatile project state. Read it at the start of each working
session, then verify material claims with
`.agents/skills/bip-repo-truth/SKILL.md` before acting.

Update this file only after verification when PR, deployment, migration,
backend, release, or blocker state changes. Do not store private user data or
unverified dashboard claims here.

---

## Verification

**Last verified:** 2026-07-12  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified main commit:** `8ba6f20f7211f65c2e112d8a853275c3ad313546`

---

## Main Baseline

### #339 — Green CI and Worker baseline

Merged after Companion Lab Audit, Quality Gate, Type Check, Regression Tests,
Pre-Push Checks, Playwright Smoke, and CI passed.

It established:

- Companion Lab package scripts and path-filtered CI;
- honest-disclaimer-aware fake-memory scoring;
- `sekret-backend` as the canonical Cloudflare Worker;
- `sekret` as the frontend Cloudflare Pages project;
- deterministic repository quality gates.

### #340 — Living state and operational agent layer

It added:

- `bip-current-state`;
- `bip-companion-lab`;
- `bip-supabase-guardian`;
- this `SPRINT.md` snapshot;
- verified-state directives in `AGENTS.md` and `CLAUDE.md`;
- the full founder reasoning stack requirement in `AGENTS.md`.

### #346 — Se'kret identity, style, and L4 contracts

Merged at `667305fe6f5bfef9f1b7faf557dbd8676f1bb2f2` after Type Check,
Quality Gate, Regression Tests, Pre-Push Checks, Playwright Smoke, and CI passed.

It added:

- `docs/CONTROL_ROOM_ARCHITECTURE.md`;
- Oracle-to-Se'kret visible identity rules;
- separate named-companion and Se'kret continuity style contracts;
- deterministic text and speech style request builders;
- guarded relationship-phase rules;
- `bip-sekret-identity`;
- `bip-companion-style-engine`;
- `bip-l4-memory`;
- executable identity, style, question-budget, and phase tests.

These are contracts, not runtime activation. Screens, the Worker reply path,
accessibility labels, archives, TTS, Control Room panels, durable memory,
goals, reflection, and L4 persistence are not completed by #346.

### #348 — Unify feature state and repair Supabase-backed flows

Merged at `8ba6f20f7211f65c2e112d8a853275c3ad313546` (head
`e47260742c5e044b902bfdc019bf6be5a814734c`) after CI, Playwright Smoke, Type
Check, Pre-Push Checks, Regression Tests, and Quality Gate passed.

It added:

- durable Supabase hydration mounted in the `AppContext` state provider
  (Teen/Parent Pages, mood, voice metadata, comfort activity, Circle
  summaries, Crew data, period days, room memory);
- one owner-scoped journal contract for Teen and Parent Pages, keeping them
  private and distinct via `owner_side`;
- Circle correctness/security: DB-ID reconciliation, a guarded pseudonym RPC
  that never exposes `account_type`, RPC-only reactions with validated
  vocabulary and one-reaction-per-account/post enforcement, removed broad
  legacy table/sequence privileges;
- Crew placeholder invites removed from the active public path; Crew stays
  disabled publicly pending accepted-connection beta;
- navigation consolidation (Bridge promoted to primary nav, duplicate Room
  routes redirected);
- production migrations applied: `20260712190000_feature_flow_contracts.sql`,
  `20260712195000_secure_circle_profile_reads.sql`,
  `20260712200000_optimize_circle_policy_plans.sql`;
- a rollback-contained three-identity probe (two permanent accounts + one
  anonymous) verifying cross-account read/write denial on Circle, with no
  synthetic data left behind.

Known follow-up debt explicitly called out by #348 (not regressions from it):
legacy policy/index cleanup and leaked-password protection still disabled —
tracked in #344. No parent/teen links were created or activated by #348;
Crew remains gated.

---

## Open Work

### #344 — Supabase authorization hardening

- **State:** Open
- **Purpose:** A phased, test-first review of current authorization findings
- **First phase:** Inventory existing access rules and add denial tests before
  production database changes
- **Production changes:** None made from this issue yet
- Live advisor findings (verified 2026-07-12): RLS-enabled-no-policy on
  `app_config`, `app_private_config`, `guardian_verification_reviews`,
  `notification_deliveries`; anonymous-capable policy roles on private
  tables; SECURITY DEFINER grant review needed; leaked-password protection
  disabled. See issue body for full phase plan — do not mass-rewrite
  policies before Phase 0 inventory + denial tests exist.

### #259 — Preservation-first path to polished teen + parent V1

- **State:** Open
- **Purpose:** Prove the full two-account journey — teen signup, parent
  signup, link, teen private reflection, Bridge preview/confirm/share, parent
  view, revoke, unlink, delete — with privacy enforced by Worker auth +
  Supabase RLS/storage, not screen hiding.
- P0/P1/P2 checklist and manual two-account test script are in the issue
  body; not yet executed end-to-end with two real accounts as of this
  verification (only code-level gap inventory + fixes below have landed).
- **Gap inventory (verified 2026-07-12) on branch
  `claude/bip-v1-production-proof-nx6222`:** steps 1-4, 8-10 (teen/parent
  auth, parent-link state machine, private Pages RLS, revoke, parent-loses-
  access, unlink/delete) were already production-hardened. Steps 5-7 (Bridge
  content selection → preview/confirm → parent-safe generation) were
  functionally inert: `relationshipFeatureFlags.bridgeSummaries` was
  `'internal'` (blocked for real users) and the Worker's
  `handleBridgeSummaryGenerate` always wrote a hardcoded `FALLBACK_SUMMARY`
  regardless of what the teen selected.
- **Fixed this session:** flipped `bridgeSummaries` to `'enabled'`; added a
  confirm/cancel step in `app/(teen)/pages/index.tsx` using
  `buildBridgeSharePreview` before `createBridgeShareRequest` fires; Worker
  (`worker/bridge-summary.ts`) now fetches the teen's selected journal/mood
  content (scoped to `teen_user_id`, minimized fields only), calls OpenAI
  with a themes/conversationStarters/limitations contract that forbids
  verbatim quotes and clinical language, and only falls back to the static
  summary if generation fails or `OPENAI_API_KEY` is unset. Raw source text
  is used only as ephemeral model input — never persisted into
  `bridge_summaries`. `PROMPT_VERSION` bumped to `bridge-summary-v2`.
  Typecheck, lint, and unit tests (425 pass) all green; not yet exercised
  against a real deployed Worker + two real Supabase accounts — that
  two-account proof run is still open.
- **Red-team follow-up (verified 2026-07-12):** a second-pass review of this
  branch's Bridge work (against the live Supabase project directly, not just
  code) found the Bridge RLS shape is directionally correct, but flagged real
  gaps in the first pass, fixed in a follow-up commit on the same branch:
  a revoke → re-share dead end in the UI (`if (current) return;` blocked
  reactivating a request the DB migration already supports), missing-source
  content silently producing a fallback summary marked `ready` instead of
  failing, and the confirm dialog not disclosing that source text is sent to
  an external AI provider. **Fixed in a further commit on the same branch:**
  added `BRIDGE_SUMMARIES_ROLLOUT` — a server-side kill switch/allowlist
  (`worker/bridge-summary.ts`, documented in `wrangler.toml`) checked
  independently of the client-bundled `relationshipFeatureFlags` constant, so
  the feature can be dialed to `disabled` or a comma-separated beta cohort
  via a Worker env var without an app release; migrated summary generation
  to OpenAI Structured Outputs (`json_schema`, strict mode) instead of plain
  `json_object` mode; added a deterministic post-generation privacy validator
  (`worker/bridge-privacy-validator.ts`) enforcing theme/starter count and
  length bounds, a clinical-language blocklist (scoped to themes/starters
  only — the required "not a diagnosis" disclaimer in `limitations` would
  otherwise false-positive against its own negation, caught by the new
  tests), and 7-word-ngram near-verbatim-leak detection against the source
  content, with one corrective retry before falling back to the static
  summary. Real behavioral tests now exist for this
  (`test/bridge-privacy-validator.test.mjs`, imports the dependency-free
  validator module directly via Node's native TS support rather than
  regex-matching source text) — 13 new tests covering shape validation,
  count/length bounds, clinical-language rejection, near-verbatim leak
  detection, the disclaimer false-positive regression, and rollout
  allow/deny/cohort logic. 439 total tests pass. **Still not done:** the
  Worker's Supabase-calling functions (`fetchOwnedRequest`,
  `upsertGeneratedSummary`, etc.) are still only covered by the older
  regex-over-source-text test file, not mocked-fetch behavioral tests; no
  real deployed-Worker + two-Supabase-account run has happened yet. The
  `notification_deliveries` RLS classification in #344 below was also
  disputed by a live-Supabase check (claims it's intentionally server-only,
  not a broken user path) — not independently re-verified here; treat as
  unconfirmed until checked against the live project directly.

### Open pull requests (verified 2026-07-12, query GitHub before trusting this)

- **#349** — Guardrails + Playwright verification. **Merged** into main at
  `85624c9` (merged by jussray). Current SPRINT correction: earlier text in
  this file said #349 was open and awaiting a merge go-ahead — that was
  stale as of this verification.
- **#350** — Opened from `claude/bip-v1-production-proof-nx6222` (this
  branch). Carries the SPRINT.md fix, the PR #349 rebase-in-place, and the
  Bridge activation/fix commits above. Title/description as auto-opened only
  described the SPRINT.md doc change — does not mention the runtime/privacy
  changes; needs correcting before merge review.
- **#345** — Control Room PR A: identity contract, style profiles,
  relationship phase, agent skills, unit tests. Open. Contracts/tests only,
  no panels or Worker wiring (that's PR B/C per the Control Room rollout
  below).
- **#284** — Harden parent entry flow (draft). Explicitly not claiming
  backend-authoritative parent profile persistence complete; needs branch
  sync with main before review.

### Control Room AI rollout

The next scoped phases are:

1. **PR B — observers:** read-only identity, style, voice, L4, and MCP panels;
   founder-route wiring; privacy-safe adapters and redacted identifiers.
2. **PR C — runtime activation:** connect the identity and style contracts to
   screens, the real reply request, accessibility, archives, notifications and
   TTS; add Companion Lab and identity-leak evaluations.
3. **PR D — L4 persistence:** reviewed memory, goal and reflection storage;
   ownership, provenance, correction, expiry, deletion and denial tests.

The old `control-room-architecture` branch is not a merge candidate. It was
based on an older main history and contained unrelated changes. Reuse its ideas
only through fresh, scoped branches from current main.

Live pull-request state is intentionally not duplicated here without a fresh
verification. Query GitHub before claiming there are no other open PRs.

---

## Recently Completed

- #337 — Companion Lab foundation
- #338 — 40 synthetic reply fixtures, 8 scenarios × 5 companions
- #339 — Green Companion Lab, Worker identity, and Quality Gate baseline
- #340 — Living state layer and operational guardian skills
- #346 — Se'kret identity, companion style, and future L4 contract baseline
- #348 — Durable Supabase hydration, owner-scoped Pages, Circle security
  hardening, navigation consolidation

Do not reimplement these changes.

---

## Cloudflare / OpenAI

- **Backend Worker:** `sekret-backend`
- **Worker entrypoint:** `worker/observed-index.ts`
- **Frontend Pages project:** `sekret`
- **Model configuration:** remains environment-backed through the Worker
- **End-to-end companion reply:** verify with an authenticated live request
  before claiming production AI health
- **Text-to-speech:** profile and architecture contracts exist, but production
  Se'kret/companion TTS activation is not certified

Do not rename the Worker or change `wrangler.toml` in an unrelated PR.

---

## Supabase

- **Project:** Se'kret Bip
- **Status:** `ACTIVE_HEALTHY`
- **Region:** `us-east-1`
- **Latest live migration:** `20260711193738 guardian_review_queue`
- **Active Edge Functions:** 16
- **Schema parity:** not certified by project health alone
- **Production changes from #346:** none

The current security and performance backlog is tracked in issue #344. Do not
apply broad live changes merely to reduce advisory counts.

---

## Next Execution Order

1. Update PR #349 onto current `main` and confirm CI reruns green; merge only
   after explicit review (it is not this repo's most urgent item, but it is
   the closest to done).
2. Execute issue #259's two-account journey against current main and record
   which P0/P1 checklist items actually pass — this outranks new Control Room
   panels, L4 memory, monetization, or merch work.
3. Complete issue #344 Phase 0 inventory and denial-test design before any L4,
   parent-authorization, or broad policy migration.
4. Build PR B from current `main`: Control Room observer panels and read-only,
   privacy-safe adapters only.
5. Build PR C: activate Se'kret identity and companion style in the real runtime,
   including text, accessibility, archives, notifications and TTS.
6. Verify the production Cloudflare deployment and one authenticated OpenAI
   companion reply before claiming live AI health.
7. Build PR D only after authorization evidence exists.
