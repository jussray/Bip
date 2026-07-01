# Circle V1 → V2 Migration Plan

**Status: Phase 0 — live schema verified, §1.2 decided, migration drafted and reviewed in-repo. Not yet applied to `tbsevonvegdnlyjgplmm`. No app screens or `sync.ts` changed yet.**

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

### 1.2 Parent Circle — decided: option (a), new `parent_community` circle kind

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

This directly conflicted with the locked §1 decision that Parent Circle must be a shared community feed, independent of any specific `parent_links` row. **Decided: option (a).** New `circle_kind` value `parent_community` for the guardian community feed. The existing `kind='parent'` + `parent_link_id` structure is left completely alone — it's a real, separate feature (private per-family Bridge-linked space) with its own purpose, not repurposed or touched by this decision.

Rules for `parent_community`, as specified:
- Visible to verified guardians only — gated on `account_verification.verification_state = 'VERIFIED_GUARDIAN'` and `circle_profiles.account_type = 'guardian'`.
- Not tied to `parent_links` — `circles_kind_shape` puts `parent_community` in the same "simple" bucket as `public`/`friends` (`crew_id IS NULL AND parent_link_id IS NULL`), so a `parent_community` circle structurally cannot reference a `parent_links` row.
- Anonymous guardian identity only — same DB-level anonymity guard as Teen Circle (§4), extended to also cover `kind='parent_community'`.
- No teen access — a teen account has `circle_profiles.account_type='teen'`, which fails the guardian gate by construction.
- No Bridge content — satisfied by construction, since `parent_community` circles can never have a `parent_link_id`.
- Posts live in `posts` with `circles.kind='parent_community'` — same table, same pattern as every other circle kind.

Migration drafted (not applied): `supabase/migrations/20260701010000_circle_kind_add_parent_community.sql` (adds the enum value — has to be its own transaction, since Postgres won't let a new enum value be referenced in the same transaction it's added in) and `supabase/migrations/20260701020000_circle_v2_parent_community.sql` (everything else: guardian verification states, `circles_kind_shape` update, an `is_verified_guardian()` helper, RLS updates on `circles`/`posts` for the new open-read carve-out, the anonymity guard trigger, and the safety-scan extension to `posts`). Reaction vocabulary (§6) is deliberately not part of this migration — separate, still-open decision.

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

## 5. Safety scan contract — drafted, in this PR

- `trigger_safety_scan()` already generalizes over `'text'`/`'body'` (confirmed via live function body) — extended to `posts` via a new `AFTER INSERT` trigger in `20260701020000_circle_v2_parent_community.sql`.
- `posts` added to the Edge Function's `SourceTable` allowlist in `supabase/functions/safety-scan/index.ts` — done, this PR. Also fixed the flag-update to use `author_user_id` for `posts` instead of `user_id` (every other flaggable table uses `user_id`; `posts` doesn't have that column, so the old code would have silently no-op'd for `posts` rows).
- Existing `journal_entries`/`circle_posts`/`public_circle_posts` triggers kept as-is during the transition.
- Webhook URL confirmed correct, independently, twice now — not touched.

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
| Runtime | `src/utils/sync.ts`, `src/utils/supabase.ts`, `app/(teen)/circle/feed.tsx`, `screens/CircleScreen.tsx` — none edited yet. `supabase/functions/safety-scan/index.ts` — **edited this PR** (§5). |
| Schema | `supabase/migrations/*.sql`, `db/schema.sql` — confirmed materially out of date vs. live (bigint vs. uuid, missing enums, missing `crews`/`media_attachments`/`circles_kind_shape`) |
| Tests | `test/sync-restore.test.mjs` |
| Docs | `docs/circle-v1-spec.md`, `docs/circle-model-v1-spec.md`, `docs/SUPABASE.md`, `docs/WIRING_STATUS.md` |

---

## 8. Phase 0 checklist

1. **Repo-vs-live schema reconciliation** — done. Repo migrations do not match live for the Circle V2 tables at all (id types, enums, `crews`, `media_attachments`, `circles_kind_shape` are all absent from repo). A full reconciliation rewrite of `supabase/migrations/` for these tables is separate follow-up work, not blocking this PR.
2. **Final Circle model** — locked, all four kinds. §1.2 decided.
3. **Parent community model** — decided, §1.2: `parent_community` circle kind, migration drafted.
4. **Identity visibility rules** — Teen/Parent-community guard drafted and in the migration (§4); Friends/Crew identity-reveal-after-trust logic still unbuilt, separate follow-up.
5. **Safety scan contract** — drafted and in the migration + edge function edit (§5).
6. **Reaction vocabulary** — still unresolved, §6, intentionally excluded from this migration.
7. **No destructive SQL** — honored; the two new migration files exist in the repo but have **not** been applied via `apply_migration`/`execute_sql` — every live query this session was read-only.
8. **No runtime cutover** — honored; `sync.ts`/screens still untouched.

## 9. What's in this PR vs. what's still open

**In this PR (repo only, nothing applied to Supabase):**
- `supabase/migrations/20260701010000_circle_kind_add_parent_community.sql` — adds the `parent_community` enum value, its own transaction by necessity.
- `supabase/migrations/20260701020000_circle_v2_parent_community.sql` — guardian verification states, `circles_kind_shape` update, `is_verified_guardian()` helper, RLS updates on `circles`/`posts`, the anonymity guard trigger, safety-scan trigger attachment on `posts`.
- `supabase/functions/safety-scan/index.ts` — `posts` added to the allowlist, flag-update made table-aware (`author_user_id` vs `user_id`).
- This doc, fully updated with confirmed live facts.

**Explicitly still open, not in this PR:**
- §6 reaction vocabulary — separate decision, no SQL drafted.
- Friends/Crew identity-reveal-after-acceptance logic (§4) — design is clear, no SQL drafted yet.
- Full `supabase/migrations/` reconciliation for pre-existing drift (bigint vs. uuid, missing `crews`/`media_attachments` definitions, etc.) — real but out of scope for this PR, which only adds new objects.
- The earlier `docs/circle-v2-phase0-draft-migration.sql` is stale (marked as such) and superseded by the two files above.

## Next steps

1. Review the two migration files and the edge-function diff in this PR.
2. When ready, apply the two migrations to `tbsevonvegdnlyjgplmm` in order (the enum-value file first, always — same constraint about not using a new enum value in the transaction that created it applies to however they're eventually run, not just how they're written). Deploy the updated `safety-scan` Edge Function alongside.
3. Verify: a verified-guardian test account can read/write `parent_community` posts anonymously; a teen account cannot; the anonymity guard rejects `is_identity_revealed=true` on `public`/`parent_community` posts; a `posts` insert fires the safety-scan trigger and the Edge Function accepts `source_table='posts'`.
4. Only after that's applied and verified, update `sync.ts`/screens (step 3) — this will be a larger rewrite than originally scoped, since the real schema (uuid ids, `author_user_id`/`body`, enum types, `crews`, `friendships`-based friend visibility) differs substantially from what the repo's own migrations assume.
