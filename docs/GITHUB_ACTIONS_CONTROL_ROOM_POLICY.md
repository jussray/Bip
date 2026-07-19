# GitHub Actions Control Room Policy

This policy keeps GitHub Actions useful without letting hosted-runner startup failures become the project brain.

## Source-of-truth split

```text
Cloudflare = deployment truth
Sekret-Bip Control Room = repo-local evidence
Founder Control Room = final authority
GitHub Actions = lightweight sensor
```

## Why this exists

When GitHub Actions jobs fail before any steps or logs exist, they did not validate or invalidate the code. Those runs are classified as `runner_startup_failure` and should not be treated as app regressions.

The fix is not to remove quality. The fix is to move interpretation into the Control Rooms and let Cloudflare's real build/deploy logs tell us what actually breaks in the deployment path.

## Automatic GitHub Actions

Automatic PR/push Actions should stay small while runner reliability is uncertain:

- confirm the runner can start
- verify this policy stays in place
- upload a tiny runner-sensor artifact
- hand off evidence interpretation to the Sekret-Bip Control Room

Automatic Actions should not duplicate every local test, browser test, implementation ledger check, pre-push check, and quality gate on every PR.

## Manual Control Room gates

The deeper GitHub-hosted checks still exist, but they run by explicit founder or Control Room decision:

- Quality Gate
- Playwright browser evidence
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

Cloudflare passing is still not a standalone merge approval. It guides diagnosis and confidence; Founder Control Room remains the merge authority.

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

## Founder Control Room gate

Founder Control Room decides `HOLD`, `REVIEW`, or `APPROVE`.

No merge should happen unless Founder Control Room explicitly green-lights the exact PR and exact head SHA.

## OODA rule

```text
Observe: GitHub runner status + Cloudflare logs.
Orient: Sekret-Bip Control Room classifies evidence.
Decide: Founder Control Room picks HOLD / REVIEW / APPROVE.
Act: adjust code, Cloudflare config, or GitHub Actions only from real evidence.
```
