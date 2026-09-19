module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@shared': './src/shared',
            '@food': './src/food',
            '@weight': './src/weight',
            '@today': './src/today',
            '@journey': './src/journey',
            '@trends': './src/trends',
            '@settings': './src/settings',
          },
        },
      ],
    ],
  };
};
