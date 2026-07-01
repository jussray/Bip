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
| **Parent Circle** (`kind='parent'`, new) | Every verified parent/guardian | All parent community posts | Anonymous display only | Open read to any verified-guardian account; **must not** be derived from `parent_links`/Bridge — see §1.1, this needs a decision |
| **Bip Crew** (`kind='crew'`) | Accepted crew members only | Posts within that trust group | May reveal identity/first name, but only after acceptance | `circle_members`, sourced from accepted-only crew connections |
| **Friends Circle** (`kind='friends'`) | Accepted friends only | Posts within that trust group | Anonymous or nickname by default; more only if trust allows | `circle_members`, sourced from accepted-only friend connections |

### 1.1 Open decision — there is no "verified parent/guardian" state in the schema today

`account_verification.verification_state` (`supabase/migrations/20260630001000_account_verification_parent_approval.sql:5-9`) only allows: `UNVERIFIED, PENDING_PARENT, PENDING_TRUSTED_ADULT, LIMITED_MODE, VERIFIED_TEEN, EXPIRED, MANUAL_REVIEW, SUSPENDED`. There is no `VERIFIED_PARENT`/`VERIFIED_GUARDIAN` value. The only place "this account is a parent" is established today is `redeem_parent_link_invite()` (same file, `:75-138`), which is inherently scoped to one specific teen's invite code — i.e. today, "being a parent" only exists in the context of one `parent_links` row.

So "verified parent, not tied to `parent_links`/Bridge" has no schema hook to attach to yet. Two ways to close this, and it needs your call before Phase 0 can be marked done for the Parent Circle row:

- **(a) Independent parent verification.** Add a parent-side signup/attestation flow that doesn't require redeeming any specific teen's invite code, plus a new state (e.g. `VERIFIED_PARENT`) or a separate table. Most faithful to "not tied to `parent_links`," more product/schema work.
- **(b) Derive "verified parent" from "has completed at least one `parent_links` redemption, for any teen."** Decoupled from *which* teen/link, but still bootstrapped by the existing `parent_links` mechanism. Faster to ship, arguably still "tied to `parent_links`" in spirit even if not scoped to a specific one.

Flagging, not deciding — need your answer before this row of §1 is locked.

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

1. **Repo-vs-live schema reconciliation** — blocked on Supabase MCP access to `tbsevonvegdnlyjgplmm` actually reaching this session; access was granted but hasn't propagated yet, tracked separately from this doc.
2. **Final Circle model** — drafted in §1, one open decision remaining (§1.1).
3. **Parent community model** — drafted in §1's Parent Circle row + §1.1.
4. **Identity visibility rules** — drafted in §4.
5. **Safety scan contract** — drafted in §5.
6. **Reaction vocabulary** — carried in §6, needs live confirmation once item 1 unblocks.
7. **No destructive SQL** — honored; nothing applied this step.
8. **No runtime cutover** — honored; no `sync.ts`/screen changes this step.

## 9. Explicitly not in this step

- No Supabase migrations applied.
- No literal migration SQL committed yet — see §3/§4 for why (schema-type-dependent, waiting on confirmed live column types).
- No app code changes.
- No RLS changes live.

## Next steps

1. Your call on §1.1 (verified-parent definition: option a or b) and §3 (Option A vs B for circle ownership — recommending A).
2. Resolve Supabase MCP access to `tbsevonvegdnlyjgplmm` so Phase 0 item 1 and the reaction-vocabulary confirmation can run against real data instead of being deferred.
3. Once §1.1/§3 are decided and item 1's schema facts are in hand, draft the actual migration SQL (step 2 in your ordering) — separate PR, still no cutover.
4. Only after that migration is applied and verified, update `sync.ts`/screens (step 3).
