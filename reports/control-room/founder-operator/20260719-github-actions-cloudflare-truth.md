# GitHub Actions -> Cloudflare Truth Handoff

## Decision

Move GitHub Actions from the project brain into a lightweight runner-sensor role. Use Cloudflare build/deploy logs as the practical deployment truth signal. Route interpretation through Sekret-Bip Control Room and final review through Founder Control Room.

## Current model

```text
GitHub Actions = lightweight sensor
Cloudflare = deployment truth
Sekret-Bip Control Room = evidence classifier
Founder Control Room = exact-SHA review record
```

## Why

GitHub-hosted runner failures with zero steps and no logs only prove that Actions did not execute. They do not prove a code regression. Running many overlapping workflows made that noise worse.

## What changed in PR #537

- `ci.yml` now performs a small Control Room handoff instead of duplicating the full local test/build brain.
- `playwright.yml` is manual Control Room browser evidence instead of an automatic PR runner.
- Quality Gate remains reusable/manual for explicit founder or Control Room decisions.
- Archived pre-push, typecheck, regression, and implementation-evidence workflows remain available but do not auto-trigger.
- A policy verifier now protects this split from drifting back into runner fan-out.

## Operating rule

If GitHub Actions shows zero steps or no logs, classify it as `runner_startup_failure` and look to Cloudflare logs plus Control Room evidence next.

If Cloudflare provides real build/deploy logs, act on those logs first.

If Cloudflare passes, that improves deployment confidence and becomes part of the Founder Control Room exact-SHA review record.

## Review record

This report records evidence for Founder Control Room review.
