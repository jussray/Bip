# Bip Vibe Frame Builder

Local Figma plugin that creates the six canonical 390×844 Bip vibe frames without a personal access token.

## What it builds

- Raylene's Room
- Rylane After Dark
- Cloud Drift
- Night Comfort
- Window Rain
- Sunset Exhale

Each frame includes:

- atmosphere placeholder and scrim
- nav bar
- hero card
- input field
- primary and secondary buttons
- privacy and verification badges
- journal card
- Circle post card
- parent-boundary preview

The values mirror `constants/vibeDesignTokens.ts` and `constants/vibeColors.ts`.

## Install locally in Figma

1. Open the Bip Figma file in the Figma desktop app.
2. Open **Plugins → Development → Import plugin from manifest…**
3. Select:

   `tools/figma-vibe-builder/manifest.json`

4. Run **Plugins → Development → Bip Vibe Frame Builder**.

The plugin creates or reuses a page called `Bip Vibe Frames`, removes only prior frames whose names begin with `Vibe —`, and rebuilds all six frames.

## Security

- No Figma personal access token is used.
- No network requests are allowed by the manifest.
- The plugin runs only inside the open Figma file.

## Regeneration rule

When vibe values change, update both:

- `constants/vibeDesignTokens.ts`
- `tools/figma-vibe-builder/code.js`

Then rerun the plugin. Existing generated frames are replaced in place on the `Bip Vibe Frames` page.

## Notes

The 320px atmosphere area is a styled placeholder. Replace it with the approved room or atmosphere image after the frames are generated. The overlay and all UI surfaces remain token-driven.
