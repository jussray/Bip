module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@utils': './utils',
            '@hooks': './hooks',
            '@constants': './constants',
            '@types': './types',
          },
        },
      ],
    ],
  };
};
