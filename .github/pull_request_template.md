## User outcome

<!-- What can a teen, parent, or founder actually do after this change? Use “No user-visible change” when honest. -->

## Evidence state

- [ ] Planned only
- [ ] Contract/types only
- [ ] Integrated into a real runtime entrypoint
- [ ] Verified through an executable user path
- [ ] Released and observed in production

Implementation ledger entry or reason no ledger change is needed:

## Runtime wiring

<!-- List the real screen, service, Worker route, Edge Function, migration, or native path that calls this implementation. “Future PR” means this PR is not integrated. -->

## Data and authorization

<!-- Tables, RLS, storage, RPCs, service-role boundaries, retention, deletion, and cross-user denial evidence. Write “Not applicable” only when no user or operational data is touched. -->

## Tests

- Unit/contract:
- Integration:
- Playwright/device:
- Live environment evidence:

## Observability

<!-- Events, logs, metrics, freshness, and what failure looks like. Decorative dashboards are not evidence. -->

## Rollout

- Feature flag or cohort:
- Default state:
- Activation step:

## Rollback

<!-- Exact reversible action, not “revert if needed.” -->

## Honest exclusions

<!-- State what remains unimplemented, unverified, undeployed, or blocked. -->

## Completion gate

- [ ] Runtime paths exist and are called.
- [ ] Tests exercise behavior, not merely source-text patterns.
- [ ] Privacy and authorization boundaries are proved below the UI.
- [ ] Telemetry distinguishes success, fallback, denial, and failure.
- [ ] Rollout and rollback are explicit.
- [ ] Architecture, roadmap, sprint, or agent-skill claims match `implementation-ledger.json`.
