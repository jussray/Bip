# Se'kret Bip — Issue Closure Log

This log records issue-hygiene decisions that affect repository authority. It is not a feature-status ledger and does not replace `implementation-ledger.json`, `SPRINT.md`, or `docs/CURRENT_STATUS.md`.

## 2026-07-17

### Closed as completed

- **#301 — Add Playwright as a Control Room capability and mission**
  - Implementation merged through PR #436.
  - The existing Control Room owns the allowlisted `verify-frontend` mission.
  - Reports distinguish real browser proof from non-browser fallback evidence.
  - Required exact-head workflows passed.

- **#441 — Cloudflare: retain exact-release evidence on failed verification**
  - Implementation merged through PR #445.
  - The verifier writes evidence before polling and refreshes it on every observation.
  - Worker and Pages blockers are machine-classified.
  - Failure and timeout snapshots are retained before the verifier exits.
  - Required exact-head workflows passed.

### Closed as duplicates

- **#248** → **#416** for Bridge consent/privacy behavior, **#270** for controlled deployed proof, **#399** for authorization evidence, and **#417** for deletion cleanup.
- **#282** → canonical **#417** for complete deletion and live proof; **#426** retains user-facing export and deletion-controls scope.
- **#422** → canonical **#413** for consent and onboarding disclosures.
- **#423** → canonical **#414** for persistent crisis-support surfaces.
- **#424** → canonical **#415** for tiered safety-trigger responses in journal and companion paths.
- **#427** → canonical **#418** for age, COPPA/GDPR, jurisdiction, and store-rating decisions; **#413** retains parent onboarding disclosures and **#416** retains parent visibility and Bridge privacy boundaries.

Closing #248 or #282 does not mark Bridge or deletion complete. Their unresolved production, journey, authorization, cleanup, and isolation evidence remains in the canonical issues.

### Kept open and normalized

These issues contained unique launch requirements and were not legitimately closable. Their titles or authority scopes were changed to remove ambiguity:

- **#270 — Bridge: controlled two-account production proof**
  - Remains open for exact deployed-SHA link, selected-source generation, summary-only parent visibility, raw-source denial, revoke, fresh re-share, unlink, deletion, isolation, and cleanup evidence.
  - The retired token-based deployment blocker is no longer the authority; Cloudflare native Git and exact-release observation are current.
- **#271 — Relationship settings: link status, unlink, and retry states**
  - Remains open for status-aware teen/parent settings, offline/server differentiation, retry, valid-state unlink controls, physical-device QA, and two-account UI proof.
  - Deletion completeness remains #417; export and deletion controls remain #426.
- **#425 — Security: auth, session, endpoint, and device-access hardening**
  - Remains open for TLS, token lifecycle, plaintext-log prevention, device lock, threat modeling, and dependency review.
  - #399 separately owns the live RLS and exposed-RPC security gate.
- **#426 — Privacy: user data export and deletion controls**
  - Remains open because user-facing export is not fully owned by canonical deletion issue #417.
- **#428 — Accessibility and store-quality sweep**
  - Remains open as a distinct device and accessibility QA gate.
- **#429 — Claims and copy audit**
  - Remains open as supporting evidence for canonical submission tracker #420.
- **#430 — Operations: incident and breach response plan**
  - Remains open for runbook ownership, containment, notification, audit evidence, and tabletop proof.

### Closed pull requests without merge

- **PR #408 — Add Playwright as a Control Room capability (#301)**
  - Closed as a stale mixed branch.
  - Its Playwright scope is superseded by merged PR #436.
  - Its unmerged relationship-status prototype remains tracked by #271 and must be rebuilt on current `main`.
  - Its auth-redirect tests require reassessment against current routing before reuse.

The canonical Trust and launch issues remain open. Their launch-critical acceptance criteria, physical/runtime evidence, policy review, and safety proof are not satisfied merely because duplicate trackers or stale branches were removed.

## Closure standard

Use `completed` only when the issue's declared implementation and verification criteria are met. Use `duplicate` only when another issue clearly owns the same outcome with equal or stronger scope. Preserve links to merged PRs, test evidence, production witnesses, or every canonical issue required to retain the original scope in the closure comment. Close stale PRs without merge when their base is obsolete or their concerns are mixed; preserve unique work in a focused current-main tracker.
