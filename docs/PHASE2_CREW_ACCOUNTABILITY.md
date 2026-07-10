# Phase 2 — Crew Accountability

Parent goal: #238 (Relationship Layer)  
Feature flag: `crewAccountability` in `src/constants/relationshipFeatureFlags.ts`

## What it is

A teen can post a daily emoji check-in and optionally share it with specific accepted crew members. Crew members can respond with a preset encouragement. No raw content is visible to parents. No access is granted to non-accepted connections.

## Schema

Migration: `supabase/migrations/20260705010000_crew_accountability.sql`

| Table | Owner | Permitted readers |
|---|---|---|
| `crew_check_ins` | teen (`owner_user_id`) | Owner + accepted crew via share |
| `crew_check_in_shares` | teen (`owner_user_id`) | Owner + recipient crew member (accepted only) |
| `crew_encouragements` | crew member (`sender_user_id`) | Sender + recipient teen |

RLS enforces `connection_status = 'accepted'` on every crew member read. Block or remove = immediate loss of access.

## Service

`src/services/crewAccountabilityService.ts`

| Function | Actor | Description |
|---|---|---|
| `createCheckIn` | Teen | Creates check-in + shares to accepted crew members |
| `revokeCheckInShare` | Teen | Revokes one specific share immediately |
| `fetchMyCheckIns` | Teen | Own history with share status |
| `fetchCrewFeed` | Crew member | Check-ins shared with them |
| `sendEncouragement` | Crew member | Sends preset reaction to teen |

## Build sequence

- [x] Migration
- [x] Service
- [x] Worker route stub
- [ ] Teen UI — check-in composer screen
- [ ] Teen UI — my check-ins history with share status
- [ ] Crew member UI — incoming feed
- [ ] Crew member UI — encouragement preset picker
- [ ] Push notification on new share (Worker route)
- [ ] Flag flip: `crewAccountability: 'internal'` → test → `'beta'` → test → `'enabled'`

## Gate before flag flip to 'enabled'

- [ ] All RLS tests pass (owner, crew-accepted, crew-blocked, crew-removed, stranger, parent, service)
- [ ] `connection_status` audit: no pending/removed/blocked user can reach check-in content
- [ ] Note sanitization verified (280 char cap, trim)
- [ ] No raw content in any error message or meta field
- [ ] Teen can revoke individual share and crew member loses access within one query
- [ ] Block/remove crew member immediately invalidates all active shares

## Privacy invariants

- Parents have no access path to check-ins, shares, or encouragements
- Safety escalation does not grant Bridge, Crew, or Scrapbook access
- Crew feed only shows check-ins shared with that specific user — no broadcast
- Preset encouragements only — no free-text from crew members
