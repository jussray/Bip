# RLS Policy Audit — journal_entries, crew_members, parent_circle_posts, planned voice_* tables

Fills in the two audit templates provided against the schema files actually in this
repo: `db/schema.sql` (pasted manually into the Supabase SQL editor per
`docs/SUPABASE.md`) and `supabase/migrations/*.sql` (applied via `supabase db push`).
These are two separate bootstrap paths for the same logical schema, so this audit
checks them for drift, not just RLS coverage.

## Source files checked

| source_file | role |
|---|---|
| `db/schema.sql` | Manual bootstrap — pasted into Supabase SQL editor (`docs/SUPABASE.md` step 2) |
| `supabase/migrations/0001_init.sql` | CLI bootstrap — "mirror of db/schema.sql" per its own header comment |
| `supabase/migrations/0004_supplemental_tables.sql` | CLI follow-up — explicitly patches drift between the two above |
| `supabase/migrations/*.sql` (rest) | CLI follow-ups, additive only |
| `src/utils/supabase.ts` | Only app code that reads/writes `crew_members` |
| `scripts/control-room-rls-scan.mjs` | Existing automated scanner — regex-based, checks `supabase/migrations/` only, does not check `db/schema.sql` |

## Policy map

| table_name | exists_in_schema_sql | exists_in_0001_init | rls_enabled | select_policy | insert_policy | update_policy | delete_policy | notes |
|---|---|---|---|---|---|---|---|---|
| `journal_entries` | yes | yes | yes | owner + linked-parent (`shared_with_parent`, via `20260628_consent_visibility.sql`) | owner | owner | owner | **PK mismatch fixed.** `db/schema.sql` now declares `primary key (user_id, id)`, matching `0001_init.sql`. `supabase/migrations/20260702070000_reconcile_journal_crew_primary_keys.sql` widens any already-live database still on the old single-column `id` PK — safe, since a set unique under `(id)` is trivially unique under `(user_id, id)`. |
| `crew_members` | yes | yes | yes | owner | owner | owner | owner | **Fixed** in `supabase/migrations/20260702060000_crew_members_bip_id.sql` (columns) and `20260702070000_reconcile_journal_crew_primary_keys.sql` (PK shape — same fix and same reasoning as `journal_entries`). |
| `parent_circle_posts` | yes | yes | yes | owner-only in `db/schema.sql`; owner-insert/update/delete + **any-authenticated-read** in migrations (`0004_supplemental_tables.sql`, since parents need to read the shared feed) | owner | owner | owner | **Drift already caught and fixed once:** `db/schema.sql`'s `reactions` default (`beenThere/solidarity/reminder/needed/strength`) diverged from `0001_init.sql`'s default (`felt/comfort/proud/stay`, copy-pasted from `circle_posts`). `0004_supplemental_tables.sql` explicitly patches the migrations-path default to match `db/schema.sql`. Confirms this dual-bootstrap-file setup produces real bugs, not just theoretical ones — it already did once. **PK mismatch also fixed** — see finding 2. |
| `mood_history` / `circle_posts` / `voice_notes` / `comfort_sessions` | yes | yes | yes | owner | owner | owner | owner | Not otherwise re-audited row-by-row here (out of this pass's scope beyond PK shape) — **PK mismatch fixed**, see finding 2. |
| `voice_sessions` | no | no | n/a | n/a | n/a | n/a | n/a | Not yet defined anywhere — see `docs/AGENT_L4_ARCHITECTURE.md` and the reviewed voice-WS draft. If built, needs RLS scoped to `auth.uid() = user_id` in both `db/schema.sql` and a real migration, not just one. |
| `voice_turns` | no | no | n/a | n/a | n/a | n/a | n/a | Same as above — planned only. |
| `voice_events` | no | no | n/a | n/a | n/a | n/a | n/a | Same as above — planned only. |
| `voice_latency_metrics` | no | no | n/a | n/a | n/a | n/a | n/a | Same as above — planned only. |

## Findings, ranked

1. **`crew_members.bip_id` / `connection_status` were missing from the migrations
   path — fixed.** `db/schema.sql` (line ~160) added them with
   `alter table ... add column if not exists ... connection_status text not null
   default 'pending' check (...)`, but no file under `supabase/migrations/` did
   the same, even though `src/utils/supabase.ts` depends on `connection_status`.
   Added `supabase/migrations/20260702060000_crew_members_bip_id.sql`, mirroring
   `db/schema.sql`'s block exactly. Verified with
   `node scripts/control-room-rls-scan.mjs` (0 findings, unaffected since this
   was a column-drift issue, not an RLS-coverage issue).

2. **Two schema-defining files exist with no single source of truth.**
   `docs/SUPABASE.md` tells operators to paste `db/schema.sql` directly. Separately,
   `supabase/migrations/0001_init.sql` calls itself "a mirror of db/schema.sql" but
   had already diverged on `parent_circle_posts` defaults (caught, fixed in
   `0004_supplemental_tables.sql`), `crew_members` columns (finding 1, now fixed),
   and primary-key shape on all seven client-id tables — `journal_entries`,
   `crew_members`, `mood_history`, `circle_posts`, `parent_circle_posts`,
   `voice_notes`, `comfort_sessions` — **now fixed across the board.**
   `db/schema.sql` declares `primary key (user_id, id)` on all seven; the last
   five are reconciled on already-live databases by
   `supabase/migrations/20260702080000_reconcile_remaining_primary_keys.sql`
   (same pattern and same safety argument as
   `20260702070000_reconcile_journal_crew_primary_keys.sql`: widening a PK
   from `(id)` to `(user_id, id)` can't violate existing data). Two maintained
   copies of the same schema will still keep drifting on anything *other* than
   PK shape as long as both files exist — worth deciding on one canonical path
   (recommend: CLI migrations only, with `db/schema.sql` regenerated from them
   or retired) rather than hand-editing both on every schema change.

3. **`scripts/control-room-rls-scan.mjs` only scans `supabase/migrations/`.**
   It would not have caught finding 1, because the columns it's missing are
   RLS-irrelevant column drift, not a missing `enable row level security` — the
   table itself does have RLS enabled and a policy in both files, so the scanner
   correctly reports no RLS issue on `crew_members`. This audit is a column-level
   / cross-file check the existing scanner doesn't attempt; not a scanner bug.

4. **Planned `voice_*` tables have no schema yet in either file.** Not a defect —
   just confirms the tables reviewed alongside the voice-WS draft
   (see chat review) don't exist in this repo. If Phase 1 of
   `docs/AGENT_L4_ARCHITECTURE.md` or the voice session flow is approved, they need
   RLS added in the same migration that creates them, in both `db/schema.sql`
   and `supabase/migrations/`, given finding 2's dual-file reality.
