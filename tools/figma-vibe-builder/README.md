# Bip Vibe Frame Builder

Local Figma plugin that creates the six canonical 390×844 Bip vibe frames without a personal access token.

## Canonical Figma target

Open the Se’kret Bip Figma file in the desktop app before running the plugin:

`https://www.figma.com/design/ETppMmGn15qigJnHPHghTs/Se-kret-Bip?node-id=57-2&m=dev`

- File key: `ETppMmGn15qigJnHPHghTs`
- Current entry authority frame: `57:2` — `Se’kret Bip — Generator Ready Entry Flow`
- Teen Public Welcome: `57:4`
- Bip Jr + Family Public Welcome: `57:44`
- Shared Sign In: `57:84`
- The prior `18:2` pointer is stale and must not be used as current entry authority.
- The plugin does not use the REST API or store a personal access token.
- It runs only inside the Figma file currently open.

## What the vibe builder builds

The existing plugin creates its historical six-frame Vibe workspace:

- Raylene's Room
- Rylane After Dark
- Cloud Drift
- Night Comfort
- Window Rain
- Sunset Exhale

Those generated labels describe the legacy plugin workspace. They are not current user-facing companion naming authority. Current product identity and runtime naming remain governed by the repository canon and approved visual references.

Each generated frame includes:

- atmosphere placeholder and scrim;
- nav bar;
- hero card;
- input field;
- primary and secondary buttons;
- privacy and verification badges;
- journal card;
- Circle post card;
- parent-boundary preview.

The values mirror `constants/vibeDesignTokens.ts` and `constants/vibeColors.ts` in the canonical `jussray/Sekret-Bip` repository.

## Install locally in Figma

1. Clone or download `jussray/Sekret-Bip`.
2. Open the canonical Bip Figma file above in the Figma desktop app.
3. Open **Plugins → Development → Import plugin from manifest…**
4. Select `tools/figma-vibe-builder/manifest.json`.
5. Run **Plugins → Development → Bip Vibe Frame Builder**.

The plugin creates or reuses a page called `Bip Vibe Frames`, removes only prior frames whose names begin with `Vibe —`, and rebuilds all six frames.

## Security

- No Figma personal access token is used.
- No network requests are allowed by the manifest.
- The plugin runs only inside the open Figma file.
- Generated design frames do not replace runtime privacy, authorization, or rollout controls.

## Regeneration rule

When vibe values change, update both:

- `constants/vibeDesignTokens.ts`
- `tools/figma-vibe-builder/code.js`

Then rerun the plugin and validate the app implementation separately. Existing generated frames are replaced in place on the `Bip Vibe Frames` page.

## Notes

The 320px atmosphere area is a styled placeholder. Replace it with the approved room or atmosphere image after frames are generated. The overlay and UI surfaces remain token-driven.

For public-entry work, use the current `57:2` entry frame and its child frames above rather than the historical Vibe workspace.

Figma output is design evidence, not proof that a screen is integrated, verified, or released. Product status remains governed by `implementation-ledger.json` and repository tests.
