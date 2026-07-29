# Main contract drift repair

This child lane repairs stale repository contracts discovered while running the full exact-head suite for PR #687.

## Reconciled authority

- `worker/voice-entry.ts` is the configured production Worker entrypoint and delegates ordinary HTTP traffic to `worker/observed-index.ts` while retaining inbound email handling.
- the production release marker is `https://sekretbip.net/.well-known/sekret-release.json`.
- `deploy:worker` delegates to the explicit `deploy:api:production` script; neither command is executed by this change.

## Boundary

Repository tests and inventory only. No deployment, database mutation, credential use, account mutation, paid-capacity action, or external-platform change is authorized.

## Rollback

Revert this child PR and rerun the exact-head suite on the parent branch.
