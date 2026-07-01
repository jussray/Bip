# Circle V1 → V2 Migration Plan

Status: **draft, verified against live DB** (jussray's Project, `jvmbhralyktmdlvglrxk`) and repo state as of 2026-07-01. Supersedes any earlier informal migration notes. Not yet started — Phase 1 is not complete.

This plan replaces five per-audience Circle tables with a unified `circles` / `posts` / `circle_members` / `post_reactions` / `post_comments` model. It corrects several factual errors in the prior draft of this plan and adds two blockers the prior draft missed entirely (§0.1, §0.2). Read §0 before doing anything else — it changes the shape of the resolver design in §3.

---

## 0. Corrections and new findings vs. the prior draft

### 0.1 BLOCKER (new) — Public/Friends/Crew reads cannot work under current RLS

`circles` is a **per-owner-per-kind** table: `unique (owner_user_id, kind)`, comment in migration: *"Each user has up to 3 circles (public/friends/crew)"* (`supabase/migrations/0004_supplemental_tables.sql:91`). There is no single shared "global public circle" row — every teen who has ever posted gets their own `circles` row per kind.

Read access is membership-gated, full stop:

```sql
-- supabase/migrations/0004_supplemental_tables.sql:130-135
create policy "posts_members_read" on public.posts
  for select using (
    is_deleted = false
    and circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
  );

-- same pattern on circles_members_read, :105-109
```

Nobody is auto-enrolled as a member of anyone else's `public`-kind circle. So even after `writeCirclePost` is rewritten to insert into `posts`, **the public feed query will return zero rows for every user except the author**, because `posts_members_read` filters to circles you're explicitly a `circle_members` row for. The prior draft's `resolveCircle()` and feed query (§3A/§3C below) both assumed a single global circle with open reads — that assumption doesn't match the schema that's actually deployed.

Fix required before cutover — add kind-scoped public policies that don't depend on membership:

```sql
drop policy if exists "circles_public_read" on public.circles;
create policy "circles_public_read" on public.circles
  for select using (kind = 'public');

drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts
  for select using (is_deleted = false and circle_id in (
    select id from public.circles where kind = 'public'
  ));
```

`friends` and `crew` keep the existing membership-gated policies — those are correct as-is, since friends/crew access genuinely is membership-based. `circle_members` rows for friends/crew need to be populated from `circle_friendships`/`circle_friend_requests` (friends) and `crew_members`/`crew_memberships` (crew) — see §0.4.

### 0.2 BLOCKER (new, unrelated to this migration but touches the same trigger) — safety-scan trigger may be posting to the wrong project

Confirmed via `pg_get_functiondef` against the live database — the deployed `trigger_safety_scan()` function has this hardcoded:

```sql
url := 'https://tbsevonvegdnlyjgplmm.supabase.co/functions/v1/safety-scan'
```

This project's actual API URL is `https://jvmbhralyktmdlvglrxk.supabase.co` (confirmed via `get_project_url`). Unless `tbsevonvegdnlyjgplmm` is a live alias that still happens to route correctly, **every `circle_posts` and `public_circle_posts` insert today is firing a moderation webhook at a project that isn't this one** — meaning the crisis-detection path may be silently dead right now, independent of anything in this plan. This should be confirmed and fixed on its own track before or alongside Phase 1, since it's a safety-critical path, not a nice-to-have.

Action: confirm which project `tbsevonvegdnlyjgplmm` is (old/dev project?). If wrong, `CREATE OR REPLACE FUNCTION public.trigger_safety_scan()` with the correct URL, re-deploy the `safety-scan` edge function to this project if it isn't already there, and re-verify with a test insert.

### 0.3 Corrected facts (prior draft got these wrong or unverified)

| Claim in prior draft | Reality (verified) |
|---|---|
| "post_comments column mismatch — live DB uses `author_user_id`/`body`, repo migration uses `user_id`/`text`" | Backwards. Live DB **and** repo migration both use `user_id`/`text` (`0004_supplemental_tables.sql:158-164`). There is no `author_user_id`/`body` variant anywhere — the migration even has a defensive `do $$ ... $$` block (`:168-191`) that picks whichever column exists, but only `user_id` has ever existed live. Nothing to reconcile here; just write to `user_id`/`text`. |
| "Reconcile UUID vs bigint IDs across tables" | All of `circles`, `posts`, `circle_members`, `post_reactions`, `post_comments`, and every legacy `*_circle_posts` table use `bigint`/`bigserial` IDs. Only `parent_links` uses `uuid`. There's no UUID/bigint split to reconcile within the Circle tables themselves. |
| "LIVE DB ENUM (CURRENT): hug / heart / listen / support / spark" | No such constraint or data exists. `circle_reactions.emoji` and `post_reactions.reaction` are both unconstrained `text` columns, and both tables are currently empty. There's nothing to "alter" — pick the app's real key set (`felt/comfort/proud/stay` for teen, `beenThere/solidarity/reminder/needed/strength` for parent, both of which already match the legacy tables' `reactions` jsonb defaults) and enforce it at the app layer or with a `CHECK` constraint added fresh. §3D below is simplified accordingly — there is no Option A vs B, just "add the CHECK constraint now, no data migration needed." |
| "circle_kind enum" | Not a Postgres `enum` type — it's a `text` + `CHECK (kind = ANY (...))` constraint on `circles.kind`, currently `('public','friends','crew')`. `'parent'` is genuinely absent — confirmed, this blocker is real (see §3A). |
| Table registry: "old and new keys exist simultaneously, nothing calls the new ones" | Confirmed, but incomplete — `src/utils/supabase.ts` registers **34 tables total**, including `circleProfiles`, `circleFriendships`, `crewMemberships` that weren't mentioned in the prior draft at all and that this plan needs to account for (§0.4). |

### 0.4 New scope the prior draft didn't know about

Live schema query turned up 11 tables that are **referenced in migration comments/ALTERs but have no `CREATE TABLE` anywhere in `supabase/migrations/`** — they exist only because someone ran DDL directly against the live project:

`public_circle_posts`, `friends_circle_posts`, `crew_circle_posts`, `circle_reactions`, `circle_profiles`, `circle_friendships`, `circle_friend_requests`, `circle_comments`, `blocked_users`, `reported_posts`, `crew_memberships`.

Several placeholder migration files even say this outright, e.g. `supabase/migrations/20260616224106_0002_circle_v1.sql`: *"Migration already applied remotely. Compatibility placeholder to align local and remote migration history."* This means **a fresh `supabase db reset` or new environment built from repo migrations today would not have these 11 tables**, and the app would break immediately on first Circle read/write. This is a bigger and more concrete version of the prior draft's "Reconcile repo vs live schema" blocker — Phase 1 needs to write `CREATE TABLE IF NOT EXISTS` migrations for all 11 tables that back-fill the actual live shape (use `mcp__Supabase__list_tables(verbose=true)` or the column dump in this doc's appendix to get exact columns), not just "reconcile."

Also newly discovered and requiring a decision before Phase 1 closes:

- **`crew_members` vs `crew_memberships` — two different, overlapping tables.** `crew_members` (defined in `0001_init.sql`) has `connection_status CHECK IN ('pending','accepted','blocked','removed')` and `cadence`, and backs the existing accountability check-in feature (`crew_check_ins`). `crew_memberships` (live-only, undocumented) has a plain `unique(user_id, member_id)` shape. Before wiring "Crew" as a `circles.kind`, decide which of these two tables is the source of truth for "who's in my crew" — `circle_members` rows for crew-kind circles should be derived from exactly one of them, not both.
- **`blocked_users` already exists live** (`unique(user_id, blocked_id)`, FKs to `auth.users`), which resolves part of blocker #12 in the prior draft — the table doesn't need to be created. But **no RLS policy on `posts`, `circle_members`, `post_reactions`, or `post_comments` currently references it**, so blocking is not enforced at the database level yet. That's still open work.
- **`circle_friendships`/`circle_friend_requests`/`circle_comments`/`circle_replies`/`circle_profiles`** exist live and are registered in `TABLES` but appear to be a parallel, never-fully-wired feature attempt (friend requests + threaded replies + profile handles) distinct from both the V1 per-tab tables and the V2 unified model. Needs a scoping decision: fold into V2 (`circle_members` role, `post_comments`) or explicitly deprecate. Don't silently ignore — it's real schema someone built.

---

## 1. Files that read or write Circle tables

| Category | Files | Status |
|---|---|---|
| Runtime behavior | `src/utils/sync.ts`, `src/utils/supabase.ts`, `app/(teen)/circle/feed.tsx`, `screens/CircleScreen.tsx`, `supabase/functions/safety-scan/index.ts` | Must change |
| Fresh DB setup | `supabase/migrations/*.sql`, `db/schema.sql` | Must change (§0.4 — not just "reconcile", 11 tables are missing entirely) |
| Tests | `test/sync-restore.test.mjs` | Update in Phase 6 |
| Docs | `docs/circle-v1-spec.md`, `docs/circle-model-v1-spec.md`, `docs/SUPABASE.md`, `docs/WIRING_STATUS.md` | Phase 6 — mark V1 docs deprecated, point at this file |
| Consent/Privacy | `src/features/consent/consentLayer.ts` | Confirmed out of scope — only handles `journal_entries`/`mood_history`, no Circle references. No changes needed. |

`src/utils/supabase.ts` `TABLES` registry (`:34-79`) currently has 34 entries. Legacy Circle keys still in exclusive use by runtime:

```ts
circlePosts:        'circle_posts',
parentCirclePosts:  'parent_circle_posts',
publicCirclePosts:  'public_circle_posts',
friendsCirclePosts: 'friends_circle_posts',
crewCirclePosts:    'crew_circle_posts',
circleReactions:    'circle_reactions',
circleProfiles:     'circle_profiles',      // not in prior draft
circleFriendships:  'circle_friendships',   // not in prior draft
```

New keys already registered but unused by any screen: `circles`, `posts`, `circleMembers`, `postReactions`, `postComments`.

### `src/utils/sync.ts` — functions to rewrite (keep public API identical)

| Function | Currently writes/reads | Must write/read |
|---|---|---|
| `syncCirclePost()` | `circle_posts` | `posts` |
| `syncParentCirclePost()` | `parent_circle_posts` | `posts` (kind='parent', once §3A is resolved) |
| `loadParentCircleFeed()` | `parent_circle_posts` | `posts` joined to `circles` where `kind='parent'` |
| `loadCircleFeed(tab)` | 4 separate tables (`publicCirclePosts`, `friendsCirclePosts`, `crewCirclePosts` share one branch, `parentCirclePosts`) — also reads `circleProfiles` for friends/crew display names | `posts` joined via `circles!inner(kind)`, still need a display-name source for friends/crew (was `circleProfiles` — confirm that's still the source, or migrate to a `profiles` table if one exists) |
| `syncCircleReaction()` | `circle_reactions` | `post_reactions` |
| `writeCirclePost()` | table map to 4 V1 tables | `posts` via `resolveCircle()` |
| `pullAll()` | `circle_posts`, `parent_circle_posts` | authored posts via permitted circles |

`app/(teen)/circle/feed.tsx` only renders the **public** tab (`loadCircleFeed('public', 40)`, `writeCirclePost('public', ...)`, `syncCircleReaction(postId, key)`) and merges results into local `circlePosts` AppContext state. The 4-tab UI (public/friends/crew/parent) lives in `screens/CircleScreen.tsx`, which is the actual duplicate-UI surface — both call the same `sync.ts` functions, so rewriting `sync.ts` internals should make both correct without UI changes, but test both screens in Phase 6, not just one.

`supabase/functions/safety-scan/index.ts` allowlist (`:34-38, 275-280`) is hardcoded to `['journal_entries', 'circle_posts', 'public_circle_posts', 's2tell_entries']` — `posts` is absent. Do not cut over Circle writes to `posts` until this is fixed (§5), independent of the URL bug in §0.2.

---

## 2. Current data flow

```
PUBLIC   feed.tsx        → writeCirclePost('public')  → public_circle_posts
FRIENDS  CircleScreen     → writeCirclePost('friends')  → friends_circle_posts
CREW     CircleScreen     → writeCirclePost('crew')     → crew_circle_posts
PARENT   CircleScreen     → writeCirclePost('parent')   → parent_circle_posts
REACTIONS syncCircleReaction() → circle_reactions
RESTORE  pullAll()        → circle_posts, parent_circle_posts

TARGET   writeCirclePost(kind) → resolveCircle(kind) → posts
```

---

## 3A. Circle resolver — corrected for the per-owner circle model

Public API is unchanged: screens still call `loadCircleFeed(tab)`, `writeCirclePost(tab, ...)`, `syncCircleReaction(postId, tab, reaction)`. Internal implementation changes.

Given circles are per-owner-per-kind (§0.1), the resolver for **writing** is "get or create my own circle of this kind" — not "look up a shared circle." Reading is a separate, unfiltered-by-owner query (§3C), which is fine as designed as long as §0.1's RLS fix ships first.

```ts
// src/utils/sync.ts — new internal helper
type CircleKind = 'public' | 'friends' | 'crew' | 'parent';

async function resolveOwnCircle(
  kind: CircleKind,
  userId: string,
): Promise<{ id: string; kind: CircleKind } | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // circles has UNIQUE(owner_user_id, kind) — safe to upsert idempotently.
  const { data, error } = await sb
    .from(TABLES.circles)
    .upsert(
      { owner_user_id: userId, kind },
      { onConflict: 'owner_user_id,kind', ignoreDuplicates: true },
    )
    .select('id, kind')
    .single();

  if (error) {
    console.warn('[circle] resolveOwnCircle failed:', error.message);
    return null;
  }
  return data;
}
```

There is no `crew_id` column on `circles` — the prior draft's resolver queried `circles.crew_id`, which doesn't exist in this schema (`circles` columns are only `id, owner_user_id, kind, name, created_at`). "Which crew" isn't a property of the circle row; it's determined by who has an accepted `circle_members` row for *your* crew-kind circle, sourced from §0.4's crew table decision.

**Blocker before this ships:** `circles_kind_check` CHECK constraint doesn't allow `'parent'` yet:

```sql
alter table public.circles drop constraint circles_kind_check;
alter table public.circles add constraint circles_kind_check
  check (kind = any (array['public','friends','crew','parent']));
```

And Parent Circle needs its own access model decided — a guardian's `owner_user_id` would be the *parent's* auth uid, but readers are the linked teen(s) via `parent_links`, not via `circle_members` in the usual sense. Decide: does every parent get their own `parent`-kind circle (symmetric with public/friends/crew), or is Parent Circle actually a single shared space gated entirely by `parent_links.status = 'active'` with no `circles` row at all? This needs an explicit decision before §3A's `parent` branch is implemented — don't default into whichever is easier to code.

## 3B. Post creation

```ts
export async function writeCirclePost(
  kind: CircleKind,
  text: string,
  opts: {
    postMood?: string;
    contentWarning?: string;
    revealIdentity?: boolean;
  } = {},
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = await currentUserId();
  if (!uid) return;

  const circle = await resolveOwnCircle(kind, uid);
  if (!circle) return;

  const isPublic = kind === 'public';
  const { error } = await sb.from(TABLES.posts).insert({
    author_user_id: uid,
    circle_id: circle.id,
    body: text,
    mood_tag: opts.postMood ?? null,
    content_warning: opts.contentWarning ?? null,
    is_identity_revealed: isPublic ? false : Boolean(opts.revealIdentity),
    is_deleted: false,
  });
  if (error) {
    console.warn('[circle] writeCirclePost failed:', error.message);
  }
}
```

Don't trust the UI to enforce anonymity — add a DB-level trigger/check rejecting `circles.kind = 'public' AND posts.is_identity_revealed = true`. `posts` currently has no such constraint; this needs a new migration.

Note: `opts.crewId` from the prior draft is dropped — there's no per-write crew selection, since crew membership is resolved from the owner's single crew-kind circle, not passed in per-post.

## 3C. Feed loading — blocked on §0.1

```ts
const { data: posts, error } = await sb
  .from(TABLES.posts)
  .select(`
    id,
    author_user_id,
    circle_id,
    body,
    mood_tag,
    content_warning,
    is_identity_revealed,
    created_at,
    circles!inner(kind)
  `)
  .eq('circles.kind', kind)
  .eq('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(limit);
```

This query is correct as written, but **will silently return an empty array for every kind until the RLS policies in §0.1 are added** — `circles!inner(kind)` still goes through `circles`' own RLS, and `posts`' RLS, both of which are membership-gated today. Test this against a live (non-service-role) client before considering Phase 3/4 done — an empty result set will look like "it works, no data yet" rather than "RLS is blocking everything," so verify with two distinct real user accounts, not just the author's own session.

For public posts, strip identity fields client-side before display:

```ts
{ id, text: body, post_mood: mood_tag, reactions, created_at }
// no author_user_id, no name, no avatar
```

Friends/crew: resolve display name/avatar from whichever table §0.4 designates as source of truth (was `circleProfiles` — confirm it's still current, or if `circle_friendships`/`circle_profiles` are actually dead code to be dropped instead).

Parent Circle: separate query, guardian accounts only — depends on the §3A parent-circle decision.

## 3D. Reactions — simplified, no enum reconciliation needed

Prior draft assumed a live DB enum mismatch that doesn't exist (§0.3) — `post_reactions.reaction` is unconstrained `text`, table is empty. No data migration, no Option A/B. Just add the CHECK now and write the real app keys directly:

```sql
alter table public.post_reactions add constraint post_reactions_reaction_check
  check (reaction = any (array['felt','comfort','proud','stay','beenThere','solidarity','reminder','needed','strength']));
```

(Splitting into two constraints — one for teen kinds, one for `parent` — is possible with a `CHECK` that branches on a joined `circles.kind`, but Postgres `CHECK` can't reference other tables. Enforce the teen-vs-parent split at the app layer, same as the prior draft's `allowed` array; the DB constraint above is just a floor against garbage values.)

```ts
export async function syncCircleReaction(
  postId: string | number,
  kind: CircleKind,
  reaction: string,
): Promise<void> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return;

  const allowed =
    kind === 'parent'
      ? ['beenThere', 'solidarity', 'reminder', 'needed', 'strength']
      : ['felt', 'comfort', 'proud', 'stay'];
  if (!allowed.includes(reaction)) return;

  const { error } = await sb.from(TABLES.postReactions).upsert(
    { post_id: postId, user_id: uid, reaction },
    { onConflict: 'post_id,user_id,reaction', ignoreDuplicates: true },
  );
  if (error) console.warn('[circle] reaction failed:', error.message);
}
```

`post_reactions_post_id_user_id_reaction_key` unique constraint already exists live (`0004_supplemental_tables.sql:146`) — the upsert's `onConflict` target is already correct, no schema change needed there.

## 3E. Comments & media

`post_comments` uses `user_id`/`text` — confirmed live and in migration, no `author_user_id`/`body` variant exists (§0.3). Nothing to reconcile.

Media: legacy tables store a bare `media_kind` string. No `media_attachments` table exists yet in repo migrations or live schema — this is genuinely new work, not a drift issue. Confirm the field list before building (`owner_user_id`, `post_id`, `bucket`, `object_path`, `media_type`, `mime_type`, `dimensions`, `alt_text`) against `supabase/storage.sql`'s existing bucket conventions, since that file already defines storage policies that a new table should be consistent with.

## 3F. Rename legacy keys in TABLES

```ts
// src/utils/supabase.ts — rename during migration, remove after cutover
legacyCirclePosts:        'circle_posts',
legacyParentCirclePosts:  'parent_circle_posts',
legacyPublicCirclePosts:  'public_circle_posts',
legacyFriendsCirclePosts: 'friends_circle_posts',
legacyCrewCirclePosts:    'crew_circle_posts',
legacyCircleReactions:    'circle_reactions',
```

Also flag (don't necessarily rename yet — needs the §0.4 scoping decision first): `circleProfiles`, `circleFriendships`, `crewMemberships`.

---

## 4. Database blockers before cutover

1. **New** — `posts_public_read`/`circles_public_read` RLS policies missing; public feed returns nothing under current membership-gated policies (§0.1).
2. **New** — verify `trigger_safety_scan()`'s hardcoded webhook URL actually points at this project (§0.2). Independent of this migration but shares the trigger this plan needs to extend.
3. Safety scanner allowlist doesn't include `posts` (§5) — real, confirmed.
4. 11 tables exist live with no `CREATE TABLE` in repo migrations (§0.4) — a fresh deploy is missing them entirely. Not "reconcile," write the actual migrations.
5. `circles_kind_check` doesn't allow `'parent'` — confirmed real, alter needed (§3A).
6. Parent Circle and Public Circle need an explicit ownership/access model decided — Public is resolved by §0.1 (per-owner circle + open-read policy), Parent Circle is still an open decision (§3A).
7. `circle_members` needs to be populated from real membership sources for friends/crew — decide `crew_members` vs `crew_memberships` (§0.4) as source of truth, confirm friends source (`circle_friendships`/`circle_friend_requests`).
8. `blocked_users` table already exists (not a blocker to create) but isn't referenced by any RLS policy yet — add blocking checks to `posts`/`post_reactions`/`post_comments` policies.
9. Reaction values: add the CHECK constraint in §3D — low effort, no data to migrate.
10. Decide fate of `circle_profiles`/`circle_friendships`/`circle_friend_requests`/`circle_comments`/`circle_replies` — fold into V2 or explicitly deprecate (§0.4), don't leave them ambiguous.
11. Public-identity-revelation trigger/constraint on `posts` (§3B) — doesn't exist yet, needs a fresh migration.
12. Confirm `moods` reference table (already exists, `0004_supplemental_tables.sql:198-211`) is actually the mood taxonomy `mood_tag` should validate against, or if it's unrelated/unused.

---

## 5. Safety-scan migration — do this first, and check §0.2 while you're in this code

1. Confirm/fix the webhook URL in `trigger_safety_scan()` (§0.2) — do this regardless of the rest of the plan, it may be a live bug today.
2. Add `posts` to the Edge Function's `SourceTable` allowlist (`supabase/functions/safety-scan/index.ts:34-38, 275-280`).
3. Add `safety_flagged boolean not null default false` to `posts` — it doesn't have this column today (confirmed via live schema; only `journal_entries`, `circle_posts`, `public_circle_posts` have it).
4. Attach the trigger — the function already generalizes over column name (`TG_ARGV[0]`, supports `'text'` or `'body'`), so this is a one-line addition, not new trigger logic:
   ```sql
   drop trigger if exists safety_scan_posts on public.posts;
   create trigger safety_scan_posts
     after insert on public.posts
     for each row execute function public.trigger_safety_scan('body');
   ```
5. Decide: `safety_flagged` on `posts` directly (consistent with existing pattern) vs. a separate moderation table — recommend staying consistent with the existing pattern from #3 unless there's a reason to diverge.
6. Update `safety_alerts.source_table`/`source_post_id` references to work with `posts` rows.
7. Verify high-severity parent notification still respects `parent_links.status = 'active'`.

---

## 6. Non-destructive migration phases

Same 8-phase shape as before, with Phase 1 scope corrected:

| Phase | Status | Scope |
|---|---|---|
| 1. Schema stabilization | Blocked | Write the 11 missing `CREATE TABLE` migrations (§0.4), add `posts_public_read`/`circles_public_read` RLS (§0.1), add `parent` to `circles_kind_check`, resolve §0.2, update safety scanner (§5) |
| 2. Backfill posts | Not started | Copy V1 table rows → `posts` with `legacy_circle_post_map` tracking (bigint IDs on both sides — simpler than the prior draft's UUID-vs-bigint worry, no type cast needed) |
| 3. Reactions & comments | Not started | Copy `circle_reactions` → `post_reactions` (both are just `text` today, no enum mapping required per §0.3) |
| 4. Dual-read verify | Not started | Write new, read new, compare counts — **use two distinct real user sessions, not just the author's**, since §0.1's RLS gap would otherwise pass silently |
| 5. Switch account restore | Not started | Replace `pullAll()` to read authored posts via permitted circles |
| 6. Tests & docs | Not started | Update `test/sync-restore.test.mjs`, mark `docs/circle-v1-spec.md`/`docs/circle-model-v1-spec.md` deprecated, update `docs/SUPABASE.md`/`docs/WIRING_STATUS.md` |
| 7. Deprecation period | Not started | Old tables read-only, `DEPRECATED` comments, revoke insert |
| 8. Destructive cleanup | Not started | Only after prod cutover + rollback window |

Backfill tracking table (bigint IDs, not UUID — corrected from prior draft):

```sql
create table legacy_circle_post_map (
  legacy_table  text,
  legacy_id     bigint,
  new_post_id   bigint,
  migrated_at   timestamptz
);
```

Deprecation comment pattern (Phase 7):

```sql
comment on table public.public_circle_posts is
  'DEPRECATED: migrated to public.posts; do not write new rows';
```

---

## 7. Circle separation rules

| Circle | kind | Account type | Identity | Access rule |
|---|---|---|---|---|
| Public Teen | `public` | Teen only | Always anonymous | `posts_public_read`/`circles_public_read` (§0.1) — open to any authenticated teen, not membership-gated |
| Friends | `friends` | Teen | Safe nickname/avatar allowed | Active `circle_members` only, sourced from friends table decided in §0.4; blocked users excluded once §4.8 ships |
| Crew | `crew` | Teen | Safe nickname/avatar allowed | Active `circle_members` sourced from whichever of `crew_members`/`crew_memberships` is chosen (§0.4); pending/blocked/removed excluded |
| Parent | `parent` | Guardian only | Guardian-appropriate | Access model still undecided (§3A) — never appears in teen queries regardless of final design; Bridge link (`parent_links`) ≠ automatic Circle access |

Test matrix (Phase 6), extended with the new blockers:

- Teen Public cannot reveal identity
- **Two distinct teen accounts can both see each other's public posts** (this is the test that would have caught §0.1)
- Teen cannot read Parent Circle
- Parent cannot read teen Friends/Crew circles
- Non-members cannot read Friends/Crew
- Blocked users cannot interact (needs §4.8 policy work first)
- Public posts are safety-scanned (needs §0.2 confirmed fixed + §5 done)
- Deleted posts do not appear
- Parent Bridge shares (`parent_links`) do not become Circle posts
- A fresh `supabase db reset` from repo migrations alone produces a working Circle feature, with no manually-applied drift required (this is the test that would have caught §0.4)

---

## Safest first PR scope

1. Confirm/fix §0.2 (safety-scan URL) — can ship independently, today, before anything else here.
2. Write the 11 missing `CREATE TABLE IF NOT EXISTS` migrations for live-only tables (§0.4), so `supabase/migrations/` matches live reality. No behavior change, pure reconciliation.
3. Add `posts_public_read`/`circles_public_read` RLS policies (§0.1).
4. Add `parent` to `circles_kind_check`, decide and implement the Parent Circle access model (§3A).
5. Add public-identity-revelation constraint on `posts` (§3B).
6. Add `posts` to safety-scan allowlist + attach trigger (§5).
7. Add reaction `CHECK` constraint (§3D) — no data migration needed.
8. Rewrite `sync.ts` internals — public API unchanged.
9. Rename legacy `TABLES` keys to `legacy*`.

All legacy tables remain untouched and readable. Backfill and cutover are separate PRs after Phase 4 verification — and that verification must use two real distinct user sessions, not just the author's own, or it will pass despite §0.1 being broken.
