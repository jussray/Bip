# Room Art Guide

Rules for the Room background art: the full-screen images behind the
companion in the home/Room screen, and the equivalent rooms for Mom/Dad
bridge views and the Cloud/Night companions.

## Naming convention

```
bg-<companion>-room-<time>.png
```

- `<companion>`: `raylene`, `rylane`, `cloud`, `night`, `mom`, `dad`
- `<time>`: `day`, `midday`, `afternoon`, `evening`, `night`, `deep-night`,
  `rain` (not every companion ships every time slot — see
  `constants/theme.ts` for the live set)

These files live in `assets/images/` and are `require()`'d in
`constants/theme.ts`. Do not rename a shipped file without updating every
`require()` reference, and do not add a new time slot without wiring it
into the room-background selection logic alongside the asset.

## Format requirements

- PNG, full-bleed room background, no embedded UI chrome (the app draws
  cards/text/nav on top).
- Match the resolution and aspect ratio of the existing files for the same
  companion family — check `assets/images/bg-<companion>-room-*.png` with
  `file` or `sips -g pixelWidth -g pixelHeight` before adding a new one.

## Fallback policy

Per `docs/MISSING_ASSETS.md` at the repo root: if a real room background
isn't ready yet, `constants/theme.ts` maps the missing slot to an existing,
loadable piece of art (currently `bg-raylene-room-night.png` for missing
room variants). Never point a slot at a two-byte placeholder, a
`design-references/` mockup, or anything matching `*mockup*` /
`*reference*` / `*sheet*` — `npm run audit:runtime-assets` enforces this and
will fail the build if it happens.

## Backup requirement

Every file matching `assets/images/bg-*.png` is a **room art asset** and
must have a real, verified backup under `assets/images/archive/` before any
Phase 2 room work touches it. The rules for that backup — and the script
that enforces them — are in [`ASSET_BACKUP_RULES.md`](./ASSET_BACKUP_RULES.md).

## Changing a room background

1. Drop the new PNG in `assets/images/`, named per the convention above.
2. Copy the same file into `assets/images/archive/` (see
   [`ASSET_BACKUP_RULES.md`](./ASSET_BACKUP_RULES.md) for what "copy" means —
   a placeholder or URL stub does not count).
3. Run `npm run verify:room-archives` — it must pass before you commit.
4. Run `npm run audit:runtime-assets` — it must pass before you commit.
5. Run `npm run verify:prepush` before pushing.
