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
- **#283** → canonical **#259** for the teen + parent V1 program; **#323** retains parent-first onboarding, **#270/#271** retain deployed journey and relationship-settings proof, and **#413/#416/#417/#426/#428** retain consent, privacy, deletion, export, accessibility, and device-quality requirements.
- **#422** → canonical **#413** for consent and onboarding disclosures.
- **#423** → canonical **#414** for persistent crisis-support surfaces.
- **#424** → canonical **#415** for tiered safety-trigger responses in journal and companion paths.
- **#427** → canonical **#418** for age, COPPA/GDPR, jurisdiction, and store-rating decisions; **#413** retains parent onboarding disclosures and **#416** retains parent visibility and Bridge privacy boundaries.

Closing #248, #282, or #283 does not mark Bridge, deletion, parent parity, or launch readiness complete. Their unresolved production, journey, authorization, cleanup, isolation, onboarding, accessibility, and device evidence remains in the canonical issues.

### Kept open and normalized

These issues contained unique launch requirements and were not legitimately closable. Their titles or authority scopes were changed or clarified to remove ambiguity:

- **#259 — OODA: preservation-first path to polished teen + parent V1**
  - Remains the canonical launch program and owns the complete teen/parent product loop and V1 definition of done.
- **#323 — Allow parent-first onboarding without a teen code**
  - Remains open for a useful unlinked-parent dashboard, supported parent-first and teen-first link initiation, explicit handling of proposed QR/email/share-link channels, multiple-child scope, and isolation proof.
- **#344 — Supabase Auth configuration and performance hardening**
  - Renamed and narrowed from the original broad authorization campaign.
  - Retains leaked-password/Auth configuration and bounded performance-advisor work.
  - Historical Phase 0, config-table grant, Edge-retirement, and custom-auth test slices remain evidence but do not complete #399.
- **#357 — Productization: L4 persistence, observers, and live style evidence**
  - Renamed and rewritten around its unique remaining scope.
  - PR #358 completed the implementation-evidence gate and PR #360 completed repository-level style integration.
  - Remains open for live style evidence, privacy-reviewed L4 persistence after #399, and authoritative Control Room observers.
- **#399 — Supabase authorization release gate: RLS and SECURITY DEFINER RPCs**
  - Confirmed as the canonical live authorization gate.
  - Owns private-table and Storage policy review, anonymous-session and cross-user denial, elevated-RPC classification, rollback-contained role matrices, and fresh advisor evidence.
  - A fresh 2026-07-17 production advisor observation still reports broad unresolved finding classes, so closure is not justified.
- **#402 — Verify and release unified frontend-to-Worker contract spine**
  - Remains open because PR #398 established repository integration, not the full exact-production-release, user-visible failure-state, retry, telemetry, privacy, and rollback evidence matrix.
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

This security/productization pass closed no issue. Reducing overlap by clarifying authority was more accurate than forcing #344, #357, or #399 closed while each retains unique unfinished acceptance criteria.

The long-horizon relationship roadmap in #238 also remains open. Its phased Translation, Crew, Scrapbook, and persistent-memory scope is broader than the launch program and must not be collapsed into #259 or represented as V1-complete.

### Closed pull requests without merge

- **PR #408 — Add Playwright as a Control Room capability (#301)**
  - Closed as a stale mixed branch.
  - Its Playwright scope is superseded by merged PR #436.
  - Its unmerged relationship-status prototype remains tracked by #271 and must be rebuilt on current `main`.
  - Its auth-redirect tests require reassessment against current routing before reuse.

The canonical Trust and launch issues remain open. Their launch-critical acceptance criteria, physical/runtime evidence, policy review, and safety proof are not satisfied merely because duplicate trackers or stale branches were removed.

## Closure standard

Use `completed` only when the issue's declared implementation and verification criteria are met. Use `duplicate` only when another issue clearly owns the same outcome with equal or stronger scope. Preserve links to merged PRs, test evidence, production witnesses, or every canonical issue required to retain the original scope in the closure comment. Close stale PRs without merge when their base is obsolete or their concerns are mixed; preserve unique work in a focused current-main tracker. Normalize overlapping open issues when each retains unique unfinished work instead of forcing a misleading closure.
