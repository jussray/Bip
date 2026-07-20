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

## Release-proof contract

Actions Budget Mode does not turn missing evidence into a pass.

A release gate may cite GitHub Actions only when the exact workflow run:

1. was manually dispatched against the intended exact branch or commit;
2. produced jobs with real step records and readable logs;
3. completed successfully;
4. is recorded in Founder Control Room with the workflow name, run id, commit SHA, and any artifacts.

Zero-step jobs, `steps: null`, missing logs, or missing runs remain `runner_startup_failure` or missing evidence. They are not code passes and not code diagnoses.

## Account deletion sweep

The account-deletion sweep is intentionally manual during budget mode. It still requires the production environment, Supabase credentials, and the account-deletion process secret. Running it remains a separate founder-approved production operation gate.

## Room archives

Verify Room Archives is verification-only in budget mode. It no longer commits repairs from a workflow run. If archive verification fails, repair the assets through a normal PR that preserves the diff and evidence.

## What does not change

- No workflow files are deleted.
- No app/runtime code changes.
- No Supabase/Auth/RLS changes.
- No secrets are modified.
- No deployment is performed by this change.

Manual runs can still be started from Control Room when exact-SHA evidence is needed.
