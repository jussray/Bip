# Se'kret Bip — Current Sprint State

This file records volatile project state.
Read it at the start of each working session, then verify material claims using
`.agents/skills/bip-repo-truth/SKILL.md`.

Update this file only after verification:
- when a PR opens, changes status, or merges
- when deployment ownership or health changes
- when migrations or Edge Functions change
- when a blocker is discovered or resolved
- before ending a session that materially changed project, deployment, or database state

Do not place durable architecture or detailed implementation instructions here.

---

## Verification

**Last verified:** 2026-07-12
**Repository:** `jussray/Sekret-Bip`
**Default branch:** `main`

---

## Open PRs

### #339 — Companion Lab CI

- **Branch:** `companion-lab-ci`
- **Base:** `main`
- **State:** Open and mergeable, but blocked by failing checks
- **Purpose:** Add Companion Lab package scripts and path-filtered CI
- **Current head:** `0b08e059`

**Known blockers:**
- `scripts/companion-lab-audit.js` contains an invalid unescaped apostrophe in a string literal
- Workflow report captures stdout but not stderr (missing `2>&1`)
- Fake-memory scoring incorrectly penalises honest memory disclaimers mentioning "last week"
- Companion Lab Audit, CI, Quality Gate, Type Check, Pre-Push Checks, and Regression Tests are currently failing
- Only Playwright completed successfully in the latest recorded run

**Next action:** Repair the audit script and heuristic, capture stderr, then rerun all checks.

---

## Recently Merged

- #337 — Companion Lab foundation
- #338 — 40 Companion Lab reply fixtures covering 8 scenarios × 5 companions

Do not reimplement these changes.

---

## Supabase

- **Project:** Se'kret Bip
- **Status:** `ACTIVE_HEALTHY`
- **Region:** `us-east-1`
- **Latest recorded migration:** `20260711193738 guardian_review_queue`
- **Active Edge Functions:** 16
- **Schema drift:** Not certified by project health alone; verify before database work

---

## OpenAI / Worker

- OpenAI Platform organisation and project target are available
- Live Worker credential success is not certified by Platform availability alone
- Verify the actual Worker deployment and a live companion request before claiming the OpenAI path is healthy
- Do not change Worker naming or `wrangler.toml` in unrelated PRs

---

## Next Likely Work

1. Fix and complete PR #339
2. Merge only after required checks pass
3. Update this file immediately after merge
4. Select the next product or Companion Lab increment
