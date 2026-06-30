# Bip Vibe Frame Builder

Local, networkless Figma plugin that creates the six canonical 390×844 Bip vibe frames without a personal access token.

## Canonical Figma target

Open this file in the Figma desktop app before running the plugin:

`https://www.figma.com/design/ETppMmGn15qigJnHPHghTs/Se-kret-Bip?node-id=18-2&m=dev`

- File key: `ETppMmGn15qigJnHPHghTs`
- Starting node: `18:2`
- The plugin does not use the REST API or store a personal access token.
- It runs only inside whichever Figma file is currently open, so make sure the file above is active.

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

1. Clone or download the `jussray/Bip` repository to your computer.
2. Open the canonical Bip Figma file above in the Figma desktop app.
3. Open **Plugins → Development → Import plugin from manifest…**
4. Select `tools/figma-vibe-builder/manifest.json`.
5. Run **Plugins → Development → Bip Vibe Frame Builder**.

The plugin creates or reuses a page called `Bip Vibe Frames`, removes only prior frames whose names begin with `Vibe —`, and rebuilds all six frames.

## Official Figma plugin tooling

This folder uses Figma's official `@figma/plugin-typings` package for development checks.

```bash
cd tools/figma-vibe-builder
npm install
npm run typecheck
```

The plugin remains plain JavaScript so Figma can run `code.js` directly without a build step.

## Security

- No Figma personal access token is used.
- No network requests are allowed by the manifest.
- The plugin runs only inside the open Figma file.
- GitHub and Figma credentials must never be added to the plugin.

## Asset workflow

```text
Canva or image creation
  -> production image added to assets/images in GitHub
  -> image placed in the matching generated Figma frame
  -> frame inspected through the official Figma MCP server
  -> React Native implementation updated in Bip
```

Keep every production image layer named exactly like its repository filename.

## Relationship to the official Figma MCP

This plugin builds Figma canvas structure. The official Figma MCP lets supported coding agents read that structure, variables, screenshots, and component context while working in the Bip repository.

The MCP does not replace this plugin, and this plugin does not need MCP access.

See `docs/FIGMA_MCP_SETUP.md` for client setup.

## Regeneration rule

When vibe values change, update both:

- `constants/vibeDesignTokens.ts`
- `tools/figma-vibe-builder/code.js`

Then rerun the plugin. Existing generated frames are replaced in place on the `Bip Vibe Frames` page.

## Notes

The 320px atmosphere area is a styled placeholder. Replace it with the approved room or atmosphere image after the frames are generated. The overlay and all UI surfaces remain token-driven.
