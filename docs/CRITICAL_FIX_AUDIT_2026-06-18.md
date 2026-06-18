# Critical Fix Audit — 2026-06-18

This file documents the cleanup pass after the stale PR created to fix PR #57 fallout.

## Findings

- PR #57 is already merged into `main`.
- The active follow-up PR (`Fix PR #57 merge type-check errors`) is stale and non-mergeable because `main` moved far ahead after it was opened.
- That stale PR includes broad `// @ts-nocheck` mitigation across many screens. That should not be merged over current `main` without re-review because it can hide real app breakage.
- The safer path is to patch current `main` incrementally with focused fixes.

## Fixes applied on current `main`

1. Corrected relative imports in `src/components/safety/index.ts` and `src/components/shared/index.ts` so the canonical `src/components/*` barrels correctly reach the root-level production components.

Expected corrected pattern from files inside `src/components/<group>/index.ts`:

```ts
require('../../../components/SomeRootComponent')
```

not:

```ts
require('../../components/SomeRootComponent')
```

The second form points at `src/components/components/...`, which is wrong.

2. Added a fallback avatar path in `components/MiniAvatarSticker.tsx`.

The sticker registry currently references sticker asset keys such as `rayStickerStanding`, but the active `IMAGES` map does not expose those keys yet. Before this fix, Pages/journal mini avatars silently rendered nothing. Now Raylene, Rylane, Cloud, and Night fall back to their normal avatar art if a mini-sticker asset key is missing.

3. Hardened `app/(main)/circle.tsx`.

Circle now:
- Keeps rendering locally when Supabase feed loading returns nothing.
- Normalizes reaction objects before display.
- Uses string-safe post IDs for reaction updates.
- Clears the posting state in a `finally` block so the post button does not get stuck.

4. Enlarged the parent splash entry tap zone in `screens/SplashScreen.tsx`.

The parent splash artwork has shifted across asset swaps, so the invisible tap target is now more forgiving. The splash still only enters on press; no auto-skip behavior was added.

## Still recommended after this pass

1. Run `npm run type-check`, `npm run lint`, and `npm run verify:bundle` locally or in CI.
2. If Circle still does not appear from the bottom tab, inspect Expo Router tab grouping and route aliases next.
3. When sticker assets are fully mapped into `IMAGES`, replace the fallback behavior with real sticker rendering.
