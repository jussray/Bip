# Founder Control Room — GitHub Failure Routing

## Permanent operating rule

Every GitHub failure must be checked against Founder Control Room first.

A failed GitHub status is a signal, not a diagnosis. The operating sequence is:

1. capture the exact repository, pull request, head SHA, workflow, run, conclusion, and job evidence;
2. classify whether GitHub executed real steps;
3. write the result to the local Control Room report;
4. when server-side Supabase credentials are available, publish the event into `audit_events` and upsert the matching `control_room_issues` record;
5. use local Control Room verification to reproduce any real code failure;
6. do not merge until the required proof exists.

## Failure classes

### `runner_startup_failure`

Use this when jobs exist but no executable steps ran, no step timestamps exist, or GitHub reports `startup_failure`.

This is infrastructure evidence. It is not proof of a code regression.

Required response:

- preserve the exact-head GitHub failure;
- look to Founder Control Room local verification;
- do not rewrite application code merely to make the red GitHub badge disappear;
- rerun GitHub Actions only after runner capacity or workflow-startup conditions recover.

### `workflow_no_jobs`

Use this when a failed workflow run returns no jobs.

Treat this as a workflow or platform-startup failure until job or log evidence proves otherwise.

### `workflow_step_failure`

Use this only when GitHub actually executed one or more steps and a step or job failed.

Required response:

- inspect the failed step and logs;
- reproduce the same command locally through Control Room;
- fix the smallest supported root cause;
- rerun local verification;
- rerun exact-head GitHub Actions.

## Commands

Scan open pull requests without writing to Supabase:

```bash
GH_TOKEN=... npm run control-room:github-failures:scan
```

Scan one pull request:

```bash
GH_TOKEN=... CONTROL_ROOM_GITHUB_PR=477 npm run control-room:github-failures:scan
```

Scan and publish failures into Founder Control Room:

```bash
GH_TOKEN=... \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run control-room:github-failures:ingest
```

The scanner writes:

```text
reports/control-room/github-failures-latest.json
```

## Control Room issue identity

Issues use a stable fingerprint based on:

```text
github_actions:<repository>:pr-<number>:<workflow-id>:<head-sha>
```

A rerun of the same workflow against the same exact head updates the same issue. A new head creates a new evidence record rather than overwriting history.

## Required issue evidence

Every GitHub failure issue must retain:

- pull request number and URL;
- head branch and exact SHA;
- base branch;
- workflow name and ID;
- run ID, number, attempt, and URL;
- GitHub conclusion;
- Control Room failure classification;
- job names, conclusions, step counts, and failed-step names when present;
- a recommended next action.

## Security boundary

- GitHub tokens are read only from `GH_TOKEN` or `GITHUB_TOKEN` in a server-side shell.
- Supabase service credentials are read only from server-side environment variables.
- Tokens and keys must never enter React Native, Expo public variables, reports, audit metadata, PR comments, or committed files.
- The scanner may read GitHub status and write Control Room evidence. It cannot merge, deploy, modify source code, accept terms, or apply database migrations.
- Never use teen private content as CI, audit, or issue metadata.

## Truth rule

A green local Control Room result does not become GitHub Actions proof. A red zero-step GitHub run does not become code-failure proof.

Both signals remain separately labeled until the exact required witness exists.
