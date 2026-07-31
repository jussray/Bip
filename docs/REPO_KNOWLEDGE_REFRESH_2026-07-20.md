# Repo Knowledge Refresh — baseline 2026-07-20, refreshed 2026-07-31

This is the current agent-orientation checkpoint for Se'kret Bip. It preserves the July 20 filename for continuity but supersedes the earlier July 23 and July 30 status narratives.

## Current repository authority

- Default branch: `main`.
- Reviewed application baseline: `824b4dcffb9e0ffc7468a002f0390cbba98d79ae`. Later documentation-only merges may advance `main` without changing application evidence.
- Current launch gate: `docs/LAUNCH_GATE_STATUS_2026-07-31.md`.
- P0 live-release blocker: [#696](https://github.com/jussray/Sekret-Bip/issues/696).
- Cloudflare branch-control blocker: [#646](https://github.com/jussray/Sekret-Bip/issues/646) — do not create or merge implementation branches until it clears.
- Canonical frontend: Cloudflare Pages project `sekret-bip`.
- Canonical backend: Worker `sekret-backend`, entry point `worker/voice-entry.ts`.
- Canonical public release marker: `https://sekretbip.net/.well-known/sekret-release.json`.

## What is merged

- PR #595: canonical onboarding-state repair.
- PR #596: Crew invite behavior contract.
- PR #688: restored-session account switching fails closed.
- PR #691: current main-contract authority repair.
- PR #695: Cloudflare operator-document reconciliation, exact-head contract, unit suite, and type-check.
- PR #698: password-recovery route continuity, with PR #690 closed as preserved history.
- PR #700: reconstructed Calm mood/plan controls repair; PR #692, its stale mixed-stack predecessor, is closed and preserved only as historical source.
- PR #701: canonical Suhana/Sy companion naming in Teen and Parent Settings.
- PR #703, #704, #706: repository failure-truth auditor, branch-hygiene inventory gate, and post-merge Repository Truth/Calm/Product Design verification, including a parser-typo repair.

A merge proves repository history only. It does not automatically prove the live Pages deployment, Supabase state, production auth, browser flow, or device behavior.

## Live production finding

The local web build emits both `dist/.well-known/sekret-release.json` and `dist/release.json`. A fresh read-only production check saw application fallbacks instead of JSON at both public paths. Therefore:

- do not call the live web frontend an exact release of current `main`;
- do not infer a Pages deploy from a green repository workflow;
- do not use the legacy `/release.json` URL as current release authority;
- route Cloudflare dashboard configuration and artifact verification through #696.

## Open merge candidates

There are no open pull requests as of this refresh. Merged work still needs separate real-account, browser, and physical-device proof before it counts as launch evidence:

- PR #698 (password-recovery continuation fix with a direct-entry fallback; PR #690 closed as preserved historical review evidence);
- PR #700 (Calm mood/plan controls) and PR #701 (canonical companion naming in Settings).

## Evidence discipline

Keep code, exact-head CI, merge-SHA CI, Cloudflare deployment, live Supabase, production browser, physical-device, and real-account witnesses separate. A green signal in one layer does not prove another.

## Current primary launch order

1. Restore the public release marker and exact production witness for the intended `main` SHA.
2. Resolve #646 (Cloudflare branch controls) before any new implementation branch is created or merged.
3. Complete separate real-account, browser, and device proof for the merged auth and Calm surfaces.
4. Continue independent authorization, deletion, relationship/Bridge, device, accessibility, legal, safeguarding, moderation, support, backup, restore, incident, and rollback gates.
4. Keep L4 and L5 out of launch scope unless the founder explicitly changes it.

## Historical note

Earlier July 23 prose in previous revisions described PR #595 and PR #596 as drafts. They are merged historical milestones, not current repair candidates. Earlier July 30 prose described PR #692 as a draft needing a rebase; it is closed, and its Calm-controls repair is merged repository history through PR #700.