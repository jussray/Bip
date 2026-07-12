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
**Verified main commit:** `667305fe6f5bfef9f1b7faf557dbd8676f1bb2f2`

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

---

## Open Work

### #344 — Supabase authorization hardening

- **State:** Open
- **Purpose:** A phased, test-first review of current authorization findings
- **First phase:** Inventory existing access rules and add denial tests before
  production database changes
- **Production changes:** None made from this issue yet

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

1. Build PR B from current `main`: Control Room observer panels and read-only,
   privacy-safe adapters only.
2. Complete issue #344 Phase 0 inventory and denial-test design before any L4,
   parent-authorization, or broad policy migration.
3. Build PR C: activate Se'kret identity and companion style in the real runtime,
   including text, accessibility, archives, notifications and TTS.
4. Verify the production Cloudflare deployment and one authenticated OpenAI
   companion reply before claiming live AI health.
5. Build PR D only after authorization evidence exists.
