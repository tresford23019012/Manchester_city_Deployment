# LocateBase mobile app

Expo React Native app for LocateBase. The API endpoint used for production builds is
`https://manchester-city-backend.onrender.com`.

## Build with Expo Application Services (EAS)

This repository has `eas.json` profiles:

- `preview`: Android APK for internal device testing.
- `production`: Android AAB for Google Play (requires production signing and store setup).

From the **mobile** directory:

```bash
npm ci
npm run typecheck
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

`eas init` links this repo to an Expo account and writes `expo.extra.eas.projectId`.
Commit the generated project ID so CI and future builds consistently target the same Expo project.
Do not commit Expo authentication tokens, signing keys, or Firebase admin credentials.

The `EXPO_PUBLIC_FIREBASE_*` values in `.env.production` are **public client
configuration** and are bundled into the app; they must never be server secrets.
Verify that Firebase Email/Password sign-in and `/api/v1/auth/sync` work on an
installed preview APK before generating a production bundle.

### About the native Android folder

This repository checks in `mobile/android`. EAS will use the checked-in native
project; app.json alone will not regenerate native Android settings unless you
run `npx expo prebuild`. The Android application ID is currently
`com.anonymous.locatebaseapp` and should be finalized **before** submitting
to Google Play. Native release builds currently refer to a debug keystore,
which is for testing and not a production signing identity. Establish managed
production signing credentials in EAS before any public release.

### Existing GitHub Actions workflow

`.github/workflows/android-test.yml` separately builds a local Gradle test APK
as a GitHub artifact. This is **not** an Expo EAS cloud build.
