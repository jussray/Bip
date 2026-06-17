// babel.config.js
// Se'kret Bip — Babel configuration
//
// babel-plugin-module-resolver is configured here to match the path aliases
// declared in tsconfig.json. Both files must stay in sync.
// After changing this file, restart Expo with: npx expo start --clear

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
            '@constants': './constants',
            '@screens':   './screens',
            '@utils':     './utils',
            '@hooks':     './hooks',
            '@types':     './types',
          },
        },
      ],
    ],
  };
};
