// babel.config.js
// Se'kret Bip — Babel configuration
//
// Must stay in sync with tsconfig.json paths.
// After any change here: npx expo start --clear
//
// Alias map (Step 3):
//   @        → ./src        (canonical — use for all new code)
//   @hooks   → ./src/hooks  (legacy alias now points directly to src/)
//   @utils   → ./src/utils
//   @components → ./src/components
//   @constants  → ./src/constants
//   @types      → ./src/types
//   @screens    → ./screens  (legacy — retire in Step 5)

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // Canonical
            '@':            './src',

            // Legacy — now point directly to src/ (no shim hop)
            '@hooks':       './src/hooks',
            '@utils':       './src/utils',
            '@components':  './src/components',
            '@constants':   './src/constants',
            '@types':       './src/types',

            // Screens — retire in Step 5
            '@screens':     './screens',
          },
        },
      ],
    ],
  };
};
