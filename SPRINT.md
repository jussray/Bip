# Se'kret Bip — Current Sprint State

This file records volatile project state. Read it at the start of each working
session, then verify material claims with
`.agents/skills/bip-repo-truth/SKILL.md` before acting.

Update this file only after verification when PR, deployment, migration,
backend, release, or blocker state changes. Do not store secrets, private user
data, speculative architecture, or unverified dashboard claims here.

---

## Verification

**Last verified:** 2026-07-12  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified main commit:** `bc17b7f0a015b0d1b2f7d26d2d25ddf8face8bff`

---

## Main Baseline

PR #339 merged into `main` after the complete final branch passed:

- Companion Lab Audit
- Quality Gate
- Type Check
- Regression Tests
- Pre-Push Checks
- Playwright Smoke
- CI

The merge established:

- Companion Lab package scripts and path-filtered CI;
- honest-disclaimer-aware fake-memory scoring;
- `sekret-backend` as the canonical Cloudflare Worker;
- `sekret` as the frontend Cloudflare Pages project;
- a deterministic repository RLS gate;
- configuration-aware Qodo and SonarQube jobs.

Post-merge Companion Lab, Quality Gate, and Type Check runs completed
successfully. Production Worker deployment and a live OpenAI companion request
remain separate verification steps and are not certified by CI alone.

---

## Open Pull Requests

### #340 — Living repository state and agent skills

- **Branch:** `repo-current-state`
- **Base:** `main`
- **State:** Open and synchronized with the corrected main baseline
- **Purpose:** Add `SPRINT.md`, `bip-current-state`, `bip-companion-lab`, and
  `bip-supabase-guardian`; strengthen agent entrypoint instructions
- **Current work:** Correct real Companion Lab paths/scenarios, separate durable
  Supabase rules from live findings, and validate the six-file documentation
  scope
- **Merge condition:** all required checks green and PR description matches the
  final six-file diff

---

## Recently Completed

- #337 — Companion Lab foundation
- #338 — 40 synthetic reply fixtures, 8 scenarios × 5 companions
- #339 — Green baseline repair for Companion Lab, Worker identity, and Quality
  Gate; includes the stacked work from #341 and #342

Do not reimplement these changes.

---

## Cloudflare / OpenAI

- **Backend Worker:** `sekret-backend`
- **Worker entrypoint:** `worker/observed-index.ts`
- **Frontend Pages project:** `sekret`
- **OpenAI models:** configuration remains environment-backed through the Worker
- **Credential health:** not certified by repository configuration alone
- **End-to-end companion reply:** verify with an authenticated live request
  before claiming production AI health

Do not rename the Worker or change `wrangler.toml` in an unrelated PR.

---

## Supabase

- **Project:** Se'kret Bip
- **Status:** `ACTIVE_HEALTHY`
- **Region:** `us-east-1`
- **Latest live migration:** `20260711193738 guardian_review_queue`
- **Active Edge Functions:** 16
- **JWT setting:** 13 functions use platform JWT verification; 3 functions have
  `verify_jwt: false` and require explicit custom-auth or public-endpoint review
- **Schema parity:** not certified by project health alone
- **Production changes this session:** none

### Live security backlog

The current security advisor reports material review work, including:

- RLS-enabled tables with no policies;
- policies applying to roles that can include anonymous access;
- broad execution access to multiple `SECURITY DEFINER` functions;
- leaked-password protection disabled.

### Live performance backlog

The performance advisor reports:

- unindexed foreign keys;
- per-row authentication-function evaluation in RLS policies;
- overlapping permissive policies;
- unused indexes.

These are not part of PR #340. They require a dedicated, phased migration and
test campaign. Do not mass-edit live policies merely to reduce advisor counts.

---

## Next Execution Order

1. Finish and merge #340 after its refreshed checks pass.
2. Open a Supabase security-hardening tracking issue with phased scope.
3. Phase 1: inventory exposed roles, RLS-without-policy tables, and executable
   `SECURITY DEFINER` functions; add denial tests before migrations.
4. Verify production Cloudflare deployment and one authenticated OpenAI
   companion reply.
5. Return to product feature work only after the verified baseline is recorded.
