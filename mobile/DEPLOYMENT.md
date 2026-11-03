# Android test build

Both clients use Firebase project locatebase-614b5 and https://locatebase-api.onrender.com.
The checked-in .env.production contains only Firebase's public client configuration.
No MongoDB credentials or Firebase service-account keys belong in either frontend.

Run npm ci, npm run typecheck, then npm run android for local development.
The Android test APK workflow builds an installable, bundled APK with the repository's
existing debug signing key. It is for testing only, not Google Play publication.
A store release must use a private release key, an agreed package ID, and release review.

The Firebase JavaScript SDK handles email/password login, so the obsolete native
Google configuration from a different project was removed.

Without an Android Maps API key, the Locations page shows real guesthouses and opens
their coordinates in the device's map app. Embedded maps require a restricted Android
Maps key configured in both the native manifest and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.

Before deployment, confirm Email/Password authentication is enabled in Firebase.
Verify login, backend account sync, listings, favourites, and details against the live
backend. A successful bundle build alone is not end-to-end validation.
