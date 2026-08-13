# Se'kret Bip — Current RLS Audit Overlay

**Observed:** 2026-08-13  
**Repository baseline:** `506dd4aa517b6b76ff850cf56a8846425858042d`  
**Supabase project:** `tbsevonvegdnlyjgplmm`  
**Issue:** [#810](https://github.com/jussray/Sekret-Bip/issues/810)

This is the current overlay for the historical `docs/RLS_POLICY_AUDIT.md`. The historical file remains useful for the dual-schema drift investigation, but its old point-in-time policy rows must not be used as current database truth.

`supabase/migrations/` is repository schema authority. Live catalog and policy inspection are separate environment evidence. No user rows or private content were read for this audit.

## Current sampled map

| Surface | Repository state | Live observation | Current conclusion |
|---|---|---|---|
| `journal_entries` | Defined in ordered migrations; later Bridge migration removes legacy linked-parent source-row read policy | Table exists; RLS enabled; observed policies are permanent-owner scoped | Raw journal rows are owner-only in the observed project |
| `bridge_summaries` | Defined by the Bridge summary contract | Table exists; RLS enabled; teen select plus parent select through active link and valid ready/viewed share | Parent path is generated-summary-only |
| `crew_members` | Defined and hardened in ordered migrations | Table exists; RLS enabled; observed CRUD policies are owner-scoped | Owner-scoped in the observed project |
| `parent_circle_posts` | Historical policy narrative in the old audit is stale | Table exists; RLS enabled; observed policy is `auth.uid() = user_id` for ALL | The old `any-authenticated-read` description is not current live truth |
| `voice_sessions` | Defined in merged migration `20260717034535_create_voice_runtime_foundation.sql` | Not present | Repository contract exists; live application not observed |
| `voice_turns` | Defined in the same merged migration | Not present | Repository contract exists; live application not observed |
| `voice_events` | Defined in the same merged migration; error vocabulary hardened by `20260718034600_restrict_voice_error_code_vocabulary.sql` | Not present | Repository contract exists; live application not observed |
| `voice_latency_metrics` | Defined in the same merged migration | Not present | Repository contract exists; live application not observed |

## Bridge correction

`20260628_consent_visibility.sql` historically introduced linked-parent read policies for explicitly shared journal and mood rows.

`20260705010000_bridge_summary_contract.sql` later removes those raw-content parent policies and establishes the current summary boundary:

- the teen owns source selection;
- source references are teen-only;
- generated `bridge_summaries` are available to the teen;
- a parent may read a generated summary only while the exact request is ready/viewed, unrevoked, unexpired, and backed by an active parent link.

The observed live policies on 2026-08-13 match that newer boundary.

## Voice telemetry correction

The historical audit says the four `voice_*` tables were not defined. That statement is now stale at the repository layer.

PR #479 merged the privacy-safe telemetry contract with these boundaries:

- server-owned writes;
- permanent authenticated owner reads and top-level deletion;
- anonymous and cross-user denial contracts;
- opaque UUID correlation;
- no transcript-text field;
- no audio bytes;
- bounded operational event metadata;
- finite internal error codes;
- no voice Storage bucket.

The implementation ledger remains `contract`, verification `partial`, rollout `disabled`. Read-only live catalog inspection did not find those four tables, so no live integration claim is made.

## Evidence rule

For database work, keep these separate:

1. ordered repository migration;
2. merge SHA;
3. target-project migration history;
4. live tables, columns, indexes, grants, and policies;
5. owner, cross-user, and anonymous behavior probes;
6. security/performance advisors;
7. cleanup and rollback evidence.

A passing repository scanner is not a substitute for live authorization behavior.

## Manual CSV status

The uploaded `bip-rls-policy-map-template.csv` remains a useful checklist, but fields such as `exists_in_schema_sql`, `exists_in_0001_init`, `unknown`, and `planned` describe an older audit workflow.

A future generated map should instead report:

- `defined_in_ordered_migrations`;
- `observed_live`;
- `rls_enabled_live`;
- `grant_contract`;
- `policy_contract`;
- `behavior_probe_state`;
- `evidence_ref`;
- `unresolved_delta`.

## Current findings

1. Voice telemetry is **repository contract / live application not observed**, not `planned-only` and not `live`.
2. Journal rows are owner-only in the observed live project; parent access is through generated Bridge summaries.
3. The old `parent_circle_posts` shared-read description is stale against the observed live self policy.
4. The decision to keep one repository schema authority remains correct.
5. No voice Storage bucket is part of the approved contract.
6. The next useful RLS artifact is generated from ordered migrations plus live read-only evidence and executable denial probes.
