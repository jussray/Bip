# bip-supabase-guardian

## Relationship to Upstream Skills

This skill layers on top of the installed `supabase` and
`supabase-postgres-best-practices` skills. Read those first for general
Supabase and PostgreSQL guidance. This skill adds Bip-specific trust
boundaries, data classification, and proof requirements that the generic
skills cannot know.

When this skill and an upstream skill conflict, this skill wins.

---

## Trigger

Activate whenever a PR or session touches:

- `supabase/migrations/`
- `supabase/functions/`
- Any RLS policy
- Any RPC function
- `src/utils/supabase*`
- `src/services/` files that read or write Supabase directly
- `worker/` files that call Supabase
- Auth flows, session handling, or JWT verification
- Account deletion, data export, or cache clearing
- pgvector memory tables (when built)
- Any schema change affecting teen, parent, guardian, or Circle data

Also activate before claiming any Supabase state (health, migration
status, Edge Function count) is current. Read `SPRINT.md` first, then
verify using `bip-repo-truth`.

---

## Bip Data Trust Model

### Users and Roles

| Principal | Trust level | Notes |
|---|---|---|
| Teen | Owner of private data | Cannot be read by any other party without explicit consent |
| Verified guardian | Elevated, consent-scoped | Access granted only to Bridge-summarised data, not raw journal or chat |
| Linked parent | Limited, RPC-only | `parent_links` mutations via RPC only, never direct table write |
| Service role | Backend-only | Permitted only inside Edge Functions with explicit audit justification |
| Anon / public | Zero access to user data | Must be provably denied at RLS level |

### Data Classification

| Data type | Owner | Guardian access | Notes |
|---|---|---|---|
| Journal entries | Teen | None | Private by design |
| Chat history | Teen | None | Private by design |
| Bridge summaries | Teen | Read (consent-gated) | Summarised, not raw |
| Circle posts | Teen (pseudonymous) | None | Circle identity is separate from real identity |
| Voice session metadata | Teen | None | |
| Agent memories (future) | Teen | None | pgvector; deletion path required |
| Guardian review queue | Guardian | Read (their queue only) | `guardian_review_queue` migration landed 20260711193738 |
| Parent link records | System | RPC-only | Direct table writes forbidden |
| Account metadata | Teen | None | |

---

## Required Proof Sequence

Before any database change that touches the above tables or their policies:

1. **Verify live project and migration state.**
   Read `SPRINT.md`, then run the bip-repo-truth verification sequence.
   Confirm the live project matches the repository migration history.
   Schema drift is not certified by Supabase project health alone.

2. **Read the affected RLS and RPC contracts.**
   Identify every policy on every table touched by the change.
   Identify every RPC that wraps mutations on those tables.

3. **Classify the data audience.**
   State explicitly: who can read this row? Who can write it?
   Who must be denied? Map to the trust table above.

4. **Prove anonymous denial.**
   Write or verify a test that confirms `anon` role cannot read or
   write the affected rows. If the table is not publicly accessible,
   prove it with policy text, not assumption.

5. **Prove cross-user denial.**
   Confirm that user A cannot read or write user B's rows.
   The standard pattern is `auth.uid() = user_id` in the USING clause.
   Verify this is present and not bypassable.

6. **Prove guardian access is no broader than consent permits.**
   If a guardian can read any data, confirm the policy scope matches
   the consent model exactly. Bridge summaries only, not raw content.
   Consent withdrawal must revoke access immediately.

7. **Add rollback and regression evidence.**
   Every migration must have a documented rollback path.
   Every RLS change must include a test or SQL proof of denial.
   "It looks right" is not evidence.

---

## RPC-Only Mutations

The following tables must only be mutated via named RPC functions.
Direct `INSERT`, `UPDATE`, or `DELETE` from client code is forbidden.

- `parent_links` — use the designated RPC; verify the function
  validates the linking token and records the event.

When adding a new sensitive mutation path:
1. Create a named RPC function with explicit parameter validation.
2. Add an RLS policy that denies direct table mutation from all roles
   except service role.
3. Audit the RPC for parameter injection and privilege escalation.
4. Document the RPC in this skill's table above.

---

## Edge Function Rules

- Every Edge Function that accesses user data must verify the JWT.
  No unauthenticated access to user rows, ever.
- Service-role access inside an Edge Function must be justified in a
  comment explaining why the elevated role is required and what scope
  limits it.
- Edge Functions must not log raw user content, chat history, or
  journal text. Log event types and anonymised metadata only.
- New Edge Functions must be listed in `SPRINT.md` after deployment.
  The current verified count is 16 (as of 2026-07-12).

---

## Migration Safety Rules

- Run `supabase db diff` against the live project before opening a
  migration PR. Schema drift between the live project and the
  repository is a blocker.
- Never run `supabase db reset` against the live project.
- Migration filenames must follow the existing timestamp format:
  `YYYYMMDDHHMMSS_description.sql`.
- Every migration that adds a table or column must include:
  - RLS enabled on the table
  - At least one policy (or explicit justification for zero policies)
  - A documented rollback statement
- Do not combine schema changes and data migrations in the same file.
- Do not bundle a migration with unrelated application code in the
  same PR.

---

## pgvector / Agent Memory Rules (Pre-Build)

Durable companion memory is not yet built (L3 Phase 1 in the
architecture plan). When it is built, the following constraints apply
from day one:

- Memory rows are owned by a `(user_id, companion_id)` pair.
  No memory is shared across companions without explicit design.
- Raw transcript text must never be stored as a memory entry.
  Store extracted, safety-reviewed, semantic summaries only.
- Every memory table must have a deletion path reachable by the
  teen from within the app. "Forget this" is not optional.
- Memory read and write events must be logged to an audit table.
- pgvector similarity search must be scoped to the authenticated
  user's rows. Cross-user vector search is forbidden.
- Memory compression and reflection runs outside the live reply
  latency path. It must not access private session content
  without server-side scope controls and audit evidence.

---

## Account Deletion Requirements

When a teen account is deleted:

1. All journal entries, chat history, voice session metadata, and
   Bridge summaries must be hard-deleted or cryptographically
   unrecoverable within the retention window.
2. Agent memories (when built) must be deleted.
3. Circle pseudonymous identity must be unlinked.
4. Parent links must be invalidated.
5. Any cached or derived data in the Worker or Edge Functions must
   be purged.
6. The deletion event must be logged with a timestamp and
   confirmation of row counts deleted.

Do not implement soft-delete for teen private data without explicit
product and legal review.

---

## Absorbed Prompt OS Capabilities

The following Prompt OS prompts are considered covered by this skill
for repository work. Use this skill instead of re-running those prompts
in isolation:

- RLS Policy Generator
- Auth & Trust Audit
- DB Migration Safety Check
- pgvector Memory Review

Generating SQL is easy. Proving it does not leak a teenager's journal
to the wrong adult is what this skill enforces.

---

## What This Skill Does Not Own

- Cloudflare Worker deployment and health → `bip-worker-guardian`
- Companion reply logic and AI behaviour → `bip-companion-lab`,
  `bip-ai-review`
- Privacy threat modelling → `bip-privacy-redteam`
- Release gating → `bip-release-gate`
- General PostgreSQL best practices → upstream `supabase-postgres-best-practices`

---

## Output

After any Supabase-touching review:

```
Supabase Guardian: [CLEAR|BLOCKED]
Migration drift: [none detected | <description>]
RLS proof: [anonymous denial ✓ | cross-user denial ✓ | guardian scope ✓]
RPC contracts: [unchanged | <list of changes>]
Edge Functions: [unchanged | <list of changes>]
Rollback: [documented | MISSING — blocker]
[If BLOCKED]: <specific issue and required fix before merge>
```
