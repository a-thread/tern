# Releasing Tern

Builds run on EAS (Expo), started from GitHub Actions. App id: `com.purlieus.tern`,
Expo owner `purlieus-systems`.

## One-time setup

1. Add the GitHub secret `EXPO_TOKEN` (expo.dev > Account settings > Access tokens).
2. EAS environment variables (`preview` and `production`): `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_USDA_API_KEY`.
3. Run the first Android build by hand so EAS creates the keystore, then back it up:
   `npx eas-cli build -p android --profile production` and `npx eas-cli credentials`.
4. Play Console: create the app, upload the first AAB manually (Google requires it), fill the
   listing, data safety and Health Connect declarations, host `docs/index.html` (GitHub Pages).
5. For automatic submission: add a Google Play service-account key to EAS credentials. The
   track is already `internal` in `eas.json` — change it there to send builds somewhere else.

## Every release

1. Merge to `main` (CI runs typecheck, lint and tests).
2. `npm version patch` (bumps `package.json`, commits and tags `vX.Y.Z`), then set the same
   `version` in `app.json`.
3. `git push --follow-tags`. The tag starts a **production** Android build.
4. Follow the build on expo.dev; promote it in the Play Console.

Test build: Actions > Build > Run workflow > `preview` / `android` gives an installable APK.
Tick "submit" (production only) to send the build to the store once step 5 above is done.
