# Image Asset Audit — Se'kret Bip

**Audited:** 2026-06-10
**Runtime roots:** `app/`, `components/`, `constants/`, `hooks/`, `screens/`, `services/`, `utils/`, `assets/`, and `app.json`

## Runtime policy

Mockups, reference boards, and character sheets are design inputs, not application UI. They live under `design-references/images/`, outside Expo's runtime asset directory. Screens must recreate their layout with React Native components rather than displaying a flattened design image.

The native Expo splash is color-only. `screens/SplashScreen.tsx` supplies the branded experience with React Native layout, text, buttons, mascot art, and scene artwork after the application mounts.

Run `npm run audit:runtime-assets` to verify that:

- no file named `*mockup*`, `*reference*`, or `*sheet*` remains under `assets/`;
- runtime source does not import or require a matching filename;
- runtime source does not reference `design-references/`.

## Isolated design-only files

These files are retained for designers and implementers, but are never loaded by React Native:

- `design-references/images/circle-mockup.png`
- `design-references/images/parent-dashboard-bg.png`
- `design-references/images/parent-dashboard.png`
- `design-references/images/raylene-fan-sheet.png`
- `design-references/images/raylene-happy-reference-sheet.png`
- `design-references/images/raylene-neutral-reference-sheet.png`
- `design-references/images/raylene-rainy-window-sheet.png`
- `design-references/images/raylene-reference-sheet.png`
- `design-references/images/raylene-thinking-sheet-v2.png`
- `design-references/images/raylene-thinking-sheet.png`
- `design-references/images/rylane-chibi-sticker-mini-reference-sheet.png`
- `design-references/images/rylane-profile-sheet.png`
- `design-references/images/rylane-reference-board.png`
- `design-references/images/rylane-reference-sheet.png`
- `design-references/images/sekret-splash.png`

`parent-dashboard.png` and `sekret-splash.png` are byte-for-byte identical flattened dashboard artwork. Neither is a valid splash or screen implementation. `parent-dashboard-bg.png` is also kept with the source references because the implemented parent bridge uses a component-based gradient, cards, input, controls, and shared bottom navigation.

## Runtime layout map

| Experience | Component implementation | Runtime art policy |
|---|---|---|
| Native splash | `app.json` solid background color | No image |
| Branded splash | `screens/SplashScreen.tsx` | Scene/character illustrations are layered into a component layout |
| Circle | `screens/CircleScreen.tsx` | Cards, composer input, actions, and shared bottom nav over a generic atmosphere background; no Circle mockup |
| Parent Bridge | `screens/ParentBridgeScreen.tsx` | Gradient, cards, prompt controls, message input, actions, and shared bottom nav; no dashboard mockup |

## Known placeholder artwork

Some production-named files in `assets/images/` are two-byte placeholders. `constants/theme.ts` never requires those files and maps their semantic roles to valid production artwork instead. They remain a separate asset-quality issue and are not used as a reason to load a reference sheet or mockup.
