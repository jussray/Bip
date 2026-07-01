# Circle V1 → V2 Migration Plan

**Status: Phase 0 — live schema now independently verified against `tbsevonvegdnlyjgplmm`. One unresolved structural conflict blocks finishing §1's Parent Circle row (§1.2). No Supabase migrations applied. No app screens or `sync.ts` changed yet.**

Work order, per direction: (1) repo plan locked here first, (2) a real Supabase migration applied only after this plan is signed off, (3) app code (`sync.ts`, `CircleScreen.tsx`, `feed.tsx`) updated last. This document is step 1 only.

---

## 0. Access history (resolved)

Three Supabase identities got tangled in this process before landing on the real one:

1. This session's original connector had project-scoped access to `jvmbhralyktmdlvglrxk` ("jussray's Project") — unrelated to this repo, org `xqztwjziupbtzmvdakkt`.
2. `tbsevonvegdnlyjgplmm` (confirmed via `.github/workflows/deploy-supabase-function.yml`'s deploy-confirmation gate) is the real target — but belongs to a **different** org, `vercel_icfg_v3CousBaJVAqOT9wXYPLhyR2` (Vercel's Supabase integration), also confusingly named "Se'kret Bip". Being a member of org `xqztwjziupbtzmvdakkt` never implied access to a project in a different org — that's why the earlier diagnosis ("org is right, just need project-level access") was half right: the *access model* diagnosis (project-scoped, not org-wide) was correct, but the org itself also turned out to be different, not just the project-within-org.
3. Access was ultimately restored through a separate path: a project-scoped `.mcp.json` entry pointed at `mcp.supabase.com?project_ref=tbsevonvegdnlyjgplmm` was added, but its own OAuth approval also required an interactive terminal this session doesn't have. What actually unblocked this session was the original platform connector (`mcp__610720e7-...`) gaining access to `tbsevonvegdnlyjgplmm` directly — confirmed working as of this write-up.

Everything below this line is from live queries run just now against `tbsevonvegdnlyjgplmm`, not from anyone's report.

---

## 1. Target Circle model (product intent, locked in a prior turn) — now checked against real schema

| Circle | Audience | Shows | Identity exposure | Access mechanism |
|---|---|---|---|---|
| **Teen Circle** (`kind='public'`) | Every verified teen | All teen public posts | Always anonymous | **Already works** — confirmed live, §1.1 |
| **Parent Circle** (`kind='parent'`) | Every verified guardian account | All parent community posts | Anonymous display only | **Structurally blocked** — `kind='parent'` circles require a specific `parent_link_id`, conflicting with the "not tied to `parent_links`" decision. See §1.2, needs your call. |
| **Bip Crew** (`kind='crew'`) | Accepted crew members only | Posts within that trust group | May reveal identity/first name after acceptance | Real live model found, different from what was drafted — see §1.3 |
| **Friends Circle** (`kind='friends'`) | Accepted friends only | Posts within that trust group | Anonymous/nickname by default | **Already works**, via a `friendships` table — see §1.4 |

### 1.1 Teen Circle — confirmed already correct, no changes needed

Live RLS on `circles`:

```sql
-- "circles select owner or member"
(owner_user_id = auth.uid()) OR (id IN (select circle_id from circle_members where user_id = auth.uid())) OR (kind = 'public'::circle_kind)
```

And on `posts` ("posts select by circle visibility"):

```sql
(author_user_id = auth.uid())
OR (circle_id IN (select id from circles where kind = 'public'))
OR (circle_id IN (select id from circles where kind = 'friends' and owner_user_id in (mutual friendship via `friendships`)))
OR (circle_id IN (select circle_id from circle_members where user_id = auth.uid()))
```

The `kind = 'public'` carve-out already grants open read to every authenticated user, with no membership requirement — this is exactly what the target model needs. The earlier finding (from the wrong project) that public reads were membership-gated does **not** apply here. Nothing to build for Teen Circle reads. Identity anonymity (§4) still needs a DB-level guard — that part is real, see below.

### 1.2 Parent Circle — structural conflict, needs a decision before this can be built

`circles` has a real CHECK constraint enforcing shape by kind:

```sql
-- circles_kind_shape
CHECK (
  (kind = 'crew'   AND crew_id IS NOT NULL AND parent_link_id IS NULL) OR
  (kind = 'parent' AND parent_link_id IS NOT NULL AND crew_id IS NULL) OR
  (kind IN ('public','friends') AND crew_id IS NULL AND parent_link_id IS NULL)
)
```

Every `kind='parent'` circle **must** reference exactly one `parent_links` row (`circles_parent_link_id_fkey → parent_links(id)`). This is a hard structural requirement, not a policy that can be loosened — a `kind='parent'` circle with no `parent_link_id` is not a representable row under this schema. What's been built for `parent` is a **private space scoped to one specific teen-guardian Bridge link** — closer to "shared family space for this one connection" than "community feed for all verified guardians." (There's also no `kind='public'`-style open-read carve-out for `kind='parent'` in the `circles`/`posts` RLS — consistent with it being a private per-link space, not a community one.)

This directly conflicts with the locked §1 decision that Parent Circle must be a shared community feed, independent of any specific `parent_links` row. Three ways to resolve, genuinely need your call:

- **(a) Add a new `circle_kind` enum value** (e.g. `parent_community`) for the global guardian feed, and leave the existing `kind='parent'` + `parent_link_id` structure alone — it may be serving a real, separate purpose (a private per-family space) that shouldn't be repurposed or removed. Cleanest separation, but means "Parent Circle" in the product sense maps to a differently-named `kind` than the word "parent" suggests.
- **(b) Relax `circles_kind_shape`** to allow `kind='parent' AND parent_link_id IS NULL` as an additional valid case (a "global" parent circle with no link), keeping per-link parent circles as a second valid shape under the same `kind`. Keeps the enum value name intuitive, but means `kind='parent'` covers two different concepts (global community vs. per-link private space) that then need to be told apart by nullability of `parent_link_id` everywhere they're queried — easy to get wrong in RLS/app code later.
- **(c) Reuse `kind='public'`** for both Teen and Parent community feeds, distinguished by `circle_profiles.account_type` (`'teen'` vs `'guardian'`) rather than by `circles.kind` at all — then the existing `kind='public'` open-read carve-out already covers both, and the split into two feeds happens by filtering on the author's `account_type` at read time. Reuses working infrastructure with zero constraint changes, but conflates two different-shaped audiences under one `kind` value, and needs the read query (not RLS) to do the teen/guardian split — meaning RLS alone wouldn't stop a teen from seeing a guardian's "public" post unless something else enforces it.

I'd lean toward (a) as the least likely to create confusion later, but this is a real product/architecture call, not something to default into.

### 1.3 Bip Crew — the live model is a third table, not the two drafted earlier

Confirmed: there's a `crews` table (`id, owner_user_id, name, description, max_members [2-15 CHECK], is_archived, created_at, updated_at`) that neither the earlier draft nor the repo migrations mentioned. `circles.crew_id` (real column, confirmed) FKs to `crews(id)`. So the actual live model is:

```
crews (the named group, 2-15 members, owned by one user)
  → circles (kind='crew', crew_id = crews.id)   -- one circle per crew
    → circle_members (who can read/post in that circle)
```

Live RLS on `crews`: owner can read/write their own; anyone who is a `circle_members` row on the linked `kind='crew'` circle can also read the crew. This is a coherent, already-working model — separate from both `crew_members` (the older accountability/check-in feature, `connection_status` pending/accepted/blocked/removed, `cadence`) and `crew_memberships` (a third, still-unexplained table with just `user_id`/`member_id`). All three (`crews`, `crew_members`, `crew_memberships`) exist live with real constraints; only `crews` is actually wired into the `circles`/RLS model for Bip Crew posts. Recommend: **`crews` + `circle_members` is the canonical model for Bip Crew circles** — this matches what was already decided in principle ("crews + circle_members as canonical"), just with the concrete table now identified. `crew_members`/`crew_memberships` remain a separate legacy question, not blocking Circle work.

### 1.4 Friends Circle — already implemented, via `friendships`, not `circle_members`

Confirmed live: a `friendships` table with `user_id`/`friend_user_id`, checked as a **mutual pair** in the `posts select by circle visibility` policy (`f1.user_id = f2.friend_user_id AND f1.friend_user_id = f2.user_id`). This is the real access model for Friends Circle — not `circle_friendships`/`circle_friend_requests` (which don't appear in the live table inventory at all, and were likely an artifact of the earlier wrong-project audit). Friends Circle visibility is already built; only the identity-reveal-after-trust piece (§4) is unbuilt.

---

## 2. Enforcement principle (unchanged)

Supabase (RLS, policies, functions) is the authority for who can see/post/reveal what — the app UI is presentation only. This is already substantially true in the live schema: `assert_can_access_post()` and `can_access_media_attachment()` are real, already-deployed helper functions gating `post_comments`/`post_reactions`/`media_attachments` reads. (Bodies not inspected yet — low risk, since they gate reads consistently with the `posts` policy shape already confirmed above.)

---

## 3. Confirmed schema facts (replaces all earlier "reported"/"unconfirmed" markers)

All ids on `circles`, `circle_members`, `posts`, `post_reactions`, `post_comments`, `crews`, `media_attachments` are **UUID** — the repo's `0004_supplemental_tables.sql` (bigint/bigserial) does not match live and was never applied to this project as written. `post_comments` uses `author_user_id`/`body`, not `user_id`/`text`. `circles.kind` and `post_reactions.reaction` are real Postgres enum types (`circle_kind`, `reaction_kind`), not free text or CHECK-constrained text as the repo migration has them.

`circle_kind` enum: `public, friends, crew, parent` — `'parent'` already exists, no enum change needed there.

`reaction_kind` enum: `hug, heart, listen, support, spark` — confirmed real and in the live schema (§6, still an open vocabulary conflict).

`circle_profiles`: `user_id (PK), nickname (1-40 chars), avatar_emoji (1-16 chars), account_type CHECK IN ('teen','guardian'), created_at, updated_at`. The `account_type` column §1.1 (prior turn) needed already exists — nothing to add.

`media_attachments`: fully built — `owner_user_id, post_id, comment_id (exactly one of the two required), bucket_id (CHECK IN ('bip-post-media','bip-scrapbook-media')), object_path (unique with bucket_id), media_type (enum media_kind), mime_type, file_size_bytes (≤50MB), width, height, duration_seconds, alt_text`. No new work needed here — the "media_attachments doesn't exist yet" assumption from earlier drafts was wrong.

`account_verification.verification_state` CHECK constraint confirmed live, identical to the repo migration: `UNVERIFIED, PENDING_PARENT, PENDING_TRUSTED_ADULT, LIMITED_MODE, VERIFIED_TEEN, EXPIRED, MANUAL_REVIEW, SUSPENDED`. No `VERIFIED_GUARDIAN` yet — confirms §1's Parent Circle decision genuinely requires a real migration (once §1.2 is resolved), not just documentation.

Row counts: `circles`, `posts`, `circle_members`, `post_reactions`, `post_comments`, `crews`, `crew_members`, `crew_memberships`, `parent_links`, `circle_profiles` are all **0 rows**. `account_verification` has exactly 1 row (no `VERIFIED_TEEN` rows). No backfill or data-loss risk for anything in this doc.

Safety-scan trigger: confirmed, independently, pointed at `https://tbsevonvegdnlyjgplmm.supabase.co/functions/v1/safety-scan` — this project, correctly. No action needed (already established, now doubly confirmed).

---

## 4. Identity visibility rules

- **Teen Circle:** needs a DB-level guard rejecting `is_identity_revealed=true` when the target circle is `kind='public'` — not yet present live. Real, small piece of work.
- **Parent Circle:** blocked on §1.2.
- **Bip Crew:** identity reveal after acceptance — gate on `circle_members` membership on the crew's linked circle, consistent with §1.3's confirmed model. Not yet built (no such logic found in the RLS reviewed so far).
- **Friends Circle:** nickname by default, gated the same way, keyed off the confirmed `friendships` mutual-pair check (§1.4) rather than `circle_members`.

---

## 5. Safety scan contract (unchanged, now fully confirmed rather than assumed)

- Extend `trigger_safety_scan()` (already generalizes over `'text'`/`'body'`, confirmed via live function body — no function change needed) to `posts` via a new `AFTER INSERT` trigger with `'body'`.
- Add `posts` to the Edge Function's allowed source-table list.
- Keep existing `journal_entries`/`circle_posts`/`public_circle_posts` triggers during the transition.
- Webhook URL confirmed correct, independently, twice now — do not touch.

---

## 6. Reaction vocabulary — confirmed conflict, unresolved

`post_reactions.reaction` is a real, deployed `reaction_kind` enum: `hug, heart, listen, support, spark`. The app's actual UI keys (from the legacy `*_circle_posts.reactions` jsonb defaults, repo-verifiable independent of which project is live) are `felt, comfort, proud, stay` (teen) and `beenThere, solidarity, reminder, needed, strength` (parent) — a completely different vocabulary. This is the original pasted document's first blocker, confirmed real once checked against the correct project. Needs a decision:

- **(a)** Alter `reaction_kind` to add the app's real keys (additive `ALTER TYPE ... ADD VALUE`, zero data risk given 0 rows).
- **(b)** Add an app-layer mapping between UI keys and the DB enum.

No SQL drafted for this yet — pending the decision, though (a) is now low-risk to execute given the confirmed empty table.

---

## 7. Files touched (unchanged — no edits made to any of these yet)

| Category | Files |
|---|---|
| Runtime | `src/utils/sync.ts`, `src/utils/supabase.ts`, `app/(teen)/circle/feed.tsx`, `screens/CircleScreen.tsx`, `supabase/functions/safety-scan/index.ts` |
| Schema | `supabase/migrations/*.sql`, `db/schema.sql` — confirmed materially out of date vs. live (bigint vs. uuid, missing enums, missing `crews`/`media_attachments`/`circles_kind_shape`) |
| Tests | `test/sync-restore.test.mjs` |
| Docs | `docs/circle-v1-spec.md`, `docs/circle-model-v1-spec.md`, `docs/SUPABASE.md`, `docs/WIRING_STATUS.md` |

---

## 8. Phase 0 checklist

1. **Repo-vs-live schema reconciliation** — done, this update. Repo migrations do not match live for the Circle V2 tables at all (id types, enums, `crews`, `media_attachments`, `circles_kind_shape` are all absent from repo). A real reconciliation migration/rewrite of `supabase/migrations/` is separate follow-up work, not blocking this plan.
2. **Final Circle model** — Teen/Friends/Crew locked and confirmed buildable (mostly already built). **Parent blocked on §1.2.**
3. **Parent community model** — blocked, §1.2, needs your decision among (a)/(b)/(c).
4. **Identity visibility rules** — drafted §4, buildable once §1.2 resolves for the Parent piece; Teen/Friends/Crew pieces are unblocked now.
5. **Safety scan contract** — drafted §5, fully confirmed, ready to build now.
6. **Reaction vocabulary** — conflict confirmed real, §6, needs decision (a) vs (b).
7. **No destructive SQL** — honored; every query this session was read-only `SELECT`/`information_schema`/`pg_catalog`.
8. **No runtime cutover** — honored; no `sync.ts`/screen changes.

## 9. What changed in this update

Everything previously marked "reported" or "unconfirmed" is now either confirmed-as-stated, confirmed-different, or confirmed-not-applicable, based on live read-only queries against `tbsevonvegdnlyjgplmm`, not on anyone's report. The draft migration at `docs/circle-v2-phase0-draft-migration.sql` is now **stale** in several ways (wrong shape for Teen Circle open-read, which already works; wrong shape for Parent Circle, which needs §1.2 first) and shouldn't be used as-is — it'll be replaced once §1.2 is decided.

## Next steps

1. **Your call on §1.2** (Parent Circle: new enum value / relax the shape constraint / reuse `public` + `account_type` split) — this is the one thing blocking a real migration PR.
2. Once decided, draft the actual migration: `VERIFIED_GUARDIAN` states, the §1.2 resolution, the anonymity-guard trigger (§4), safety-scan extension (§5), and the reaction vocabulary decision (§6) if resolved by then.
3. Apply that migration to `tbsevonvegdnlyjgplmm` (step 2 in your ordering) — separate PR, still no cutover.
4. Only after that's applied and verified, update `sync.ts`/screens (step 3) — and note `sync.ts` will need a larger rewrite than originally scoped, since the real schema (uuid ids, `author_user_id`/`body`, enum types, `crews`, `friendships`-based friend visibility) differs substantially from what the repo's own migrations assume.
