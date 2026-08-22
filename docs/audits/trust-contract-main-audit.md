# Sekret-Bip Trust Contract Audit

- Repository: `jussray/Sekret-Bip`
- Branch: `main`
- Audited commit: `467da149bad1720f87885a991a924aa143eb2ddd`
- Audit date: `2026-08-22`
- Auditor: `ChatGPT / ULTRATHINK read-only audit`
- Scope: read-only repository + live Supabase discovery before implementation

## Trust Contract v1

> What I write is private unless I deliberately share a specific thing; safety help is a separate, clearly explained path.

No diagnosis, continuous monitoring, predictive risk scoring, clinician workflow, caregiver dashboard, automatic caregiver inference, or broad historical sharing belongs in v1.

## Evidence baseline

### Private journal ownership

- `supabase/migrations/0001_init.sql` creates `public.journal_entries` with `user_id` referencing `auth.users(id)`.
- The same migration enables RLS and installs owner-only journal policies using `auth.uid() = user_id`.
- Live Supabase policy inspection on project `tbsevonvegdnlyjgplmm` confirmed owner-only journal policies remain installed at audit time.

Assessment: `PASS` at the RLS policy layer. Runtime JWT behavior remains a separate proof gate.

### Parent relationships

- `supabase/migrations/0003_oracle_parentlinks_period_safety.sql` creates `public.parent_links` and relationship-scoped parent access to the link record.
- No reviewed journal policy grants a linked parent direct journal access.

Assessment: direct relationship-based journal SELECT was not observed in the audited policy set.

### Parent-authored notes

- `supabase/migrations/20260621_parent_notes_realtime.sql` defines `parent_notes` as parent-originated content separate from the teen journal.
- Parent and teen reads are separately scoped by `parent_user_id` and `teen_user_id`.

Assessment: `PASS` for object separation in the reviewed migration.

### Realtime

Live `pg_publication_tables` inspection showed `bridge_signals` and `parent_notes` in the `supabase_realtime` publication. `journal_entries` was not present.

Assessment: `PASS` for direct Postgres Changes publication of `journal_entries`; bridge revocation/recipient semantics remain a separate finding lane.

## Finding TC-01: private journal inserts enter a passive safety pipeline

Status: `FINDING`
Severity: `P0 Trust Contract conflict`

Repository evidence:

- `supabase/migrations/20260619_safety_scan.sql` creates trigger `safety_scan_journal` on `public.journal_entries` after insert.
- That trigger invokes `public.trigger_safety_scan('journal_entry', 'text')`.

Live Supabase evidence:

- `information_schema.triggers` confirmed `safety_scan_journal` is installed on `journal_entries`.
- The live `trigger_safety_scan` function invokes the deployed `safety-scan` Edge Function.
- The deployed `safety-scan` function uses a privileged service-role client for safety persistence.
- When an external moderation credential is configured, the function can send the submitted content to a third-party moderation endpoint.
- High-severity outcomes can create `safety_alerts`; `safety_alerts` has a linked-parent SELECT policy.

### Why this violates v1

The private journal write itself is sufficient to enter the safety pipeline. No separate child-initiated support action is required. That conflicts with the approved v1 invariant that safety is explicit, minimum-disclosure, and separate from private reflection.

The repair must not depend on whether an external moderation credential happens to be configured. The structural violation is the automatic private-journal trigger.

## Smallest viable repair

Remove only the `safety_scan_journal` trigger from `public.journal_entries` in a new forward migration.

Preserve unrelated safety handling, including public/social-content safety paths, for separate review. Do not edit historical migrations.

Required regression proof:

1. The final migration chain contains a forward `DROP TRIGGER IF EXISTS safety_scan_journal ON public.journal_entries`.
2. No later migration recreates `safety_scan_journal`.
3. The repair does not drop the public/social post safety trigger.
4. Live runtime verification after authorized migration application must confirm no `journal_entries` safety trigger remains.

## Additional confirmed follow-up findings

These are deliberately excluded from TC-01 and require independent OODA loops:

### TC-02: bridge recipient drift

Legacy `bridge_signals` is keyed to the teen and readable by an active linked parent rather than being permanently bound to the exact recipient selected when the signal was created. The newer `bridge_share_requests` / `bridge_share_sources` model is more resource- and recipient-specific. Do not combine this repair with TC-01.

### TC-03: automatic caregiver mood inference

Live triggers refresh `parent_mood_summaries` from mood history. This conflicts with v1's exclusion of automatic caregiver trend/inference surfaces. Handle in a separate repair after TC-01.

### TC-04: privileged callable functions

Security-advisor and runtime inspection identified `SECURITY DEFINER` functions in parent/bridge/safety paths. Some are intentionally callable by authenticated users and contain caller checks. They require function-by-function authorization and EXECUTE-privilege review; their existence alone is not classified as an exploit.

### TC-05: historical safety preview retention

`safety_alerts` includes content-preview storage and linked-parent readability. Stopping new private-journal ingestion does not retroactively determine retention/remediation for existing rows. Any destructive cleanup requires a separate, explicitly authorized retention decision.

## Ten-domain status at TC-01 decision point

| Domain | Status | Current evidence |
|---|---|---|
| Authorization | PASS / partial | Journal RLS owner-only; JWT behavior test pending |
| Data ownership | PASS / partial | Journal rows bind to auth user ownership |
| Sharing lifecycle | FINDING | Legacy bridge recipient binding needs repair |
| Realtime | PASS / partial | Journal not published; bridge paths need revocation test |
| Service-role / privileged code | FINDING | Passive safety function crosses RLS boundary |
| Data egress | FINDING | Passive safety path can forward private journal content when moderation is configured |
| Metadata inference | FINDING | Automatic parent mood summaries exist |
| AI boundary | FINDING | Passive moderation of private journal content is structurally possible |
| Search/export/cache/storage | BLOCKED | Requires separate full-path runtime evidence |
| Safety and operations | FINDING | Private journal inserts currently trigger passive safety processing |

## Decision

Implement TC-01 only:

`private journal insert -> no automatic safety scan`

Then verify, reacquire current `main`, review, and merge before moving to TC-02 or TC-03.
