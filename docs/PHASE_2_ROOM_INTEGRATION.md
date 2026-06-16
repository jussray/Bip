# Phase 2 — Room Integration Gate

Phase 2 (per the [README roadmap](../README.md#roadmap)) moves Room state —
and eventually Room art — onto Supabase. This doc covers the specific gate
for any Phase 2 work that touches room background art
(`assets/images/bg-*.png`) or the room-selection logic in
`constants/theme.ts`.

## The gate

**Do not start Phase 2 room integration work until `npm run
verify:room-archives` passes.**

That command checks that every live room background has a real, verified
backup under `assets/images/archive/`. See
[`ASSET_BACKUP_RULES.md`](./ASSET_BACKUP_RULES.md) for exactly what "real"
means. If it fails, it prints `DO NOT START PHASE 2` — that line is not
decorative, it's the actual instruction.

## Why room art specifically is gated

Other Phase 2 surfaces (journal entries, mood history, circle posts) are
rows in a database — if a migration goes wrong, the data is still in
AsyncStorage as a fallback. Room backgrounds are binary assets with no
equivalent fallback path once they're touched: if a PNG gets overwritten,
resized, or corrupted mid-integration and there's no verified backup, the
art is gone.

## Checklist before touching room art in Phase 2 work

1. `npm run verify:room-archives` passes.
2. `npm run audit:runtime-assets` passes (no reference/mockup art has
   leaked into the runtime image map — see
   [`ROOM_ART_GUIDE.md`](./ROOM_ART_GUIDE.md)).
3. The change is scoped to room integration only — don't bundle in
   unrelated Supabase wiring for journal/mood/circle in the same change.
4. After the change, re-run `npm run verify:room-archives` — if you touched
   any `bg-*.png`, its archive copy needs to be refreshed too (see
   [`ASSET_BACKUP_RULES.md`](./ASSET_BACKUP_RULES.md)) or the script will
   correctly start failing again.
5. `npm run verify:prepush` passes before you push.

## Current status

As of this doc, `npm run verify:room-archives` **fails** — most archive
entries are placeholder text files (a GitHub raw URL, not the actual PNG
bytes), and several rooms (`bg-mom-room-*`, `bg-dad-room-*`) have no archive
entry at all. Phase 2 room integration work should not begin until real
backups are in place and the script passes clean.
