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
            '@app': './src/app',
            '@shared': './src/shared',
            '@food': './src/food',
            '@weight': './src/weight',
            '@today': './src/today',
            '@journey': './src/journey',
            '@trends': './src/trends',
            '@settings': './src/settings',
            '@medication': './src/medication',
            '@water': './src/water',
            '@mood': './src/mood',
          },
        },
      ],
    ],
  };
};
