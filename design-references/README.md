# Design references (not runtime assets)

This directory contains source mockups, character reference boards, and art sheets used only to guide implementation.

## Runtime boundary

- Files in this directory must **not** be imported, required, or passed to `Image` / `ImageBackground`.
- Full-screen mockups must **not** be configured as native splash images or rendered behind a screen.
- Recreate referenced interfaces with React Native components (`View`, `Text`, `TouchableOpacity`, inputs, cards, and the shared bottom navigation).
- Production-ready illustrations and atmospheric backgrounds belong in `assets/images/` and should have semantic, non-reference filenames.

The `npm run audit:runtime-assets` check enforces this boundary for application source and Expo configuration.
