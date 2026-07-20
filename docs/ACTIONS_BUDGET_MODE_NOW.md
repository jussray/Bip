# Actions Budget Mode Now

This branch reduces GitHub Actions fan-out during runner-budget/outage pressure.

## What changes

The noisy workflows remain available, but only through manual `workflow_dispatch` runs:

- Account Deletion Sweep
- CI
- Companion Lab Audit
- Control Room Manifest
- Verify Cloudflare Native Deployment
- Implementation Evidence
- Playwright Smoke and Guardrails
- Pre-Push Checks
- Quality Gate
- Regression Tests
- Trigger Audit
- Type Check
- Verify Room Archives

## Why

Ray's GitHub mobile workflow list showed repeated recent workflow activity and large accumulated run counts. During the current GitHub runner issue, automatic fan-out creates false red noise and consumes attention/minutes without producing reliable code evidence.

## What does not change

- No workflow files are deleted.
- No app/runtime code changes.
- No Supabase/Auth/RLS changes.
- No secrets are modified.
- No deployment is performed by this change.

Manual runs can still be started from Control Room when exact-SHA evidence is needed.
