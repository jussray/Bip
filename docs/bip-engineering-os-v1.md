# Bip Engineering OS — v1

## What This Is

A curated, opinionated operating system for Se'kret Bip development. It replaces ad-hoc decisions with a consistent set of architectural standards, automated reviewers, PR gates, CI/CD pipelines, and a living architecture constitution — so every new feature is evaluated against the same bar instead of whatever seemed right at 2 a.m.

The OS is organized in five parts:

1. Architecture Constitution — the non-negotiable rules every change must respect
2. Repository Structure — the file and folder layout that makes the rules enforceable
3. Reviewer Roles — who (or what) reviews each type of change and how
4. PR Gates — the automated checks every pull request must pass before merge
5. 30-Day Rollout — a concrete sequence to get from zero to operating

---

## Part 1 — Architecture Constitution

The constitution is a single source of truth. When a decision is ambiguous, the constitution answers it. Every reviewer and automated check in the OS is downstream of these rules.

### Invariants — Rules That Cannot Be Broken

These are hard stops. A PR that violates any invariant must be rejected, no exceptions.

**Safety invariants**

- Every user-facing flow involving a teen must pass the Safety Reviewer before merge.
- No companion may produce a response that gives medical, legal, or crisis-intervention advice without routing to the `safetyEscalation` handler.
- Every new prompt template must pass the AI Conversation Reviewer before it ships to production.
- Parent-bridge flows (anything a parent can see, configure, or receive) must pass the Parent Bridge Reviewer separately from the teen-facing review.

**Data and privacy invariants**

- All Supabase tables storing teen data must have Row Level Security (RLS) enabled and policies documented in `docs/rls-policies.md`.
- No teen data may leave the Supabase boundary except via authenticated Cloudflare Worker endpoints.
- Memory writes (any upsert to `companion_memory` or related tables) must go through `memory-writer.ts` — never direct SQL from a companion worker.
- Auth tokens must never be logged, even in development.

**Companion identity invariants**

- Raylene, Rylane, Cloud, Night, Se'kret, and Parent Coach each have a canonical voice document in `docs/companions/`. No PR may change companion behavior without updating or explicitly referencing that document.
- Reply pools in `worker/companion-replies.ts` are considered product, not engineering. Changes require product sign-off in the PR description.
- Personality, tone, and interaction model are owned by the product layer. The engineering layer may optimize delivery but must not alter substance.

**Infrastructure invariants**

- Cloudflare Workers are the only compute layer between the client and Supabase. No direct client-to-Supabase calls from the React Native app except for authenticated storage and realtime subscriptions.
- All Worker endpoints must be covered by an integration test before they graduate from staging.
- No secrets in source code. Environment variables in `.dev.vars` (local) and Cloudflare secrets (production).

### Defaults — Rules That Apply Unless Explicitly Overridden

These apply by default. A PR may deviate with a documented reason in the PR description.

- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- All new Expo screens go in `app/` using Expo Router file-based routing.
- All data fetching uses React Query (TanStack Query). No bare `useEffect` for async data.
- Supabase queries are wrapped in typed helper functions in `lib/supabase/`. Raw query objects do not appear in component files.
- Cloudflare Worker files live in `worker/`. One file per logical service (e.g., `sekret-reply.ts`, `memory-writer.ts`, `safety-check.ts`).
- New features ship behind a feature flag in `lib/flags.ts` until verified in staging.
