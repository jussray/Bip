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
            // ── Legacy aliases (unchanged — existing imports keep working) ──
            '@constants':  './constants',
            '@screens':    './screens',
            '@utils':      './utils',
            '@hooks':      './hooks',
            '@types':      './types',
            '@components': './components',

            // ── src/ aliases (new convention for refactored code) ──
            '@/hooks':     './src/hooks',
            '@/utils':     './src/utils',
            '@/constants': './src/constants',
            '@/types':     './src/types',
            '@/services':  './src/services',
            '@/screens':   './screens',
            '@/context':   './context',
          },
        },
      ],
    ],
  };
};
