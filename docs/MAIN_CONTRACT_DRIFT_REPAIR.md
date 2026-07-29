# Main contract drift repair

This focused lane reconciles stale repository contracts discovered by the full exact-head suite.

## Reconciled authority

- `worker/voice-entry.ts` is the configured production Worker entrypoint; it delegates ordinary HTTP traffic to `worker/observed-index.ts` and retains inbound email handling.
- the production release marker is `https://sekretbip.net/.well-known/sekret-release.json`.
- `deploy:worker` delegates to the explicit `deploy:api:production` script; neither command is executed by this change.

## Boundary

Repository tests, inventory, and documentation only. No deployment, database mutation, credential use, account mutation, paid-capacity action, or external-platform change is authorized.

## Rollback

Revert this PR and rerun the exact-head suite on the restored head.
