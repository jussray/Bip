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
            '@hooks': './hooks',
            '@utils': './utils',
            '@components': './components',
            '@constants': './constants',
            '@screens': './screens',
            '@types': './types',
          },
        },
      ],
    ],
  };
};
