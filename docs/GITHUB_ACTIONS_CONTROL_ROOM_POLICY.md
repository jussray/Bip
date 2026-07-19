# GitHub Actions Control Room Policy

This policy keeps GitHub Actions useful without letting hosted-runner startup failures or private-repo minute limits become the project brain.

## Source-of-truth split

```text
Cloudflare = deployment truth
Sekret-Bip Control Room = repo-local evidence
Founder Control Room = final review authority
GitHub Actions = lightweight sensor
```

## Actions budget mode

While the repo is operating under free-account/private-repo budget pressure, GitHub-hosted runners should not start automatically for normal PRs or pushes.

Default rule:

```text
Automatic GitHub-hosted runners: off
Manual GitHub Actions gates: available by explicit founder / Control Room decision
Cloudflare builds: deployment-truth witness
Local Control Room checks: daily development evidence
Founder Control Room: exact-SHA review record
```

This prevents every PR update from spending account Actions minutes just to rediscover the same hosted-runner startup condition.

## Why this exists

When GitHub Actions jobs fail before any steps or logs exist, they did not validate or invalidate the code. Those runs are classified as `runner_startup_failure` and should not be treated as app regressions.

The fix is not to remove quality. The fix is to stop spending automatic GitHub-hosted runner attempts as the first line of truth. Interpretation moves into the Control Rooms, and Cloudflare's real build/deploy logs tell us what actually breaks in the deployment path.

## Automatic GitHub Actions

Automatic PR/push Actions should remain disabled while Actions budget mode is active.

`ci.yml` is retained as a manual `Control Room handoff` workflow so a founder can intentionally spend one small run when runner-health evidence is needed.

Automatic Actions should not duplicate every local test, browser test, implementation ledger check, pre-push check, and quality gate on every PR.

## Manual Control Room gates

The deeper GitHub-hosted checks still exist, but they run by explicit founder or Control Room decision:

- CI / Control Room handoff
- Quality Gate
- Playwright browser evidence
- Companion Lab AI-reply evidence
- archived Pre-Push Checks
- archived Type Check
- archived Regression Tests
- archived Implementation Evidence

This keeps the tools available without letting every PR fan out into many runner jobs.

## Cloudflare truth path

Cloudflare is the practical build/deploy witness:

- If Cloudflare build logs fail, fix the logged issue.
- If Cloudflare build logs pass, the deployment path has real external evidence.
- If GitHub Actions has zero steps/logs, do not infer a code failure from that signal.
- If Cloudflare also fails to start or provide logs, classify that as provider/config evidence, not app proof.

Cloudflare passing is deployment evidence for review. Founder Control Room records the final exact-SHA decision.

## Sekret-Bip Control Room handoff

Sekret-Bip Control Room should receive or summarize:

```text
PR number
exact head SHA
GitHub Actions status
GitHub runner classification
Cloudflare build/deploy status
Cloudflare log summary
release marker / deployed SHA when available
known blockers
recommended next action
```

It should classify the evidence before any Founder Control Room decision.

## Founder Control Room record

Founder Control Room records `HOLD`, `REVIEW`, or `APPROVE` for the exact PR and exact head SHA.

## OODA rule

```text
Observe: Cloudflare logs + local Control Room reports + any manually requested GitHub runner status.
Orient: Sekret-Bip Control Room classifies evidence.
Decide: Founder Control Room picks HOLD / REVIEW / APPROVE.
Act: adjust code, Cloudflare config, or GitHub Actions only from real evidence.
```
