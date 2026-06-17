// babel.config.js
// Se'kret Bip — Babel configuration
//
// babel-plugin-module-resolver is configured here to match the path aliases
// declared in tsconfig.json. Both files must stay in sync.
// After changing this file, restart Expo with: npx expo start --clear
//
// Alias map:
//   @/*          → ./src/*        (NEW — use for all new code)
//   @components  → ./components   (legacy, keep until screens/ retired)
//   @screens     → ./screens      (legacy)
//   @hooks       → ./hooks        (legacy)
//   @utils       → ./utils        (legacy)
//   @constants   → ./constants    (legacy)
//   @types       → ./types        (legacy)

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
            // New canonical — all new code uses this
            '@':          './src',

            // Legacy — kept for backward compatibility
            '@components': './components',
            '@constants':  './constants',
            '@screens':    './screens',
            '@utils':      './utils',
            '@hooks':      './hooks',
            '@types':      './types',
          },
        },
      ],
    ],
  };
};
