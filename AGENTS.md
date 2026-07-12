# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

> **Before making any claim about current PR, deployment, migration, or backend state, read `SPRINT.md` at the repo root and verify it using `.agents/skills/bip-repo-truth/SKILL.md`.**

## Global founder stack

Read [`GLOBAL_AI.md`](./GLOBAL_AI.md) before nontrivial work and preserve this exact sequence:

```text
/garyvee lindymode redteam l99 redteam ooda
```

The first redteam attacks the product premise and evidence. The second attacks the selected implementation, blast radius, rollback, and proof. Do not collapse them into one pass.

Provider boundaries and handoffs are documented in [`docs/PROVIDERS.md`](./docs/PROVIDERS.md). Project-local rules below may be stricter; they may not weaken privacy, security, evidence, approval, provenance, rollback, or truthfulness.

## OODA Workflow

Every agent must follow OODA before chang