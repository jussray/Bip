# bip-architecture

## 5W1H operating contract

Before planning, editing, or claiming completion, establish and state:

- **Who** — the requester, decision owner, affected users, data subjects, and execution authority.
- **What** — the requested outcome, concrete deliverable, non-goals, and existing work that must be preserved.
- **Where** — the exact repository, branch, environment, runtime, route, service, table, or provider boundary involved.
- **When** — the current lifecycle or release state, required ordering, timing constraint, and rollback window.
- **Why** — the user problem and verified evidence that justify the work.
- **How** — the smallest safe implementation, required permissions, verification evidence, rollout, and rollback.

Inspect repository and runtime truth for unknowns. Ask the user only when a missing answer would materially change the safe solution or authority. Re-run 5W1H after red-team/OODA findings change the plan. Finish by mapping the result, evidence, remaining blocker, and next owner back to these six questions.


Last reviewed: 2026-07-29

## Trigger

Any session involving new features, refactors, routing changes, state ownership, character/AI integration, onboarding, Supabase trust boundaries, or Cloudflare deployment ownership.

## Repository truth first

Canonical repository: `jussray/Sekret-Bip`.

This skill is a reviewed snapshot, not permanent truth. Before editing:

1. verify the current branch and `main` SHA;
2. read `implementation-ledger.json`;
3. read `docs/LAUNCH_GATE_STATUS_2026-07-29.md`, `docs/CURRENT_STATUS.md`, `docs/WIRING_STATUS.md`, and `DEPLOYMENT.md`;
4. inspect the actual files and workflows involved;
5. update this skill in the same PR when its snapshot becomes stale.

## Route groups

```text
app/
  (auth)/         authentication
  (onboarding)/   first-run onboarding
  (teen)/         teen experience
  (parent)/       parent/guardian experience
  (modals)/       context-preserving overlays
  (dev)/          founder/internal tooling, gated from public users
  +not-found.tsx  framework 404 handler
  _layout.tsx     root layout and account gating
  index.tsx       entry and redirect logic
```

The teen/parent route split is a presentation boundary, not authorization. Privacy must also be enforced by RLS, RPC/Worker checks, consent records, Storage policies, and response minimization.

Do not create feature routes at the app root without an explicit architectural reason.

## Current architecture anchors

Verify exact paths before use. Current areas include:

```text
app/                         Expo Router surfaces
src/features/sekret/         identity and companion style contracts
src/services/                client service boundaries
src/context/                 application context and gating
worker/                      canonical Cloudflare Worker source
worker/runtime-style.ts      identity/style runtime enforcement
worker/voice-entry.ts         configured Worker entry point
worker/observed-index.ts     delegated ordinary HTTP handler
supabase/migrations/         schema source of truth
supabase/functions/          Edge Functions
security/                    machine-readable security evidence
e2e/                         Playwright guardrails
implementation-ledger.json   feature evidence state
```

Do not invent a remembered monolithic character, state, or routing file. Inspect current ownership first.

## Canonical Cloudflare ownership

### Backend Worker

- name: `sekret-backend`
- entry point: verify against current `wrangler.toml`, currently `worker/voice-entry.ts`
- deployment: Cloudflare Workers Builds through native Git integration

Owns:

- authenticated APIs;
- AI replies and style enforcement;
- transcription and TTS relay;
- Bridge summary runtime;
- safety, push, and backend business logic;
- metadata-only telemetry.

### Frontend Pages

- project: `sekret-bip`
- deployment: Cloudflare Pages through native Git integration
- branch: `main`

Owns:

- Expo web export;
- browser routes and static assets;
- custom domain;
- public `/.well-known/sekret-release.json` commit marker;
- client bootstrap.

### Boundary rules

- secrets and backend logic belong to Worker or Supabase server-side boundaries, never Pages or Expo public variables;
- frontend routes and assets belong to the client, not the Worker;
- clients use `EXPO_PUBLIC_BACKEND_URL` for the canonical backend;
- GitHub Actions verifies deployment but does not become a second upload authority;
- the retired Supabase `release-health` function is never valid release evidence.

## Current release warning

[P0 #696](https://github.com/jussray/Sekret-Bip/issues/696) is open: the live Pages domain currently falls through to the application instead of serving JSON at both marker paths. Local build output, a green Worker check, or a Pages configuration statement does not prove the frontend release until the public well-known marker is restored.

## Exact-release verification

A production claim requires:

1. successful `Workers Builds: sekret-backend` for the exact commit;
2. deployed `/.well-known/sekret-release.json` matching the expected `main` SHA;
3. successful canonical Worker health check;
4. read-only production Playwright;
5. retained evidence artifact.

Check status is not enough when the deployed artifact reports a different SHA.

## Identity and companion architecture

The Worker and TTS paths consume canonical identity/style contracts.

Required invariants:

- Se'kret is a continuity presence, not a selectable named companion;
- Suhana, Sy, Cloud, and Night remain distinct named companions; legacy identifiers remain only at verified compatibility seams.
- internal-only identities do not leak into user-visible text, speech, archives, notifications, or accessibility labels;
- question budgets and deterministic repair are enforced;
- telemetry remains metadata-only;
- short-term history and approved context are supported;
- durable L4 continuity memory remains planned until its schema and privacy proof exist.

Do not replace the existing reply brain when a wrapper or adapter can make the canonical contract authoritative with less blast radius.

## Supabase architecture

- `supabase/migrations/` is the only schema source of truth.
- UI hiding never substitutes for RLS or server authorization.
- server-only tables must not receive client grants merely to silence a scanner.
- migrations must replay cleanly and match live migration versions.
- elevated database functions require positive owner/role tests and negative anonymous/cross-user tests.
- retired Edge Functions must have explicit replacements, no executable callers, and platform JWT protection when they remain registered.

Current live authorization evidence is recorded in `security/supabase-authorization-baseline.json`.

## L4 continuity boundary

Durable memory, goals, scheduled reflection, and relationship phase remain planned.

Do not create L4 tables or dashboards before the proposed boundary includes:

- ownership and provenance;
- correction and deletion;
- expiration/retention;
- RLS and executable denial tests;
- one real runtime consumer;
- rollout, telemetry, and rollback.

A dashboard is not an implementation substitute.

## State and data rules

- transient UI state belongs in client state only where the implementation says so;
- sensitive content must not be added to AsyncStorage without a reviewed exception;
- identity-bearing fields must not enter unauthorized client state;
- Parent Bridge remains consent-based and minimized at the response boundary;
- route separation never substitutes for database and server authorization;
- local/cloud conflict behavior must be explicit before multi-device editing is marketed as lossless.

## Workflow before changing architecture

1. Identify the user-visible outcome.
2. Resolve current runtime and data owners.
3. Classify privacy and authorization boundaries.
4. Update implementation ledger acceptance criteria and evidence state.
5. Implement the smallest runtime slice.
6. Add executable tests, telemetry, rollout, and rollback.
7. Run exact-head CI and Playwright.
8. Deploy only through the canonical authority.
9. Reconcile live evidence back into repository documentation.

## Environment rules

- Use staging when a real staging environment exists.
- Do not claim staging validation when no staging environment exists.
- Document the actual local, preview, controlled-production, and rollback path.
- Avoid untracked production dashboard edits when a repository-controlled path exists.
- Reconcile emergency production changes immediately with source, tests, and evidence.

## Output

At session start, report:

- verified repository, branch, and commit;
- route/runtime/data owners being touched;
- privacy and authorization boundaries;
- target environment and deployment authority;
- current implementation-ledger state;
- stale assumptions found in this skill or related docs.

Repository truth overrides this snapshot.

## Control Room ownership boundary

Keep one founder Control Room at `app/(dev)/control-room.tsx` and `src/screens/DevControlRoomWorkspace.tsx`. Local mission execution belongs in `src/services/controlRoom*`, `src/config/controlRoom*`, and `scripts/control-room-*.mjs`. Do not create a second app, route hierarchy, or operations dashboard. The browser never runs shell directly; it calls the authenticated loopback server, which invokes only fixed local-agent missions.
