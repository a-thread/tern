const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Keeps native debug symbols in the Android release bundle for readable crash reports.
 * `SYMBOL_TABLE` limits upload size without changing the downloaded app size.
 */
const LEVEL = 'SYMBOL_TABLE';

module.exports = function withNativeDebugSymbols(config) {
  return withAppBuildGradle(config, (mod) => {
    const gradle = mod.modResults.contents;
    if (gradle.includes('debugSymbolLevel')) return mod;
    if (!/defaultConfig\s*\{/.test(gradle)) {
      throw new Error(
        'withNativeDebugSymbols: no defaultConfig block in android/app/build.gradle',
      );
    }
    mod.modResults.contents = gradle.replace(
      /defaultConfig\s*\{/,
      (block) => `${block}\n        ndk { debugSymbolLevel '${LEVEL}' }`,
    );
    return mod;
  });
};
