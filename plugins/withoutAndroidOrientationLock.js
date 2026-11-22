const { withAndroidManifest } = require('expo/config-plugins');

// Android 16 ignores orientation locks on large screens and Play flags them, so only iOS
// stays portrait (app.json `orientation`). ML Kit's scanner activities (from expo-camera)
// set their own lock, which the manifest merger strips via `tools:remove`. Play still implies a
// required portrait screen from any lock a library adds, so the feature is declared optional too.
const PORTRAIT = 'android.hardware.screen.portrait';
const SCANNERS = [
  'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity',
  'com.google.mlkit.vision.documentscanner.internal.GmsDocumentScanningDelegateActivity',
];

module.exports = function withoutAndroidOrientationLock(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
    const features = (manifest['uses-feature'] ??= []);
    const portrait = features.find((f) => f.$['android:name'] === PORTRAIT);
    if (portrait) portrait.$['android:required'] = 'false';
    else features.push({ $: { 'android:name': PORTRAIT, 'android:required': 'false' } });

    const app = manifest.application[0];
    const activities = (app.activity ??= []);

    for (const activity of activities) delete activity.$['android:screenOrientation'];

    for (const name of SCANNERS) {
      const scanner = activities.find((a) => a.$['android:name'] === name);
      if (scanner) scanner.$['tools:remove'] = 'android:screenOrientation';
      else activities.push({ $: { 'android:name': name, 'tools:remove': 'android:screenOrientation' } });
    }
    return mod;
  });
};
