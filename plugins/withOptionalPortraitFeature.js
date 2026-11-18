const { withAndroidManifest } = require('expo/config-plugins');

// Locking to portrait makes Play imply android.hardware.screen.portrait as required,
// which hides the app from tablets, desktops and XR. Declaring it optional keeps them.
const FEATURE = 'android.hardware.screen.portrait';

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = (manifest['uses-feature'] ??= []);
    const existing = features.find((f) => f.$['android:name'] === FEATURE);
    if (existing) existing.$['android:required'] = 'false';
    else features.push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });
    return mod;
  });
};
