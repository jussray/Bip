# Se'kret Bip — Issue Authority

**Last reviewed:** 2026-07-17

This document prevents duplicate trackers from splitting implementation evidence. The most detailed evidence-backed issue owns the work. Shorter template duplicates should close with a link to the canonical tracker.

## Canonical trust trackers

| Trust area | Canonical issue | Duplicate closed |
|---|---:|---:|
| Consent and onboarding disclosures | #413 | #422 |
| Persistent crisis-support surface | #414 | #423 |
| Safety-trigger detection and supportive response | #415 | #424 |

The canonical issues remain open until their own acceptance criteria and production or journey evidence are satisfied. Closing a duplicate does not mark the underlying trust work complete.

## Completed implementation trackers

| Capability | Completed issue | Evidence |
|---|---:|---|
| Playwright as a Control Room capability and mission | #301 | PR #436 merged; allowlisted mission, truthful browser/fallback reports, tests, and exact-head workflows |
| Retained Cloudflare exact-release failure evidence | #441 | PR #445 merged; evidence written before and during polling, classified blockers, terminal snapshots, and passing exact-head workflows |

## Operating rule

Before opening a new issue:

1. Search existing open and recently closed issues for the same outcome.
2. Prefer extending the issue with the strongest acceptance criteria and evidence model.
3. Close true duplicates with GitHub's `duplicate` reason and a comment pointing to the canonical issue.
4. Close implementation issues as `completed` only when the required code, tests, and declared evidence gates exist.
5. Do not treat duplicate cleanup as product completion.
