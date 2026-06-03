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
