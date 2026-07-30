# Repo Knowledge Refresh — baseline 2026-07-20, refreshed 2026-07-30

This is the current agent-orientation checkpoint for Se'kret Bip. It preserves the July 20 filename for continuity but supersedes the earlier July 23 status narrative.

## Current repository authority

- Default branch: `main`.
- Reviewed application baseline: `2a3d11efa094be2b9ae0a6095a1d84f21844f85b`. Later documentation-only merges may advance `main` without changing application evidence.
- Current launch gate: `docs/LAUNCH_GATE_STATUS_2026-07-29.md`.
- P0 live-release blocker: [#696](https://github.com/jussray/Sekret-Bip/issues/696).
- Canonical frontend: Cloudflare Pages project `sekret-bip`.
- Canonical backend: Worker `sekret-backend`, entry point `worker/voice-entry.ts`.
- Canonical public release marker: `https://sekretbip.net/.well-known/sekret-release.json`.

## What is merged

- PR #595: canonical onboarding-state repair.
- PR #596: Crew invite behavior contract.
- PR #688: restored-session account switching fails closed.
- PR #691: current main-contract authority repair.
- PR #695: Cloudflare operator-document reconciliation, exact-head contract, unit suite, and type-check.

A merge proves repository history only. It does not automatically prove the live Pages deployment, Supabase state, production auth, browser flow, or device behavior.

## Live production finding

The local web build emits both `dist/.well-known/sekret-release.json` and `dist/release.json`. A fresh read-only production check saw application fallbacks instead of JSON at both public paths. Therefore:

- do not call the live web frontend an exact release of current `main`;
- do not infer a Pages deploy from a green repository workflow;
- do not use the legacy `/release.json` URL as current release authority;
- route Cloudflare dashboard configuration and artifact verification through #696.

## Open merge candidates

- PR #698 is the merged password-recovery continuation fix with a direct-entry fallback. PR #690 is closed as preserved historical review evidence; live auth, email-delivery, reset-link, production, and device proof remain separate.
- PR #692 is a draft Calm-controls repair. It was retargeted to `main`, is not currently mergeable, and needs a clean rebase plus Product Design and exact-head evidence.

## Evidence discipline

Keep code, exact-head CI, merge-SHA CI, Cloudflare deployment, live Supabase, production browser, physical-device, and real-account witnesses separate. A green signal in one layer does not prove another.

## Current primary launch order

1. Restore the public release marker and exact production witness for the intended `main` SHA.
2. Complete and verify current auth and Calm merge candidates.
3. Continue independent authorization, deletion, relationship/Bridge, device, accessibility, legal, safeguarding, moderation, support, backup, restore, incident, and rollback gates.
4. Keep L4 and L5 out of launch scope unless the founder explicitly changes it.

## Historical note

Earlier July 23 prose in previous revisions described PR #595 and PR #596 as drafts. They are merged historical milestones, not current repair candidates.