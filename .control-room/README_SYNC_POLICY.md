# Founder Control Room README Sync Policy

## Purpose

Founder Control Room owns the operational decision about whether a repository change must update `README.md`.

The README is not a changelog, but it must stay aligned with current product truth, setup, validation, release posture, major incident state, and authoritative operating documents.

## Required decision

Every nontrivial incident, fix, merge, deployment change, migration change, validation change, or authority change must record one README impact value:

```text
required
not_required
deferred_with_reason
```

### `required`

Use when the change alters any of the following:

- user-visible product behavior or recovery;
- setup, environment, or deployment instructions;
- validation commands or evidence boundaries;
- launch posture, blockers, or current implementation claims;
- canonical documents, ownership, or operational authority;
- a major production incident whose status materially changes repository truth.

Update `README.md` in the same pull request whenever practical.

### `not_required`

Use only when the README remains fully accurate and the pull request explains why.

### `deferred_with_reason`

Use only when another active pull request owns the README edit. Record the owner, linked pull request, and deadline. An unowned deferral is invalid.

## Incident handling

Founder Control Room is the first evidence surface for production incidents and GitHub Actions failures.

- Zero-step, no-log workflow failures remain classified as `runner_startup_failure` infrastructure evidence unless later evidence changes the classification.
- Infrastructure failure must not be rewritten as a code regression.
- README language must separate merged code evidence, local verification, hosted verification, deployment, and live production proof.
- Incident records remain open until their explicit verification gate is satisfied, even when a code fix is merged.

## Completion gate

Before a pull request is merged, the active agent must:

1. classify README impact;
2. update `README.md` when the classification is `required`;
3. link the Founder Control Room issue or retained evidence;
4. state what is verified and what remains blocked;
5. avoid claiming deployment or live proof from a merge alone.

Founder Control Room may generate or request the README patch, but the final diff must still be reviewed like any other repository change.
