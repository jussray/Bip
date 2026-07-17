# Se'kret Bip — Issue Authority

**Last reviewed:** 2026-07-17

This document prevents duplicate trackers from splitting implementation evidence. The most detailed evidence-backed issue owns the work. Shorter template duplicates should close with a link to the canonical tracker.

## Canonical Trust chain

The `Trust-01` through `Trust-09` identifiers are reserved for issues #412–#420. Supporting work must use descriptive titles rather than reusing those Trust numbers.

| Trust area | Canonical issue | Duplicate or legacy tracker |
|---|---:|---:|
| Privacy inventory and data map | #412 | #421 closed previously; its closure does not complete #412 |
| Consent and onboarding disclosures | #413 | #422 closed as duplicate |
| Persistent crisis-support surface | #414 | #423 closed as duplicate |
| Safety-trigger detection and supportive response | #415 | #424 closed as duplicate |
| Bridge consent integrity and parent boundary | #416 | #248 closed as a legacy duplicate; deployed proof remains #270 |
| Complete and verifiable account deletion | #417 | #282 closed as a legacy duplicate; #426 remains open for export and settings controls |
| COPPA, GDPR, age policy, and jurisdiction posture | #418 | #427 closed as duplicate; parent disclosures remain in #413 and parent visibility remains in #416 |
| AI companion boundary hardening | #419 | #428 remains open as separate accessibility and store-quality work |
| App Store and Google Play submission readiness | #420 | #429 remains open as the supporting claims-and-copy audit |

The canonical issues remain open until their own acceptance criteria and production, device, legal, policy, or journey evidence are satisfied. Closing or renaming another tracker does not mark the underlying Trust work complete.

## Launch-program hierarchy

| Issue | Authority | Status relationship |
|---:|---|---|
| #259 | Canonical teen + parent V1 launch program | Owns the end-to-end launch loop and definition of V1 complete |
| #238 | Long-horizon relationship-layer roadmap | Owns phased post-V1 Translation, Crew, Scrapbook, and persistent-memory outcomes; it is not a substitute for launch proof |
| #283 | Legacy parent-parity umbrella | Closed as duplicate because its active scope is distributed across #259, #323, #270, #271, #413, #416, #417, #426, and #428 |
| #323 | Parent-first onboarding without a teen code | Remains open for a useful unlinked-parent dashboard, supported link initiation, multiple-child scope, and end-to-end proof |
| #402 | Unified frontend-to-Worker contract verification and release | Remains open because PR #398 proved integration, not the complete production/failure-state/telemetry matrix |

Closing #283 does not claim that the parent experience is complete. It removes a competing umbrella while retaining every material requirement in the canonical launch, Trust, device-quality, onboarding, relationship, and deletion trackers.

## Supporting launch trackers

| Issue | Owned outcome | Relationship to canonical work |
|---:|---|---|
| #270 | Controlled two-account Bridge production proof | Exact deployed-SHA journey evidence for #416, #417, and launch readiness |
| #271 | Relationship-settings status, unlink, retry, and device-state UI | Focused UI work supporting #416 and #270; deletion remains #417/#426 |
| #399 | Anonymous-session RLS and exposed `SECURITY DEFINER` RPC release gate | Cross-cutting security evidence used by multiple Trust issues |
| #425 | Auth, session, endpoint, logging, device-access, threat-model, and dependency hardening | Supporting security checklist; canonical Trust-05 remains #416 |
| #426 | User-facing data export and deletion controls | Supports #417 but retains export scope not fully owned by #417 |
| #428 | Accessibility and store-quality sweep | Separate QA gate; canonical Trust-08 remains #419 |
| #429 | Claims and copy audit | Supporting evidence for #420; canonical Trust-09 remains #420 |
| #430 | Incident and breach response plan | Distinct launch-operations gate |
| #451 | Explicit onboarding action wired to the atomic consent service | Focused implementation gate under #413 |

## Superseded pull requests

| PR | Resolution | Preserved work |
|---:|---|---|
| #408 | Closed without merge as a stale mixed branch | Playwright work is superseded by merged PR #436; relationship-status UI remains open in #271 and must be rebuilt from current `main` |

A closed unmerged PR is not implementation evidence. Any useful patch must be re-extracted onto current `main`, reviewed, and verified through the normal exact-head gates.

## Completed implementation trackers

| Capability | Completed issue | Evidence |
|---|---:|---|
| Playwright as a Control Room capability and mission | #301 | PR #436 merged; allowlisted mission, truthful browser/fallback reports, tests, and exact-head workflows |
| Retained Cloudflare exact-release failure evidence | #441 | PR #445 merged; evidence written before and during polling, classified blockers, terminal snapshots, and passing exact-head workflows |

## Operating rule

Before opening a new issue:

1. Search existing open and recently closed issues for the same outcome.
2. Prefer extending the issue with the strongest acceptance criteria and evidence model.
3. Reserve `Trust-01` through `Trust-09` for #412–#420.
4. Use descriptive titles for supporting security, privacy, accessibility, copy, and operations work.
5. Close true duplicates with GitHub's `duplicate` reason and a comment pointing to every canonical owner needed to preserve scope.
6. Close implementation issues as `completed` only when the required code, tests, and declared evidence gates exist.
7. Close stale mixed PRs without merge; re-extract unique work into a focused branch from current `main`.
8. Do not treat duplicate cleanup, title normalization, or PR closure as product completion.
