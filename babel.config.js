module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@utils': './utils',
            '@hooks': './hooks',
            '@constants': './constants',
            // NOTE: '@types' removed — collides with TypeScript's @types/* namespace.
            // Import types directly or use: '@appTypes': './types'
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};

