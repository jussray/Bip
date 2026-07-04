# Demo Readiness Enforcement

Last reviewed: 2026-07-04

This document converts the current red-team readiness review into enforced implementation policy for every README and Markdown guide in this repository. Documentation must describe what is enforced by code, migrations, configuration, tests, or a named release gate. Do not describe planned behavior as demo-ready behavior.

## Release posture

Se'kret Bip is buildable and suitable for a controlled, scripted internal demo only when the demo avoids real teen data, real crisis disclosures, public legal/compliance claims, and unfinished parent lifecycle flows.

Public launch, public demo, app-store release, or production teen-data collection is blocked until all gates in this document and `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md` are satisfied with evidence.

## Enforced gates

A feature or deployment path may be called complete only when all applicable layers agree:

1. route and screen behavior;
2. service/API behavior;
3. Supabase migration, RLS, RPC, or storage policy behavior;
4. automated test or documented manual release evidence;
5. production-like environment verification, when the claim depends on live Cloudflare or Supabase configuration.

UI hiding is never authorization. Parent/teen boundaries, founder/admin boundaries, account deletion, storage access, and Circle/Crew/Bridge visibility must be enforced by server checks, Supabase RLS/RPCs, and storage policies.

## Parent and Bridge enforcement

Parent routes and linked-account tables exist, but the parent product must remain marked in-progress until issue #212 is closed and verified. A demo must not imply that the following are production-complete unless evidence is attached:

- canonical Parent Bridge tabs;
- parent splash and onboarding;
- pending, active, expired, revoked, and blocked relationship states;
- Parent Circle privacy validation;
- Parent Coach memory boundaries;
- period-sharing permissions;
- minimal-content notifications;
- end-to-end relationship and privacy tests.

Bridge may show only intentionally shared linked-relationship content. It must not expose raw journals, private voice transcripts, private companion chats, private character memory, private notes, unshared messages, or general activity history.

## Deployment enforcement

A deployed demo is not release-ready until the active environment is verified:

- Cloudflare Worker and web secrets are configured in server-side stores;
- Worker CORS is restricted to approved origins;
- authenticated Worker routes verify identity and do not trust body-only user identifiers;
- Supabase migrations replay cleanly from an empty database;
- RLS/storage policies are current in the active Supabase project;
- `safety-scan` is deployed in the active Supabase project;
- release-health telemetry records the deployed commit;
- repository validation scripts pass or have a documented environment-only warning.

## Legal and age-gate enforcement

The service is documented as 13+ unless a separate legally reviewed under-13 product is implemented. Public launch is blocked until the app and API enforce the minimum-age boundary and direct API/replay tests prove under-13 account creation cannot bypass the UI.

A demo must warn participants not to enter real personal, journal, voice, or crisis information unless the environment has been approved for production data handling.

## RLS enforcement

Every table containing user, teen, parent, Circle, Crew, Bridge, notification, safety, memory, voice, journal, or storage-reference data must have RLS enabled and at least one intentional policy or must be documented as service-role-only with compensating controls.

The current `notification_deliveries` scanner warning is release-blocking until a migration adds the intended policy or the table is documented as intentionally service-role-only and the scanner allowlist is updated with that rationale.

## Companion memory enforcement

The implemented companion system is L2: stateless provider calls with supplied short-term history and allowed context. Do not market or demo durable semantic memory, persistent goals, scheduled reflection, or inter-companion coordination as implemented until migrations, services, privacy controls, and tests exist.

## Required validation commands

Before any release candidate or externally shared demo, run:

```bash
npm run type-check
npm test
npm run lint
npm run verify:bundle
npm run audit:control-room
npm run validate:companions
```

For a full repository gate, run:

```bash
npm run verify:prepush
```

Any warning that touches privacy, RLS, deployment secrets, age gates, or parent/teen boundaries must be resolved or explicitly documented as a non-production demo limitation.
