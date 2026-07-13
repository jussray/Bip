# Demo Readiness Enforcement

Last reviewed: 2026-07-13

This document converts the current readiness review into enforced implementation policy. Documentation may describe only behavior backed by code, migrations, configuration, tests, live evidence, or a named release gate. Planned behavior is not demo-ready behavior.

## Release posture

Se'kret Bip is suitable for a controlled, scripted internal demo only when the demo uses synthetic or non-sensitive data, clearly labels unfinished areas, and avoids real crisis disclosures, unsupported legal/compliance claims, and unverified parent lifecycle flows.

Public launch, public demo involving real teen data, app-store release, or production teen-data collection is blocked until all applicable gates in this document and `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md` are satisfied with evidence.

## Evidence states

The repository uses the following machine-checked order:

```text
planned -> contract -> integrated -> verified -> released
```

`implementation-ledger.json` records each feature's paths, tests, rollout, verification, rollback, and blockers. Architecture, roadmap, current-status, and agent-skill changes fail CI when they do not update the ledger.

## Enforced completion rule

A feature or deployment path may be called complete only when all applicable layers agree:

1. route and screen behavior;
2. service/API behavior;
3. Supabase migration, RLS, RPC, Storage, or Edge Function behavior;
4. executable tests or documented live proof;
5. telemetry and failure visibility;
6. rollout controls and rollback;
7. production verification when the claim depends on live Cloudflare or Supabase configuration.

UI hiding is never authorization. Parent/teen boundaries, founder/admin boundaries, account deletion, storage access, and Circle/Crew/Bridge visibility must be enforced by server checks, RLS/RPCs, and Storage policies.

## Parent and Bridge enforcement

Parent routes, linked-account tables, Bridge contracts, summary paths, and revocation paths exist. The parent product remains in progress until evidence covers:

- parent splash and onboarding;
- pending, active, expired, revoked, blocked, and deleted relationships;
- controlled two-account production journeys;
- Parent Circle privacy validation;
- Parent Coach boundaries;
- period-sharing permissions;
- minimal-content notifications;
- complete relationship and privacy tests.

Bridge may show only content intentionally shared into the linked relationship. It must not expose raw journals, private voice transcripts, private companion chats, private character memory, private notes, unshared messages, or general activity history.

Bridge summaries remain under controlled rollout. Existing code is not permission to enable the feature without the documented production proof.

## Deployment enforcement

Production authority is Cloudflare native Git integration. A deployed environment is release-ready only when the exact commit is proven through independent evidence:

1. `Workers Builds: sekret-backend` succeeds for the expected commit;
2. the deployed Pages `release.json` reports the same `main` SHA;
3. the canonical Worker health endpoint succeeds;
4. read-only production Playwright verifies the release marker and protected teen and parent routes;
5. the resulting evidence artifact is retained.

The retired Supabase `release-health` function is not valid release evidence. It is a JWT-protected HTTP 410 retirement. GitHub Actions verifies production but does not upload code to Cloudflare.

Additional deployment requirements:

- server secrets remain in Cloudflare or Supabase secret stores;
- Worker CORS is restricted to approved origins;
- authenticated Worker routes verify identity and do not trust body-only user identifiers;
- Supabase migrations replay cleanly from an empty database;
- RLS and Storage policies match the live project;
- required Edge Functions are deployed with reviewed authentication settings;
- repository validation passes or has a documented environment-only limitation.

## Authorization enforcement

Verified live slices include:

- sampled owner access plus cross-user and anonymous denial;
- zero synthetic probe residue;
- service-role-only configuration tables with zero client grants;
- `notification_deliveries` verified as an intentional service-role-only table;
- three obsolete Edge Functions retired behind platform JWT verification.

These slices do not certify the entire database. Before L4 or broader launch claims:

- behavior-test high-blast-radius authenticated database functions;
- add negative tests for `account-delete` and `safety-scan`;
- plan and test password-breach protection across signup, login, reset, and existing accounts.

## Legal and age-gate enforcement

The service is documented as 13+ unless a separately reviewed under-13 product is implemented. Public launch is blocked until the app and API enforce the minimum-age boundary and direct API/replay tests prove the UI cannot be bypassed.

A demo must warn participants not to enter real personal, journal, voice, or crisis information unless the environment is approved for production data handling.

## Companion enforcement

The implemented companion system supports short-term history, approved context, canonical identity/style enforcement, TTS styling, and metadata-only telemetry.

Do not market or demo durable semantic memory, persistent goals, scheduled reflection, relationship phases from persisted evidence, or inter-companion coordination as implemented. Those remain planned until schema, provenance, correction, expiry, deletion, RLS, runtime use, denial tests, rollout, and rollback exist together.

## Required validation

Before any release candidate or externally shared demo, run:

```bash
npm run type-check
npm test
npm run lint
npm run verify:bundle
npm run audit:control-room
npm run validate:companions
npm run test:e2e
```

For the full repository gate:

```bash
npm run verify:prepush
```

For production claims, follow `DEPLOYMENT.md` and preserve the exact-release artifact.

Any warning involving privacy, authorization, deployment identity, age gates, deletion, safety, or parent/teen boundaries must be resolved or explicitly documented as a non-production limitation.
