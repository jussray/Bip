# Se’kret Bip Relationship Layer — Architecture Baseline

Parent goal: #238  
Phase issue: #239

## Purpose

This document grounds the Parent–Teen Translation Layer, Emotional Accountability Crew, Emotional Scrapbook, and Persistent Companion Memory in the repository that exists today. It does not authorize parent surveillance, automatic sharing, or silent memory retention.

## Existing foundations

### Parent and teen linking

`src/utils/parentLink.ts` is the current client contract for parent linking. It:

- creates an eight-character invite through `create_parent_link_invite`;
- redeems an invite through `redeem_parent_link_invite`;
- reads active links from `parent_links`;
- treats a usable link as `status = 'active'` and `is_active = true`;
- permits a teen to revoke an active link by setting `status = 'revoked'` and `is_active = false`.

Relationship-layer features must reuse this canonical active-link check. A parent link alone never grants access to raw teen content.

Relevant migrations already include:

- `supabase/migrations/20260630002000_limited_mode_parent_invite.sql`
- `supabase/migrations/20260630003000_reconcile_parent_link_contract.sql`
- `supabase/migrations/20260628_consent_visibility.sql`
- `supabase/migrations/20260630005000_bridge_s2tell_existing_tables.sql`
- `supabase/migrations/20260618_bridge_oracle_tables.sql`

Before new Bridge tables are added, these migrations must be reconciled to avoid a second competing parent-sharing model.

### Crew

The repo already uses `crew_members`, including `bip_id` and `connection_status`. Phase 2 should extend the existing accepted-connection model rather than introduce a separate friendship graph.

Pending, blocked, removed, or otherwise non-accepted connections must not receive real-name or support-activity access.

### Tasks, approvals, points, and events

The repo already contains:

- `bip_tasks`
- `task_submissions`
- `reward_catalog`
- `reward_redemptions`
- `point_transactions`
- `bip_events`

Recent task RPCs write canonical events using `bip_events(user_id, event_type, meta)`. New relationship-layer analytics must use that canonical shape and must never place raw journal, chat, image, voice, summary, or memory text in `meta`.

### Safety

`supabase/functions/safety-scan/index.ts` and the existing safety flow remain separate from ordinary Parent Window sharing. Safety escalation is not consent for Bridge summaries, Crew disclosure, scrapbook sharing, or companion memory.

### Deployment and API boundary

The production direction is Cloudflare-first. Client code must not contain model-provider secrets. AI summary and memory operations belong behind the Worker/service boundary with typed request and response validation.

## Canonical feature boundaries

### 1. Bridge Summaries

Owner: teen.  
Permitted reader: one currently active linked parent selected by the teen.  
Source access: service-only for the exact source IDs explicitly selected by the teen.  
Parent access: generated summary only.  
Revocation: ordinary parent access ends immediately when the share or parent link is revoked.  
Retention: defined before schema ships; raw content is referenced, not duplicated.

Required states: draft, pending, processing, ready, viewed, revoked, expired, failed, deleted.

### 2. Crew Accountability

Owner: the teen creating a check-in, reminder, or support preference.  
Permitted readers: accepted crew members explicitly included by the owner.  
Revocation: block/remove invalidates access immediately.  
Parent access: none by default.  
Public access: none.

### 3. Emotional Scrapbook

Owner: teen.  
Default visibility: private.  
Media: private owner-scoped storage paths with short-lived signed access.  
Sharing: an explicit destination-specific action; sharing to Circle, Crew, or Parent Window does not change the private default for future memories.  
Deletion: removes database references and stored objects according to the retention contract.

### 4. Companion Memory

Owner: teen.  
Default state: disabled.  
Creation: candidate memories are proposed and require teen approval.  
Retrieval: strict owner filtering happens before relevance ranking.  
Deletion: deleted memory is excluded from retrieval immediately.  
Parent access: none unless the teen separately shares a recap through an approved Parent Window flow.

## Shared contracts

Canonical TypeScript contracts live in `src/types/relationshipLayer.ts`.

Feature rollout states live in `src/constants/relationshipFeatureFlags.ts`. All four features are disabled by default. Supported rollout states are:

- `disabled`
- `internal`
- `beta`
- `enabled`

Feature flags are release gates, not authorization. RLS and server-side checks remain mandatory when a feature is enabled.

## Proposed service boundaries

These names are directional and must be reconciled with current utilities before implementation:

- `src/services/bridgeSummaryService.ts`
- `src/services/crewAccountabilityService.ts`
- `src/services/scrapbookService.ts`
- `src/services/companionMemoryService.ts`

Services should return the shared `RelationshipResult<T>` shape and represent revoked, unavailable, rate-limited, fallback, and authorization failures explicitly.

## Schema decision rules

Before adding a table:

1. Confirm the data cannot safely live in an existing canonical table.
2. Define owner, reader, writer, revoke, delete, and retention behavior.
3. Add the change through a versioned migration.
4. Enable RLS explicitly.
5. Add teen, parent, crew, stranger, blocked, revoked-link, and service-role tests where relevant.
6. Reconcile `db/schema.sql` with migrations or document migrations as the only canonical bootstrap source.

## Immediate gaps

- No canonical typed relationship-layer contracts existed before Phase 0.
- No independent feature gates existed for the four roadmap phases.
- Existing Bridge/Parent Window migrations need reconciliation before new summary schema is designed.
- Existing Crew schema must be audited for accepted-only reads, blocking, and mutual activity visibility.
- Scrapbook storage ownership, signed URL lifetime, metadata stripping, and object deletion are not yet locked.
- Companion memory consent, candidate approval, retrieval filtering, and forget semantics are not yet implemented end to end.
- Privacy-safe event names and payload allowlists are not yet defined for these features.

## Next implementation slice

Complete the remaining Phase 0 deliverables:

1. data-flow diagrams;
2. threat model;
3. cost model;
4. release/test gates;
5. repo-wide schema and service audit;
6. follow-up issues split by contracts/schema, Worker services, teen UI, parent/crew UI, analytics, tests, and docs.
