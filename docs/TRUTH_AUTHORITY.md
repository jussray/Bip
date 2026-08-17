<!-- truth-mode: durable -->
# Se’kret Bip — Truth Authority Contract

This document defines how a claim earns, keeps, loses, and regains authority. It is intentionally durable: it does not store current SHAs, issue states, provider outcomes, or launch verdicts.

## Live truth boundary

Resolve volatile state from the system that owns it before making a current claim:

- repository branch, PR, issue state, checks, reviews, jobs, and logs → GitHub live read;
- Pages, Workers Builds, Access, routes, and deployment identity → Cloudflare live read or retained exact-run provider receipt;
- migrations, catalog, grants, policies, Auth, Storage, and runtime database state → the intended Supabase project;
- browser behavior → production Playwright against the exact deployed release;
- physical-device behavior → retained device evidence;
- real-account behavior → controlled account journey evidence.

Repository documents may explain invariants, procedures, ownership, acceptance criteria, and where to find live evidence. They must not duplicate volatile state as if it were evergreen.

## Claim lifecycle

Every material operational claim has these fields conceptually:

```text
claim_id
state
observed_at
target_sha
authority
evidence_ref
expires_on_main_change
superseded_by
```

Use the smallest evidence class that actually proves the claim.

### VERIFIED

A claim may be called verified only when the named authority observed the named state for the named target. Verification is scoped, not contagious: a provider build does not prove browser behavior, and a browser screenshot does not prove database authorization.

### HISTORICAL

Evidence remains true about what was observed at that time even after it stops being current. Historical truth should be preserved, clearly labeled, and never promoted back into current authority without a fresh observation.

### REVOKED / SUPERSEDED

If newer trustworthy evidence contradicts a previously verified current-state claim, the old claim becomes historical for current-use purposes. Do not rewrite history by pretending the earlier observation never happened. Do not keep using it as present tense either.

Operational rule:

```text
VERIFIED@T1 + contradictory authoritative evidence@T2
= historical at T1, revoked/superseded for current use at T2
```

### UNKNOWN

Missing, unreadable, unauthenticated, stale, zero-step, or scope-mismatched evidence is UNKNOWN or BLOCKED—not success and not failure of unrelated code.

## Expiry rules

- Exact-head repository evidence expires for current-main claims when `main` moves.
- PR evidence expires for merge authority when the PR head changes.
- Provider/runtime evidence is superseded by a newer observation of the same surface that contradicts it.
- Issue-body prose never overrides the live GitHub issue state or a newer marked evidence receipt.
- A provider upload, preview, or HTTP success never silently upgrades to production release proof.
- A production browser claim requires the exact deployed release identity first.

## State → Evidence → Claim

For every completion or blocker statement record:

1. **State** — what actually changed or was observed.
2. **Evidence** — exact witness and target.
3. **Claim** — the narrow conclusion supported by that witness.
4. **Expiry** — what event invalidates current use of the claim.
5. **Supersession** — what newer evidence, if any, replaced it.

## Operator UX rule

Any surface presenting live status should make freshness visible at the point of use. Prefer a compact status object over prose that forces a founder to mentally reconcile several dated documents.

At minimum show:

```text
STATE
OBSERVED_AT
TARGET_SHA (when applicable)
AUTHORITY
EVIDENCE_REF
CURRENT | HISTORICAL | SUPERSEDED | UNKNOWN
```

## Data-quality metrics

Founder Control Room and reporting systems may safely track metadata-only quality indicators such as:

- stale-current-claim count;
- superseded-claim count;
- claims missing an authority or evidence reference;
- claims whose target SHA differs from current main;
- time from contradiction detection to status reconciliation.

The target for canonical durable documentation is `stale-current-claim count = 0`.

## Privacy boundary

Truth receipts and analytics must remain metadata-safe. Never place raw teen journal text, private messages, voice transcripts, safety content, credentials, private identifiers, or broad database exports into documentation, CI artifacts, status dashboards, or issue comments.
