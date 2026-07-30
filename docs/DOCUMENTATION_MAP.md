# Se'kret Bip — Documentation Map

**Last reviewed:** 2026-07-29  
**Owner issue:** [#456](https://github.com/jussray/Sekret-Bip/issues/456)

This file explains which documents are authoritative, what each one owns, and how stale planning material must be handled.

## Current launch-status overlay

Read `docs/LAUNCH_GATE_STATUS_2026-07-29.md` first when the work concerns the current repository, release, deployment, or launch decision. It records the reviewed `main` ref and the live Pages marker blocker in [#696](https://github.com/jussray/Sekret-Bip/issues/696).

## Read these first

| Question | Canonical source |
|---|---|
| What is implemented, verified, or released? | `implementation-ledger.json` plus validated extensions |
| What repository and evidence model should an agent use today? | `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md` |
| What are we doing right now? | `SPRINT.md` plus `docs/LAUNCH_GATE_STATUS_2026-07-29.md` |
| How do we get from here to launch? | `docs/LAUNCH_ROADMAP.md` |
| What exists today in human language? | `docs/CURRENT_STATUS.md` |
| How are frontend, onboarding, Supabase, Worker, and deployment wired? | `docs/WIRING_STATUS.md` |
| What is the current release-gate state? | `docs/LAUNCH_GATE_STATUS_2026-07-29.md` and `DEPLOYMENT.md` |
| What blocks legal and operational launch? | `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md` |
| What authorization proof exists? | `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md` and security evidence files |

## Authority levels

### Level 0 — inspected external truth

These are not repository files, but they can override stale repository claims when inspected correctly:

- current GitHub branch, PR, commit, checks, jobs, and logs;
- live Supabase migrations, catalog, grants, policies, and rollback-contained probes;
- Cloudflare Pages and Worker build/deployment records;
- deployed `/.well-known/sekret-release.json` and health witnesses;
- production Playwright;
- physical-device and real-account journey evidence.

Every Level 0 claim must name the exact repository, SHA, environment, time window, and witness type. A result from one system does not silently prove another.

### Level 1 — live operating truth

The 2026-07-29 launch-status overlay is the current-state authority for the reviewed ref. Older retained status and roadmap detail is historical context unless it agrees with that overlay and Level 0 witnesses.

These files may direct current implementation and release decisions:

- `implementation-ledger.json`
- `implementation-ledger.extensions/*.json`
- `docs/LAUNCH_GATE_STATUS_2026-07-29.md`
- `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`
- `SPRINT.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/CURRENT_STATUS.md`
- `docs/WIRING_STATUS.md`
- `DEPLOYMENT.md`
- `.control-room/repository.manifest.json`

When these disagree, stop and reconcile them against Level 0 evidence. Do not choose the most convenient statement.

### Level 2 — architecture and product contracts

These define durable boundaries but do not prove current runtime state by themselves:

- `docs/ARCHITECTURE.md`
- `docs/AGENT_L4_ARCHITECTURE.md`
- `docs/RELATIONSHIP_LAYER_ARCHITECTURE.md`
- `docs/RELATIONSHIP_LAYER_RELEASE_GATES.md`
- `docs/CONTROL_ROOM_ARCHITECTURE.md`
- `docs/DAILY_INTENTIONS_PRIVACY_CONTRACT.md`
- `docs/legal/*`
- `docs/security/*`
- `GLOBAL_AI.md`, `AGENTS.md`, `CLAUDE.md`, and provider instructions

Architecture documents describe what must be true. The ledger and evidence determine whether it is true now.

### Level 3 — runbooks, audits, and evidence

These explain how a claim was tested or how an operation should be performed:

- deployment and rollback runbooks;
- RLS audits and denial probes;
- Bridge connection and journey audits;
- Playwright, Maestro, device, and accessibility evidence;
- security JSON evidence;
- production receipts and retained CI artifacts.

Evidence is valid only for the commit, environment, accounts, and time window it actually observed.

### Level 4 — strategy, research, and future options

These inform decisions but do not authorize work or change implementation status:

- `docs/strategy/`;
- `docs/industry-signals/`;
- design explorations and handoff concepts;
- future feature proposals;
- archived sprint notes and historical audits.

A Level 4 idea becomes active work only after founder approval, dependency review, privacy and safety review, issue ownership, and reconciliation with the launch roadmap and ledger.

## Document roles

### `docs/LAUNCH_GATE_STATUS_2026-07-29.md`

Current launch-status overlay. It owns the reviewed repository ref, open P0 release gate, current PR classification, and the explicit distinction between repository, deployment, browser, and device evidence.

### `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`

Current agent-orientation overlay. The filename preserves the original July 20 reset, while the document header records the latest refresh date.

It owns:

- current reviewed repository baseline;
- material merges and open repair candidates;
- stale mental models that must not be repeated;
- evidence-separation rules;
- the immediate proof loop.

It does not convert a draft PR body into merged truth or a local test report into hosted proof.

### `SPRINT.md`

Volatile execution handoff. It should contain only:

- the verified baseline;
- current sprint outcome;
- workstreams in progress;
- immediate execution order;
- explicit non-goals;
- definition of done;
- blockers and owners.

It should not become a permanent encyclopedia of every feature ever discussed.

### `docs/LAUNCH_ROADMAP.md`

Stable phase and dependency map. It owns:

- launch sequence;
- launch-critical versus non-critical work;
- phase exit evidence;
- controlled-alpha and launch-clearance gates;
- future lanes that must not quietly enter launch scope.

It does not promise dates without known capacity and evidence owners.

### `docs/CURRENT_STATUS.md`

Human-readable snapshot of the current product. It summarizes the ledger and current evidence without duplicating every test result.

It must clearly separate merged code, exact-head proof, merge-SHA proof, deployment evidence, live Supabase evidence, production-browser evidence, and device proof.

### `docs/WIRING_STATUS.md`

Human-readable map of active routes, services, tables, Worker paths, compatibility boundaries, and known wiring gaps.

A path appearing in code is not enough to call it reliable. The active import path, schema, tests, and runtime witness must agree.

### `implementation-ledger.json`

Machine-checked feature state. It owns status words such as `planned`, `contract`, `integrated`, `verified`, and `released`, plus contract, runtime, test, telemetry, rollout, verification, and rollback evidence.

## Stale-document policy

A planning, audit, agent, or status file that is no longer current must do one of three things:

1. **Update** — reconcile it with current truth and retain its role.
2. **Archive** — add a top-of-file banner:

   > Historical snapshot. Do not use this file as current implementation, roadmap, security, or deployment truth. See `docs/DOCUMENTATION_MAP.md`.

3. **Remove** — only when the file is truly obsolete, unsafe, secret-bearing, misleading beyond repair, or has no preservation value.

Do not leave an old sprint, PR snapshot, or roadmap looking current. A stale date in small text is not an adequate warning.

## Claim freshness rules

- A PR body is the author's proposed scope and self-reported evidence, not independent proof.
- A merged PR is repository history, not automatic production proof.
- A GitHub workflow must have jobs, executed steps, and the exact intended SHA to count as check evidence.
- A Cloudflare deployment badge proves only the named build or deployment.
- A live Supabase claim requires the intended project and current catalog or probe evidence.
- A screenshot or design file proves appearance, not auth, data, privacy, deployment, or device behavior.
- An email or prior chat summary must be rechecked before it is copied into a current-status document.

## Naming rules

- Use `CURRENT`, `LAUNCH`, or `ROADMAP` only for canonical active documents.
- Historical files should include `HISTORICAL`, `ARCHIVED`, or a clear dated snapshot in the title.
- Avoid parallel files named `ROADMAP_NEW`, `FINAL_ROADMAP`, `SPRINT_LATEST`, or `STATUS_REAL`.
- One topic should have one canonical active owner document, with supporting detail linked beneath it.
- Use Suhana and Sy as canonical display/canon names while preserving `raylene` and `rylane` only where compatibility requires the legacy identifiers.

## Update protocol

When a PR changes product scope, architecture, release state, wiring, or launch sequence:

1. inspect the actual repository and relevant external witnesses;
2. update the ledger or add a validated extension when feature state changed;
3. update only the canonical documents whose ownership changed;
4. label preserved historical material clearly;
5. keep local, exact-head, merge-SHA, deployment, live-data, browser, and device evidence separate;
6. run implementation-evidence and documentation contract tests;
7. merge only after the documentation describes the tested content rather than the hoped-for future.

## Privacy boundary

Documentation, screenshots, issue bodies, CI artifacts, roadmaps, and Control Room records must not contain raw teen journal text, private messages, voice transcripts, safety evidence, names, emails, tokens, secrets, or broad database exports.
