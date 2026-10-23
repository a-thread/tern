import type { ConfigContext, ExpoConfig } from 'expo/config';

// Release builds get their version from the release tag (APP_VERSION, set by
// .github/workflows/release.yml); everywhere else the app.json version is used.
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    version: process.env.APP_VERSION || config.version,
  }) as ExpoConfig;
