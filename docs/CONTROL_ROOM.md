# Bip Control Room

Bip Control Room is the local-first verification layer for Se'kret Bip. It exists so development can keep moving even when GitHub-hosted Actions minutes are exhausted or unavailable.

## Why this exists

GitHub Actions is useful, but it should not be the only engineering gate. When the account has no hosted-runner minutes left, jobs can be created but fail before a runner starts. Control Room gives the repo a local verification path that does not depend on paid GitHub Actions minutes.

## Current mode

The first implementation is local and read-only:

```bash
npm run verify:local
```

This runs the repo's existing checks and writes reports to:

```text
reports/control-room/latest.json
reports/control-room/latest.md
```

## What it checks

The local verifier currently runs:

- runtime asset audit
- Control Room structural scan
- Supabase RLS scan
- companion asset validation
- TypeScript type-check
- lint
- unit tests
- voice intelligence test
- Oracle discovery test
- room archive verification

## How to use it

Before pushing:

```bash
npm run verify:local
```

If the report says `Push safe: yes`, the branch is locally healthy enough to push.

If it says `Push safe: no`, open `reports/control-room/latest.md` and fix the failing area first.

## Relationship to GitHub Actions

Control Room does not remove GitHub Actions. It demotes Actions from the only gate to a backup gate.

Recommended split while Actions minutes are constrained:

- local Control Room for daily development
- GitHub Actions for release candidates, final PR verification, deployment confirmation, or when minutes/budget are available

## Secret rules

Control Room must not require secrets for local verification.

- Do not put a GitHub PAT in React Native, Expo public env vars, committed files, or report files.
- Do not put OpenAI API keys in app code or reports.
- Do not run companion test fixtures on real teen private data.
- Do not silently deploy, merge, or rewrite production configuration from Control Room.

## OODA model

### Observe
Run local checks and collect the real state of the repo.

### Orient
Group failures by app, companions, Supabase, voice, Oracle, assets, and code quality.

### Decide
Mark the branch as push-safe or blocked.

### Act
Fix the highest-impact blocker, rerun locally, then push only when the report is green.

## Future MCP direction

Control Room can later coordinate MCP-style connectors for:

- GitHub repository and PR state
- Supabase schema, RLS, storage, and advisors
- Cloudflare Worker deploys, secrets, and routes
- Expo/EAS build readiness
- Companion Lab scoring
- local runner execution

These connectors should start read-only, then progress to suggested fixes and PR creation only with explicit approval.
