# Design references

Files in `assets/` are source material for visual direction only. They are not
runtime React Native assets and must not be imported with `require()`, exposed
through `constants/theme.ts`, or configured as an Expo splash image.

Recreate layouts with React Native components (`View`, `Text`,
`TouchableOpacity`, cards, inputs, and navigation). Crop a deliberately reusable
character or illustration into `assets/images/` under a descriptive runtime
name before using it in the app; never render a full reference board, sheet, or
mockup as a screen.

Some files are two-byte placeholders retained only to document missing design
handoff assets. See `MISSING_ASSETS.md` for the asset audit.
