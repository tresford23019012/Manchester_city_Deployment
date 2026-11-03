# Web deployment

Deploy this branch as a Render Static Site:
- Build command: npm ci && npm run build
- Publish directory: dist
- Rewrite /* to /index.html so direct page links work.
- The API URL and public Firebase client settings are in .env.production.

On the existing backend, set APP_CORS_ALLOWED_ORIGINS to the exact frontend URL
shown by Render (for example https://locatebase-admin.onrender.com), plus any
required localhost origins separated by commas. Deploy the accompanying CorsConfig
change, which permits PATCH as required by user blocking and listing status updates.
Do not use a wildcard origin.

Firebase must have Email/Password sign-in enabled. Add the deployed frontend host
to Firebase Authentication's authorized domains if required for the sign-in methods
in use. Existing administrators need their admin role in the backend user database.

No MongoDB or Cloudinary secrets belong in this web app; keep them on the backend.
Validate login, dashboard, requests, users, guesthouses and photo upload after deploy.
