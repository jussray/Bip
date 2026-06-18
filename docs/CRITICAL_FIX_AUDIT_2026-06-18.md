# Critical Fix Audit — 2026-06-18

This file documents the cleanup pass after the stale PR created to fix PR #57 fallout.

## Findings

- PR #57 is already merged into `main`.
- The active follow-up PR (`Fix PR #57 merge type-check errors`) is stale and non-mergeable because `main` moved far ahead after it was opened.
- That stale PR includes broad `// @ts-nocheck` mitigation across many screens. That should not be merged over current `main` without re-review because it can hide real app breakage.
- The safer path is to patch current `main` incrementally with focused fixes.

## First focused fix

Fix relative imports in `src/components/safety/index.ts` and `src/components/shared/index.ts` so the canonical `src/components/*` barrels correctly reach the root-level production components.

Expected corrected pattern from files inside `src/components/<group>/index.ts`:

```ts
require('../../../components/SomeRootComponent')
```

not:

```ts
require('../../components/SomeRootComponent')
```

The second form points at `src/components/components/...`, which is wrong.

## Next recommended checks

1. Parent splash tap behavior.
2. Circle route/render wiring.
3. Journal selected Se'kret avatar mapping.
4. Voice Bip character voice provider boundaries.
5. Run `npm run type-check`, `npm run lint`, and `npm run verify:bundle` locally or in CI.
