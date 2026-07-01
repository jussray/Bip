# Circle V1 → V2 Migration Plan

**Status: Phase 0 — locking the target model in the repo. No Supabase migrations applied. No app screens or `sync.ts` changed yet.**

Work order, per direction: (1) repo plan locked here first, (2) a real Supabase migration applied only after this plan is signed off, (3) app code (`sync.ts`, `CircleScreen.tsx`, `feed.tsx`) updated last, to read/write whatever (2) produces. This document is step 1 only.

---

## 0. Correction: earlier "live schema" findings in this doc were checked against the wrong project

Two prior audit passes in this session ran against Supabase project `jvmbhralyktmdlvglrxk` ("jussray's Project"), which does not appear anywhere in this repo. The actual deploy target is `tbsevonvegdnlyjgplmm`, confirmed by `.github/workflows/deploy-supabase-function.yml`, which gates Edge Function deploys behind an operator typing that exact ref as a confirmation string. Consequences:

- The "safety-scan trigger posts to the wrong project" finding from the earlier draft was a **false alarm** — retracted. The trigger correctly targets `tbsevonvegdnlyjgplmm`, which is itself.
- Every other "live" claim from the earlier draft (bigint vs. UUID ids, `post_comments` column names, which of the 11 undocumented tables exist, the RLS membership-gating gap) was also checked against the wrong project and needs re-confirmation against `tbsevonvegdnlyjgplmm`. That's Phase 0 deliverable #1 below — still blocked on MCP access resolving (access was granted but hasn't propagated to this session as of this writing; retrying separately from this plan update).
- This doc now treats those facts as **unconfirmed** rather than restating them as verified. Where earlier wording is still useful as a design shape, it's marked as such, not as fact.

---

## 1. Target Circle model (product intent — locking this now)

| Circle | Audience | Shows | Identity exposure | Access mechanism |
|---|---|---|---|---|
| **Teen Circle** (`kind='public'`) | Every verified teen | All teen public posts | Always anonymous — no real identity, ever | Open read to any account in a teen-verified state; not membership-gated |
| **Parent Circle** (`kind='parent'`, new) | Every verified guardian account | All parent community posts | Anonymous display only | Open read gated on `account_verification.verification_state = 'VERIFIED_GUARDIAN'` (+ `circle_profiles.account_type = 'guardian'`) — independent of `parent_links`, see §1.1 |
| **Bip Crew** (`kind='crew'`) | Accepted crew members only | Posts within that trust group | May reveal identity/first name, but only after acceptance | `circle_members`, sourced from accepted-only crew connections |
| **Friends Circle** (`kind='friends'`) | Accepted friends only | Posts within that trust group | Anonymous or nickname by default; more only if trust allows | `circle_members`, sourced from accepted-only friend connections |

### 1.1 Decided — standalone guardian verification, independent of `parent_links`

`parent_links` means "I am linked to this specific teen." Parent Circle needs to mean "I am a verified guardian account." Those are different claims, so Parent Circle access must not be derived from `parent_links` at all.

**`account_verification.verification_state` additions** (alongside the existing `UNVERIFIED, PENDING_PARENT, PENDING_TRUSTED_ADULT, LIMITED_MODE, VERIFIED_TEEN, EXPIRED, MANUAL_REVIEW, SUSPENDED` — `supabase/migrations/20260630001000_account_verification_parent_approval.sql:5-9`):

- `VERIFIED_GUARDIAN`
- `PENDING_GUARDIAN_REVIEW`
- `GUARDIAN_REJECTED`
- `GUARDIAN_SUSPENDED`

**Parent Circle access requires:**
- `circle_profiles.account_type = 'guardian'`
- `account_verification.verification_state = 'VERIFIED_GUARDIAN'`

**Parent Circle access must NOT require:**
- `parent_links.status = 'active'`
- a teen invite code
- being linked to any specific teen

`parent_links` remains scoped to its existing purpose only — Parent Bridge / teen-parent sharing — and is otherwise unrelated to Parent Circle membership.

Open implementation question (not blocking this decision, but real): `circle_profiles` currently has no `CREATE TABLE` anywhere in repo migrations — it's referenced in `TABLES` (`src/utils/supabase.ts`) but only exists live, if at all, with unconfirmed columns. Whether `account_type` belongs on `circle_profiles` specifically, or on some other profiles/account table, is a Phase 0 item 1 question — needs the actual live column list before the migration can reference it correctly. The `VERIFIED_GUARDIAN` verification-state piece is unaffected by this, since it lives on `account_verification`, whose shape is already confirmed from the repo migration.

---

## 2. Enforcement principle

Supabase (RLS, policies, views/RPCs) is the authority for:
- **who can see what** — Teen/Parent Circle: gated on verification state + `circles.kind`, not on per-row `circle_members` enrollment. Friends/Crew: gated on `circle_members`, itself sourced only from accepted-state connections.
- **who can post where** — gated on account ownership + verification state matching the circle kind.
- **what identity is exposed** — identity fields are omitted/nulled at the query layer (view or RPC), never trusted from a client-supplied flag.

The app UI is presentation only and must not be treated as an access boundary — this was true in the earlier draft and remains the central principle here.

---

## 3. Schema shape for the model — two options, recommend the smaller one

Earlier in this process (before the wrong-project correction) the assumption was that Public/Parent circles need a single system-owned seeded row, because `circles.owner_user_id` is `NOT NULL` in the repo migration and a genuinely shared circle can't be "owned." Revisiting that:

- **Option A (recommended) — keep per-owner circles, add a kind-scoped open-read policy.** Every verified teen still gets their own `public`-kind circle (auto-provisioned on first post, one row per owner per kind, same as the existing repo migration's design). The feed query already aggregates across *all* circles of a kind with no owner filter — the only thing missing is a read policy that doesn't require `circle_members` membership for `kind IN ('public','parent')`. This requires **zero schema changes** to `circles` itself, only new/adjusted RLS policies. Same pattern extends cleanly to Parent Circle once §1.1 is resolved.
- **Option B — single system-owned seeded circle**, requiring `owner_user_id` to become nullable plus an `is_system` flag and a seed row. More invasive, no clear advantage over A for this use case — only worth it if there's a reason a "circle" needs to exist independent of any owning account, which nothing in §1 currently requires.

Recommend A. Flagging both so the choice is explicit rather than assumed.

Illustrative shape (not final DDL — literal column types depend on Phase 0 item 1, i.e. confirming whether `tbsevonvegdnlyjgplmm` actually matches the repo's bigint-based migration or the UUID-based shape reported from the live dashboard):

```
-- circles.kind check gains 'parent'
-- new RLS: circles read open for kind in ('public','parent') when caller's
--   verification state qualifies; circle_members-gated read unchanged for friends/crew
-- new RLS: posts read open for kind in ('public','parent') under the same condition
-- posts: reject insert where kind='public' or 'parent' and is_identity_revealed=true (DB-level guard, not app-level)
```

Writing literal `CREATE POLICY`/`ALTER TABLE` SQL now, before Phase 0 item 1 confirms real column types and constraint names in `tbsevonvegdnlyjgplmm`, risks producing a migration that's syntactically wrong against the real schema. That SQL gets drafted once access to the correct project is confirmed — this doc intentionally stops at the shape/spec level for anything schema-type-dependent.

---

## 4. Identity visibility rules

- **Teen Circle:** `is_identity_revealed` forced `false` at write time, plus a DB-level constraint/trigger rejecting any row where `kind='public' AND is_identity_revealed=true`. Never trust the client flag alone.
- **Parent Circle:** same treatment as Teen Circle — "anonymous display only" per §1, so identity is never exposed regardless of any per-post flag.
- **Bip Crew:** identity (first name) may be shown, but only to viewers who are themselves accepted members of that specific crew circle — i.e. gated by the viewer having an active `circle_members` row on that `circle_id`, not exposed circle-wide by default. Since crew membership itself only exists for accepted connections, "is a member of this circle" and "is an accepted connection with the author" are the same check — no separate trust flag needed beyond membership.
- **Friends Circle:** nickname by default (source TBD — likely the same profile/display-name table friends screens already use), same membership-gated pattern as Crew for anything beyond nickname.

For Crew/Friends, this likely means feed reads go through a view or RPC that joins `circle_members` to decide what identity fields to return, rather than a flat `select *` — flagging as a design requirement, not committing to exact SQL yet for the same reason as §3.

---

## 5. Safety scan contract

- Extend the existing `trigger_safety_scan()` (generalizes over content column already — supports `'text'` and `'body'`, no function-body change needed) to also fire on `posts` via `AFTER INSERT ... EXECUTE FUNCTION public.trigger_safety_scan('body')`.
- Add `posts` to the Edge Function's allowed source-table list.
- Keep the existing `journal_entries`/`circle_posts`/`public_circle_posts` triggers as-is during the transition — don't remove until those tables are actually deprecated (Phase 7 in the broader migration, not this step).
- Do **not** touch the webhook URL — confirmed correct against the real project (§0).

---

## 6. Reaction vocabulary

Carried over from the earlier draft, still needs confirmation against the real project once access resolves (Phase 0 item 1):

- Teen: `felt`, `comfort`, `proud`, `stay`
- Parent: `beenThere`, `solidarity`, `reminder`, `needed`, `strength`

These match the legacy `*_circle_posts.reactions` jsonb defaults found in `0001_init.sql`/`0004_supplemental_tables.sql` — that part is repo-verifiable regardless of which live project is authoritative, since it's the same file either way.

---

## 7. Files touched (unchanged from earlier draft, for reference — no edits made yet)

| Category | Files |
|---|---|
| Runtime | `src/utils/sync.ts`, `src/utils/supabase.ts`, `app/(teen)/circle/feed.tsx`, `screens/CircleScreen.tsx`, `supabase/functions/safety-scan/index.ts` |
| Schema | `supabase/migrations/*.sql`, `db/schema.sql` |
| Tests | `test/sync-restore.test.mjs` |
| Docs | `docs/circle-v1-spec.md`, `docs/circle-model-v1-spec.md`, `docs/SUPABASE.md`, `docs/WIRING_STATUS.md` |

None of these are edited in this step.

---

## 8. Phase 0 checklist

1. **Repo-vs-live schema reconciliation** — still blocked, confirmed on a third attempt. `list_organizations` shows this connector *is* a member of the right org ("Se'kret Bip", `xqztwjziupbtzmvdakkt`), so it's not a wrong-account/wrong-org problem. But `list_projects` still only returns `jvmbhralyktmdlvglrxk`, and both `get_project('tbsevonvegdnlyjgplmm')` and `execute_sql` against it fail with a permission error, not "not found." Diagnosis: **project-scoped access**, not org membership — this connector's account needs to be granted access to `tbsevonvegdnlyjgplmm` specifically (Project Settings → Team/Access for that project, not the org-wide members list). A draft migration built from the reported (unverified) live audit is at `docs/circle-v2-phase0-draft-migration.sql` — explicitly marked do-not-apply, ready to be corrected the moment real access lands.
2. **Final Circle model** — locked, §1.
3. **Parent community model** — locked, §1.1: standalone `VERIFIED_GUARDIAN` state, independent of `parent_links`.
4. **Identity visibility rules** — drafted in §4.
5. **Safety scan contract** — drafted in §5.
6. **Reaction vocabulary** — conflict, unresolved: §6 lists `felt/comfort/proud/stay` (teen) and `beenThere/solidarity/reminder/needed/strength` (parent), sourced from the repo's own `*_circle_posts.reactions` jsonb defaults — that part is repo-verifiable independent of which project is live. Separately, a `reaction_kind` enum (`hug, heart, listen, support, spark`) has been reported as the live `post_reactions.reaction` type. These are two different vocabularies for the same field — needs independent confirmation of which (if either) actually exists on `tbsevonvegdnlyjgplmm` before either is adopted, not an assumption either way.
7. **No destructive SQL** — honored; nothing applied this step.
8. **No runtime cutover** — honored; no `sync.ts`/screen changes this step.

## 9. Explicitly not in this step

- No Supabase migrations applied.
- No literal migration SQL committed yet — see §3/§4 for why (schema-type-dependent, waiting on confirmed live column types).
- No app code changes.
- No RLS changes live.
- Live-schema facts reported in chat (id types, `post_comments` columns, `reaction_kind` enum values, row counts, trigger-URL correctness) are recorded as **reported, not independently confirmed** — see §8 item 1. The point of catching the earlier wrong-project mixup was to stop treating either side's unverified claims as fact; that standard applies the same way here. Once this session gets real read access, every one of these gets checked directly and this section gets updated with the actual result either way.

## Next steps

1. ~~Your call on §1.1~~ — done: standalone `VERIFIED_GUARDIAN` state, independent of `parent_links`.
2. Still needed: Supabase MCP access to `tbsevonvegdnlyjgplmm` actually reaching this session — two attempts have failed with a permission error. Worth checking the Supabase dashboard's collaborator list for that project directly, since "grant access" from this side doesn't seem to be enough on its own.
3. Once access works, run the read-only verification queries (id types, `post_comments` columns, reaction constraint/enum, table inventory, row counts, trigger body) and update §0/§6/§8 with confirmed results.
4. Only then draft the actual migration SQL (§3/§4's deferred DDL) against confirmed column types and the now-locked §1.1 model — separate PR, still no cutover.
5. Only after that migration is applied and verified, update `sync.ts`/screens (step 3).
