# Se'kret Bip — Backend Wiring Status

Last reviewed: 2026-07-04

## Implemented

- Supabase authentication and persisted sessions
- Local-first AsyncStorage restore and cloud merge
- Teen Circle and Parent Circle data flows
- Bip Crew members, invites, connection states, and check-ins
- Points snapshots and rewards infrastructure
- Voice Bip recording, transcription, reply, and speech playback
- Oracle profile/session persistence paths
- Parent-link invites and redemption
- Safety tables, triggers, alerts, and Edge Function scaffolding
- Period-calendar synchronization
- Explicit splash entry controls
- Bridge signals and linked-account messages
- Founder Control Room ingestion and release-health systems

## Current route model

The app uses Expo Router route groups:

- teen routes: `app/(teen)/`
- parent routes: `app/(parent)/`

Older references to `app/(main)/`, `app/parent/`, or a global string router are historical and should not be used for new work.

## Database source of truth

`supabase/migrations/` is the schema source of truth.

Fresh projects should use:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not rely on missing `0003_*` files or a separate full-bootstrap SQL file. Migration ordering must remain safe for an empty database.

## Parent and Bridge status

The linked-account data model is implemented, including parent links, Bridge signals, Bridge messages, and relationship-aware RLS.

The parent product remains an enforced release gate. It is not production/demo-complete until issue #212 verifies:

- canonical Parent Bridge tabs
- parent splash and onboarding
- pending, active, expired, revoked, and blocked states
- Parent Circle privacy validation
- Parent Coach memory boundaries
- period-sharing permissions
- minimal-content notifications
- end-to-end relationship and privacy tests

## Companion status

Current companion maturity is L2:

- unified reply payloads
- short-term conversation history
- supplied RoomMemory and Oracle context
- metadata-only provider telemetry

Durable semantic memory, persistent goals, scheduled reflection, and inter-companion coordination are not implemented and must not be demoed as complete. See `AGENT_L4_ARCHITECTURE.md`.

## Deployment checks still required

These are enforced release gates, not optional notes:

- confirm current Cloudflare Worker and web deployment secrets
- verify the safety-scan Edge Function is deployed in the active Supabase project
- verify Worker CORS and authenticated request handling
- verify fresh migration replay
- run the repository validation scripts before release
- resolve or formally document the `notification_deliveries` RLS scanner warning

## Validation

```bash
npm run type-check
npm test
npm run test:device-sync
npm run audit:control-room
npm run validate:companions
npm run verify:prepush
```

Do not mark a path complete merely because code exists. Completion requires the route, service, database policy, and tests to agree.
