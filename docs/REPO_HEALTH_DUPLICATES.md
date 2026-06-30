# Repository Duplicate Audit

## Removed

Six exact duplicate root utility tombstones were deleted because the real implementations live under `src/utils/` and no live imports referenced the empty root placeholders:

- `utils/sekretCompanion.ts`
- `utils/sekretReply.ts`
- `utils/storage.ts`
- `utils/supabase.ts`
- `utils/sync.ts`
- `utils/voiceCompanion.ts`

## Kept intentionally

### Supabase migration history markers

The following files have identical marker contents but distinct timestamps and migration identities. They remain so local migration history stays aligned with the linked Supabase project:

- `supabase/migrations/20260626013453_push_tokens.sql`
- `supabase/migrations/20260626013458_media_columns.sql`
- `supabase/migrations/20260626014141_circle_replies.sql`
- `supabase/migrations/20260626020337_voice_notes_video_url.sql`
- `supabase/migrations/20260626021250_voice_notes_metadata.sql`
- `supabase/migrations/20260622190420_remote_history.sql`
- `supabase/migrations/20260622230350_remote_history.sql`
- `supabase/migrations/20260622230409_remote_history.sql`
- `supabase/migrations/20260625075233_remote_history.sql`
- `supabase/migrations/20260625182804_applied.sql`
- `supabase/migrations/20260625182819_applied.sql`

### Domain barrel files

These files have matching export shapes but belong to separate module boundaries and are intentionally retained:

- `src/parent/index.ts`
- `src/shared/index.ts`
- `src/teen/index.ts`
- `src/parent/services/index.ts`
- `src/shared/ai/index.ts`
- `src/teen/services/index.ts`
- `src/parent/components/index.ts`
- `src/teen/components/index.ts`
- `src/parent/hooks/index.ts`
- `src/teen/hooks/index.ts`

## Result

No other exact duplicate text/source implementations were identified by the automated hash scan. Compatibility re-export files were reviewed separately and retained where they preserve existing import paths.
