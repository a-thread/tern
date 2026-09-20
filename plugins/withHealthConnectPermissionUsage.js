/**
 * Android 14+ shows a "privacy policy" link in the Health Connect permission
 * dialog by launching an activity that handles VIEW_PERMISSION_USAGE. The
 * react-native-health-connect 3.x plugin only adds the older rationale intent,
 * so this adds an alias for the app's main activity.
 */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
} = require('@expo/config-plugins');

const ALIAS = 'ViewPermissionUsageActivity';

const withHealthConnectPermissionUsage = (config) =>
  withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    app['activity-alias'] = app['activity-alias'] ?? [];
    const exists = app['activity-alias'].some((a) => a.$['android:name'] === ALIAS);
    if (!exists) {
      app['activity-alias'].push({
        $: {
          'android:name': ALIAS,
          'android:exported': 'true',
          'android:targetActivity': '.MainActivity',
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
            category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
          },
        ],
      });
    }
    return config;
  });

module.exports = createRunOncePlugin(
  withHealthConnectPermissionUsage,
  'withHealthConnectPermissionUsage',
  '1.0.0',
);
