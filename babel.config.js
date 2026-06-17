// babel.config.js
// Se'kret Bip — Babel configuration
//
// babel-plugin-module-resolver must MIRROR tsconfig.json paths exactly.
// After changing this file restart Expo: npx expo start --clear
//
// Alias resolution order: Metro resolves first match.
// Dual entries (e.g. ['./hooks', './src/hooks']) allow both
// legacy root-level files and the new src/ structure to coexist
// during the transition without breaking any existing import.

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
            // Root alias — covers @/screens/..., @/utils/..., etc.
            '@':           './',

            // Dedicated aliases — each maps to BOTH legacy root dir
            // and new src/ subdir so imports work regardless of location.
            '@constants':  ['./constants', './src/constants'],
            '@screens':    ['./screens'],
            '@utils':      ['./utils',     './src/utils'],
            '@hooks':      ['./hooks',     './src/hooks'],
            '@types':      ['./types',     './src/types'],
            '@components': ['./components'],
            '@store':      ['./src/store'],
            '@handlers':   ['./src/handlers'],
          },
        },
      ],
    ],
  };
};
