# Locatebase administration frontend

This frontend connects to the unchanged Spring Boot backend in `../locatebase-api`. The previous mock adapters and browser-only listing storage have been replaced with authenticated API calls.

## Run locally

1. Install Node.js 22.12+ (Node.js 24 is suitable).
2. In this folder, run `npm ci`.
3. Copy `.env.example` to `.env` and fill in `VITE_FIREBASE_API_KEY` from the Firebase **web app** configuration for project `locatebase-614b5`. Enable Email/Password sign-in in that Firebase project and authorize the frontend's domain.
4. Start the existing backend with its own `MONGODB_URI`; photo uploads also need its `CLOUDINARY_URL`. Keep both variables on the backend only. Its Firebase issuer is already configured for `locatebase-614b5`.
5. Run `npm run dev`, then open http://localhost:5173.
6. Sign in with an existing Firebase account whose stored backend role is `admin`. The frontend synchronizes the profile and verifies admin access before showing administrative pages. It does not grant itself administrator privileges.

`API_PROXY_TARGET` defaults to `http://localhost:8080`. Change it to the address of your running backend if necessary. The browser uses `/api/v1`; Vite proxies `/api` to the backend. The fixed port 5173 matches the backend's allowed development origins.

## Build and host

Run `npm test` and `npm run build`. Deploy the generated `dist/` directory with SPA fallback to `index.html` for non-file routes. Configure your host to reverse proxy `/api/` to the backend **before** applying the SPA fallback. Forward Authorization headers and support GET, POST, PUT, PATCH, DELETE and multipart uploads.

The backend's current CORS configuration omits PATCH and allows only localhost:5173. The same-origin proxy is therefore required with the supplied backend. A separate production API origin would require an explicit backend CORS update; changing only `VITE_API_BASE_URL` does not solve that. `vite preview` previews static files; it is not a production API proxy. Public VITE settings are compiled into the build: rebuild after changing them.

## Corrected workflows

- Firebase email/password sign-in, token refresh through the Firebase SDK, admin access checks, and sign-out.
- Dashboard reads `/admin/dashboard/stats` and `/charts`. Views are shown by guesthouse because the backend does not return daily history.
- Requests use all six backend statuses. Dispatch requires a representative name and a visit date. There is no representatives-directory endpoint; enter the name directly.
- After data collection, use **Create linked listing**. Complete the location and details, then choose published when ready. Creating the guesthouse carries the request ID; changing its status to published closes the linked request on the backend. There is no request `/publish` endpoint.
- Listings use server IDs, nested contact details, GeoJSON `[longitude, latitude]`, separate status updates and authenticated multipart photo uploads (`files`, up to seven images, 8 MB each). Images upload individually to stay below the backend's 40 MB request limit. If a later save step fails after details were saved, the existing listing remains available for review; do not recreate it.
- User blocking uses PATCH with `{ blocked: true/false }`. Account-level payment and listing totals are not supplied by the user endpoint, so the old demo-only columns are removed.
- **Add administrator** promotes an existing synchronized account by email. The backend does not create Firebase users or accept a new password here.
- All paginated list responses are retrieved before the existing client-side filters, pagination and CSV export are applied. This preserves completeness; very large deployments should move those controls to server-side pagination.

## Environment boundary

Do not copy MongoDB credentials, Cloudinary secrets, Firebase service-account keys, or user tokens into VITE variables. Only Firebase's public web configuration and the public API path belong in this frontend.

## Validation

API contract tests cover authentication headers, pagination, server validation errors, multipart requests, empty responses, request transitions, user blocking, promotion, dashboard mapping and GeoJSON/contact/photo mapping. Live authentication, database persistence and Cloudinary uploads require your actual configured services and account and must be verified in that environment.

Verified in this repair: TypeScript check passed; production build passed; all 10 contract tests passed; local development server started; browser displayed the missing-configuration screen correctly. Build emits a non-blocking large-bundle warning and React Router directive warnings. Live Firebase/MongoDB/Cloudinary flows were not tested.

Verified in this repair: TypeScript check passed; production build passed; all 10 contract tests passed; local development server started; browser displayed the missing-configuration screen correctly. Build emits a non-blocking large-bundle warning and React Router directive warnings. Live Firebase/MongoDB/Cloudinary flows were not tested.
