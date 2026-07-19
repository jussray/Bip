# Se'kret Bip — Documentation Map

**Last reviewed:** 2026-07-16  
**Owner issue:** [#456](https://github.com/jussray/Sekret-Bip/issues/456)

This file explains which documents are authoritative, what each one owns, and how stale planning material must be handled.

## Read these first

| Question | Canonical source |
|---|---|
| What is implemented, verified, or released? | `implementation-ledger.json` plus validated extensions |
| What are we doing right now? | `SPRINT.md` |
| How do we get from here to launch? | `docs/LAUNCH_ROADMAP.md` |
| What exists today in human language? | `docs/CURRENT_STATUS.md` |
| How are frontend, Supabase, Worker, and deployment wired? | `docs/WIRING_STATUS.md` |
| How does production release work? | `DEPLOYMENT.md` |
| What blocks legal and operational launch? | `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md` |
| What authorization proof exists? | `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md` and security evidence files |

## Authority levels

### Level 1 — live operating truth

These files may direct current implementation and release decisions:

- `implementation-ledger.json`
- `implementation-ledger.extensions/*.json`
- `SPRINT.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/CURRENT_STATUS.md`
- `docs/WIRING_STATUS.md`
- `DEPLOYMENT.md`
- `.control-room/repository.manifest.json`

When these disagree, stop and reconcile them against code, live Supabase, Cloudflare, tests, and the exact deployed SHA. Do not choose the most convenient statement.

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

- `docs/strategy/`
- `docs/industry-signals/`
- design explorations and handoff concepts;
- future feature proposals;
- archived sprint notes and historical audits.

A Level 4 idea becomes active work only after founder approval, dependency review, privacy and safety review, issue ownership, and reconciliation with the launch roadmap and ledger.

## Document roles

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

Human-readable snapshot of the current product. It summarizes the ledger and production truth without duplicating every test result.

### `implementation-ledger.json`

Machine-checked feature state. It owns status words such as `planned`, `contract`, `integrated`, `verified`, and `released`, plus contract, runtime, test, telemetry, rollout, verification, and rollback evidence.

## Stale-document policy

A planning or audit file that is no longer current must do one of three things:

1. **Update** — reconcile it with current truth and retain its role.
2. **Archive** — add a top-of-file banner:

   > Historical snapshot. Do not use this file as current implementation, roadmap, security, or deployment truth. See `docs/DOCUMENTATION_MAP.md`.

3. **Remove** — only when the file is truly obsolete, unsafe, secret-bearing, misleading beyond repair, or has no preservation value.

Do not leave an old sprint or roadmap looking current. A stale date in small text is not an adequate warning.

## Naming rules

- Use `CURRENT`, `LAUNCH`, or `ROADMAP` only for canonical active documents.
- Historical files should include `HISTORICAL`, `ARCHIVED`, or a clear dated snapshot in the title.
- Avoid parallel files named `ROADMAP_NEW`, `FINAL_ROADMAP`, `SPRINT_LATEST`, or `STATUS_REAL`. Those names are how documentation develops trust issues.
- One topic should have one canonical active owner document, with supporting detail linked beneath it.

## Update protocol

When a PR changes product scope, architecture, release state, or launch sequence:

1. verify the actual repository and runtime state;
2. update the ledger or add a validated extension;
3. update only the canonical documents whose ownership changed;
4. label preserved historical material clearly;
5. run implementation-evidence and documentation contract tests;
6. merge only after the documentation describes the tested content rather than the hoped-for future.

## Privacy boundary

Documentation, screenshots, issue bodies, CI artifacts, roadmaps, and Control Room records must not contain raw teen journal text, private messages, voice transcripts, safety evidence, names, emails, tokens, secrets, or broad database exports.
