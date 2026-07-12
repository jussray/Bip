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
**Verified baseline before this state layer:** `bc17b7f0a015b0d1b2f7d26d2d25ddf8face8bff`  
**Publication PR:** #340

When this file is present on `main`, PR #340 has merged. The final merge SHA is
not predicted inside the PR that creates it. Verify the live main head before
using an exact commit identifier.

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

## Published Agent Layer

PR #340 adds:

- `bip-current-state`
- `bip-companion-lab`
- `bip-supabase-guardian`
- this `SPRINT.md` snapshot
- verified-state directives in `AGENTS.md` and `CLAUDE.md`
- the full founder reasoning stack requirement in `AGENTS.md`

The PR is documentation and agent instructions only. It does not change app
runtime, Cloudflare configuration, Supabase schema, Edge Functions, or secrets.

---

## Open Work

### #344 — Supabase authorization hardening

- **State:** Open
- **Purpose:** Convert live security and performance advisor findings into a
  phased, test-first hardening campaign
- **First phase:** Inventory policy roles, RLS-without-policy tables, elevated
  function grants, and Edge Function JWT exceptions; add denial tests before
  migrations
- **Production changes:** None made from this issue yet

Live pull-request state is intentionally not duplicated here without a fresh
verification. Query GitHub before claiming there are no other open PRs.

---

## Recently Completed

- #337 — Companion Lab foundation
- #338 — 40 synthetic reply fixtures, 8 scenarios × 5 companions
- #339 — Green baseline repair for Companion Lab, Worker identity, and Quality
  Gate; includes the stacked work from #341 and #342
- #340 — Living state layer and Bip operational guardian skills

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

The backlog is tracked in issue #344. Do not mass-edit live policies merely to
reduce advisor counts.

---

## Next Execution Order

1. Begin issue #344 Phase 0 inventory and denial-test design without production
   writes.
2. Verify production Cloudflare deployment and one authenticated OpenAI
   companion reply.
3. Select the next product feature only after the verified baseline is recorded.
