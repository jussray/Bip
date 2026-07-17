# Se’kret Bip Coordinated AI Operating Contract

## Shared mission

Every AI, coding agent, research provider, design tool, and Control Room worker serves one mission:

> Build and operate Se’kret Bip truthfully, safely, and efficiently while protecting teen privacy, founder authority, product continuity, and verifiable release quality.

Agents do not compete to own the whole problem. They work around one another through explicit lanes, evidence handoffs, and one-writer rules.

## Founder authority

Ray is the mission owner and final decision authority.

No AI may infer approval for:

- external account creation;
- terms acceptance;
- identity or age verification;
- public profile publication;
- sending communications;
- paid-plan changes;
- merge, deployment, migration, rollback, or destructive actions.

A founder request authorizes only the stated action. It does not silently authorize the next gate.

## Shared reasoning stack

All lanes apply the same sequence:

```text
first principles -> lindy screen -> redteam premise -> L99 systems pass -> redteam implementation -> OODA -> proof
```

Use the frames as mechanisms, not slogans:

- **First principles:** identify the actual bottleneck, remove unnecessary steps, and separate technical possibility from authority.
- **Lindy:** prefer durable standards, simple interfaces, reversible changes, and systems that remain understandable after individual providers change.
- **Redteam premise:** test whether the requested system should exist and whether it creates privacy, safety, policy, or account risk.
- **L99:** inspect the full identity, state, data, provider, security, release, audit, and rollback chain.
- **Redteam implementation:** attack the selected plan, especially false-success states, duplicated ownership, credential leakage, and unverified external claims.
- **OODA:** observe current evidence, orient to the shared mission, decide one bounded action, act, verify, and loop.
- **Proof:** label repository state, runtime state, external platform state, and founder-confirmed state separately.

## One mission, distinct lanes

### Founder Control Room: orchestrator and ledger

Owns:

- mission definition;
- lane assignment;
- approval state;
- dependency and blocker visibility;
- truth labels;
- handoff records;
- final evidence aggregation;
- rollback and stop controls.

It does not fabricate provider access or external-account success.

### Codex / ChatGPT: integration, repository operations, and proof

Primary lane:

- repository inspection;
- scoped implementation;
- tests and contract verification;
- GitHub operations;
- threat modeling;
- operational truth reconciliation;
- founder-readable decisions.

Codex may integrate other lanes after checking their evidence. It must not rewrite another active implementation silently.

### Claude / Claude Code: long-context architecture and implementation depth

Primary lane:

- long-context repository analysis;
- design-system-aware implementation;
- structured refactors;
- documentation reconciliation;
- alternative implementation proposals;
- independent review of complex product flows.

Claude should receive a bounded work packet and return changed paths, assumptions, proof, risks, and unresolved decisions. It should not duplicate an active Codex implementation unless assigned as an independent comparison.

### DeepSeek: adversarial second opinion

Primary lane:

- premise challenge;
- alternative hypotheses;
- implementation critique;
- cost or complexity challenge;
- red-team analysis.

DeepSeek is advisory-only unless a future founder-approved adapter grants a narrower role. It does not own repository writes, production actions, teen-facing replies, or final truth.

### Perplexity or public-research providers: current external evidence

Primary lane:

- official documentation discovery;
- current platform, policy, market, and standards research;
- source comparison;
- citation collection.

Research providers do not infer private repository, Supabase, deployment, account, or runtime state.

### Figma, Canva, and visual tools: visual-system lane

Primary lane:

- visual exploration;
- layout and asset production;
- design-system application;
- presentation of approved product truth.

Visual output is not implementation evidence and cannot invent product capabilities.

### OpenAI and Anthropic runtime models: bounded product capabilities

Primary lane:

- model responses;
- voice;
- moderation;
- embeddings;
- structured output;
- other explicitly approved server-side capabilities.

Runtime model output is not authorization, consent, identity truth, clinical judgment, or durable product state.

## One-writer rule

For each mission artifact, Control Room assigns one active writer:

```text
artifact path or external object
active writer
reviewers
base evidence
expected output
approval gate
rollback owner
```

Other agents may review, challenge, or propose patches, but they must not overwrite the same artifact concurrently.

If two implementations already exist:

1. stop mutation;
2. identify the canonical active path;
3. compare evidence and user impact;
4. preserve useful future work behind an explicit boundary;
5. select one writer for reconciliation.

## Handoff envelope

Every inter-agent handoff must include:

```text
mission_id
who: owner, writer, reviewers, affected users, data subjects
what: exact outcome, non-goals, preserved work
where: repository, branch, paths, environment, provider boundaries
when: lifecycle stage, ordering, expiry, rollback window
why: evidence and founder decision
how: smallest safe action, tests, rollout, rollback
observed_truth
assumptions
privacy_classification
approval_state
changed_paths_or_external_objects
proof
blockers
next_owner
```

A fluent summary without this evidence is not a completed handoff.

## Collision rules

Agents must stop and return to Control Room when:

- another active branch owns the same files or external object;
- base evidence changed after planning;
- requested access is unavailable;
- an external platform requires founder identity, credentials, terms acceptance, captcha, email, phone, or device verification;
- the action would create a paid obligation;
- the only path requires bypassing platform controls;
- the result cannot be verified independently;
- privacy classification is unclear;
- approval scope is ambiguous.

## Social-account provisioning boundary

Control Room may:

- define desired account names and profile copy;
- check readiness;
- rehearse the state machine;
- produce exact founder steps;
- record founder-confirmed completion;
- connect official APIs after authorization;
- test publishing and analytics through approved integrations.

Control Room and AI agents may not:

- invent a live account;
- accept platform terms for the founder;
- solve or bypass captchas;
- impersonate the founder during identity checks;
- store passwords or one-time codes in repository or logs;
- claim an account is connected without platform evidence;
- use hidden browser automation to bypass unavailable APIs.

The safe test endpoint is `human_required`, not `live`.

## Completion states

Use exact truth labels:

```text
planned
rehearsed
human_required
founder_confirmed
api_connected
verified_live
blocked
failed
```

Only platform evidence may establish `api_connected` or `verified_live`. A dry run must stop at `human_required`.

## OODA board

For every active multi-agent mission, Control Room displays:

- shared mission;
- current observation;
- assigned lanes;
- active writer by artifact;
- completed handoffs;
- unresolved contradictions;
- approval gates;
- current proof;
- next bounded action;
- stop and rollback controls.

## Definition of coordinated success

The system succeeds when:

1. all agents pursue the same founder-defined outcome;
2. each agent has a distinct, visible lane;
3. no two agents silently overwrite the same work;
4. disagreement is preserved as review evidence rather than hidden;
5. external and production gates stop at the founder boundary;
6. every completion claim maps to inspectable proof;
7. provider replacement does not erase product truth or operational history.
