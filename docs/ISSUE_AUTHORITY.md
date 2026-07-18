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

## Security and productization hierarchy

| Issue | Canonical authority | Scope boundary |
|---:|---|---|
| #399 | Supabase authorization release gate | Owns private-table and Storage policy review, anonymous-session and cross-user denial, authenticated `SECURITY DEFINER` RPC classification, role matrices, and fresh live advisor evidence |
| #344 | Supabase Auth configuration and performance hardening | Owns leaked-password configuration and bounded performance-advisor classification or remediation; it no longer competes with #399 |
| #357 | L4 persistence, evidence-backed observers, and live style evidence | Owns productization after authorization permits it; PR #358 completed the evidence gate and PR #360 completed repository-level style integration |
| #402 | Unified frontend-to-Worker release matrix | Owns shared Worker production, failure-state, retry, telemetry, privacy, and rollback evidence rather than a second verification path inside #357 |

All four issues remain open. This pass normalized authority rather than claiming completion. A fresh 2026-07-17 production advisor observation still leaves broad authorization findings under #399; #344 retains unique Auth/performance work, and #357 retains unique L4/observer/live-evidence work.

## Voice and concept-intake hierarchy

| Issue | Canonical active PR | Authority and current gate |
|---:|---:|---|
| #460 | #479 | Owns the privacy-safe voice telemetry contract and later environment proof. PR #465 is closed as its stale-base predecessor. No runtime consumes the tables and no migration application is authorized. |
| #464 | #478 | Owns the documentation-only voice/RLS/visual strategy intake. PR #466 is closed as its stale-base predecessor. The corrected content is byte-identical in #478. |
| #357 | — | Owns live style evidence, privacy-reviewed L4 persistence, and evidence-backed Control Room observers—not the telemetry schema contract or strategy intake. |
| #402 | — | Owns shared Worker production, unavailable-state, retry, telemetry, privacy, and rollback evidence. Repository integration does not prove live voice availability. |

Both #478 and #479 remain open because their exact-head GitHub jobs ended before receiving steps or logs. A `steps: null` runner-startup failure is not passing evidence, not a code diagnosis, and not authority to merge or apply a migration. Cloudflare branch previews also do not prove database application or realtime voice availability.

## Control Room and room-production hierarchy

| Active PR | Canonical authority | Relationship to retired work |
|---:|---|---|
| #476 | Coordinated multi-AI lanes and founder social-provisioning rehearsal | Owns `AGENTS.md`, `DeepSeek/deepseek-chat.md`, `docs/PROVIDERS.md`, one-writer coordination, handoffs, and the social lab. It preserves and extends the corresponding #468 boundaries. |
| #481 | Playwright living-room production engine | Current-main replacement for closed PR #446. All eight added files and the three modified-file patches were verified identical. Night's live actor/state runtime remains follow-up work. |
| #482 | Executable Founder Control Room mission core | Owns the authenticated loopback agent, mission UI, browser client, bounded output, and Playwright evidence integration extracted from #468. It is stacked on #481 and must not merge before its base. |
| #484 | Repository-wide 5W1H skill contracts and Prompt OS guidance | Owns the 18 skill files and `PromptOsPanel.tsx` that were not present in #476 or #482. The files are exact reviewed blobs extracted from #468 onto current `main`. |

PR #468 is closed without merge after a complete file-level partition: 3 files are owned by #476, 12 by #482, and 19 by #484, accounting for all 34 changed files. PR #446 is closed after #481 proved exact preservation. None of these closures merges the focused PRs, activates a provider adapter, authorizes external account creation, implements Night's runtime, or proves production Control Room behavior.

## Supporting launch trackers

| Issue | Owned outcome | Relationship to canonical work |
|---:|---|---|
| #270 | Controlled two-account Bridge production proof | Exact deployed-SHA journey evidence for #416, #417, and launch readiness |
| #271 | Relationship-settings status, unlink, retry, and device-state UI | Focused UI work supporting #416 and #270; deletion remains #417/#426 |
| #399 | Supabase authorization release gate | Cross-cutting authorization evidence used by multiple Trust and productization issues |
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
| #446 | Closed without merge as the stale-base room-engine branch | Current-main PR #481 preserves all eight added blobs and the exact `.gitignore`, package-script, and default Playwright-isolation patches |
| #465 | Closed without merge as a stale-base voice telemetry branch | Current-main PR #479 preserves all five files, the review-driven opaque-ID and payload-allowlist hardening, and stricter ledger criteria |
| #466 | Closed without merge as a stale-base strategy branch | Current-main PR #478 preserves both corrected documentation files byte-for-byte, including the repository-integrated/not-proven-live distinction |
| #468 | Closed without merge as a mixed Control Room/provider/skill branch | #476 owns coordinated AI/provider work, #482 owns the executable mission core, and #484 owns the 5W1H skill and Prompt OS residue; all 34 changed files are accounted for |

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
7. Close stale mixed or stale-base PRs without merge only after confirming a current-main replacement preserves all unique reviewed work.
8. For a decomposed mixed PR, account for every changed file and identify one focused owner before closure.
9. Treat zero-step or no-log workflow failures as infrastructure evidence, never as a pass or code diagnosis.
10. Normalize overlapping open issues when each retains unique unfinished scope; do not force a closure merely to reduce issue count.
11. Do not treat duplicate cleanup, title normalization, body clarification, PR closure, or preview deployment as product completion.
