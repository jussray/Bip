# bip-current-state

## Trigger

Use at the start and end of every working session, and before making claims
about current PR, deploy, migration, backend, or release state.

## Source of Current State

Read `/SPRINT.md`.

`SPRINT.md` is a cache of recently verified state, not unquestionable truth.
Verify material claims using:
`.agents/skills/bip-repo-truth/SKILL.md`

## Required Sequence

1. Read `SPRINT.md`
2. Run the relevant repo-truth verification
3. Compare recorded state with verified state
4. Work only from the verified result
5. Update `SPRINT.md` if the state changed

## Update Rules

Read and verify `SPRINT.md` at the start of each working session.
Update it only after verification when the recorded state has changed,
and again before ending a session that changed repository, deployment,
or database state.

Update `SPRINT.md` when:
- a PR opens, closes, changes status, or merges
- CI blockers appear or resolve
- deployment ownership, target, or health changes
- Supabase migrations or Edge Functions change
- the next committed task changes

Do not write guesses, planned architecture, secrets, API keys, personal data,
or unverified deployment claims into `SPRINT.md`.

## Hard Rails

- Never commit directly to `main`
- Keep PR scope isolated
- Do not edit Worker configuration from unrelated PRs
- Do not modify companion asset or continuity tests unless their contracts change
- Do not add runtime, screen, or database work to tooling-only PRs

## Output

State:
`Verified current state as of <timestamp>: <summary>`

If `SPRINT.md` disagrees with verified state, update it in the current scoped PR
or record the mismatch explicitly.
