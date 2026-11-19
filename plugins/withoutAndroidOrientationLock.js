const { withAndroidManifest } = require('expo/config-plugins');

// Android 16 ignores orientation locks on large screens and Play flags them, so only iOS
// stays portrait (app.json `orientation`). ML Kit's scanner activity sets its own lock,
// which the manifest merger strips via `tools:remove`.
const SCANNER =
  'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';

module.exports = function withoutAndroidOrientationLock(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
    const app = manifest.application[0];
    const activities = (app.activity ??= []);

    for (const activity of activities) delete activity.$['android:screenOrientation'];

    const scanner = activities.find((a) => a.$['android:name'] === SCANNER);
    if (scanner) scanner.$['tools:remove'] = 'android:screenOrientation';
    else activities.push({ $: { 'android:name': SCANNER, 'tools:remove': 'android:screenOrientation' } });
    return mod;
  });
};
