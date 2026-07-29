# Se'kret Bip — Current launch-gate status

**Last reviewed:** 2026-07-29  
**Reviewed repository ref:** `main` at `eeebc15ebd3dc9b420dab04def0d121f41524670`  
**Scope:** current repository and read-only public-production evidence  
**Authority:** this document is the active 2026-07-29 launch-status overlay. It does not turn a repository merge or a green CI run into deployment, database, device, or launch evidence.

## Decision

**Do not declare public launch ready.** The active public-production release marker is not served as JSON, so the deployed frontend cannot currently be tied to an exact `main` commit.

Tracked blocker: [#696](https://github.com/jussray/Sekret-Bip/issues/696).

## Evidence ledger

| Area | Current evidence | Status |
| --- | --- | --- |
| Canonical repository ref | `eeebc15` is the reviewed `main` ref after PR #695 | repository truth only |
| Cloudflare operator docs | PR #695 passed its exact-head contract, full unit suite, and type-check before merge | merged documentation truth |
| Public welcome artwork | A fresh browser review showed the approved family artwork painting on the live welcome screen | visual observation only; not version proof |
| Public release marker | Both `/.well-known/sekret-release.json` and `/release.json` returned app fallbacks instead of JSON | **P0 blocker** |
| Local web build | `npm run build:web` emitted both marker files in `dist` | local build proof only |
| Cloudflare dashboard | Wrangler is not authenticated in this environment | not inspected or changed |
| Restored-session sign-in | PR #688 merged a fail-closed repository behavior | repository proof only |
| Password recovery | PR #690 is a draft with a direct-entry fallback added; it needs fresh exact-head checks and current-base verification | not merge-ready |
| Calm controls | PR #692 was retargeted to `main` and is currently not mergeable; it needs a clean rebase, exact-head checks, and Product Design review | not merge-ready |

## Required release sequence

1. A Cloudflare administrator verifies the `sekret-bip` Pages production Git integration, build command, and `dist` output.
2. The exact intended `main` commit deploys with a public `/.well-known/sekret-release.json` response carrying that commit SHA and `branch: "main"`.
3. The exact-release verifier, Worker build, Worker health, and production Playwright complete against that same release.
4. Auth, onboarding, protected-route, parent/Bridge, deletion, authorization, accessibility, device, legal, safeguarding, moderation, support, backup, restore, incident, and rollback gates retain their own evidence. None are implied by the marker.

## Current guardrails

- Use `worker/voice-entry.ts` as the canonical production Worker entry point.
- Use `/.well-known/sekret-release.json` as the canonical public release-marker URL.
- Preserve legacy Workers and historical documentation until their independent retirement or archival gates are complete.
- Do not use direct upload, credentials, dashboard changes, or a manual production deployment as a substitute for the Git-integrated exact-release proof unless an administrator records the emergency procedure and rollback.

## Reading older documents

Some retained status, sprint, roadmap, and wiring detail predates the reviewed ref above. It is preserved as historical context only where this current-status overlay says otherwise. Before acting, re-check `main`, active PR heads, executed jobs, and the live marker.