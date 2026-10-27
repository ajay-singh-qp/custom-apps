# Custom App

This Next.js scaffold was seeded by the Custom Apps platform. It lives in the
calcite monorepo under `apps/<slug>/` and is deployed from the platform UI.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000, DB settings from .env.local
npm run dev:backend # FastAPI on http://localhost:8000 (run separately)
npm test           # backend (jest, testcontainers) + frontend (vitest)
```

The browser calls `/api/todos` on Next.js. Those routes proxy to FastAPI using
`FASTAPI_URL` (default `http://127.0.0.1:8000`). The production container starts
both services, and both write to the same container stdout/stderr stream.

`npm run docker:smoke` builds the production image and boots it the way a
deploy does (migrations container, then the app with the `/api/health`
healthcheck) against a throwaway database on the local dev Postgres.

## Login (QuestionPro OAuth) is off by default

Until the platform can register a QuestionPro callback URL for each app,
login is disabled: every page is public and the header shows no account menu.
`/api/oauth`, `/api/oauth/callback` and `/api/logout` answer `404`.

To turn it on, set these in the project's App env on the platform and
redeploy:

- `QUESTIONPRO_OAUTH_ENABLED=true` (exactly `true`; anything else is off)
- `QUESTIONPRO_OAUTH_CLIENT_ID`, `QUESTIONPRO_OAUTH_ENCRYPTION_KEY`,
  `QUESTIONPRO_OAUTH_HOST_URL`
- `QUESTIONPRO_OAUTH_SUCCESS_REDIRECT_URL` and `QUESTIONPRO_OAUTH_REDIRECT_URI`,
  both pointing at the deployed app's address; the redirect URI must be
  registered on the OAuth client
- `SESSION_PASSWORD` (at least 32 characters: `openssl rand -hex 32`)

The app shell (`ClientAppShell`) renders in the browser only: wick-ui's header
reads `window` while rendering, so it can't be server-rendered.

## Deploying

1. Push your changes to `main` in calcite.
2. In the platform, click **Deploy** on the project. The deploy runs these steps:
   - **Database:** your app's own database and user are created on the first
     deploy.
   - **Build:** a GitHub Actions run in calcite builds this folder's
     `Dockerfile` and pushes the image. Use **View build logs** to follow it
     live. If this folder hasn't changed since the last build, the image is
     reused and the build is skipped.
   - **Migrate:** `node migrate.js` applies pending Drizzle migrations.
   - **Start + healthcheck:** the new version starts next to the running one
     and takes traffic once `GET /api/health` answers. Only then is the old
     version stopped.
3. The app is served at `https://<subdomain>.customapps.questionpro.com`.

A failed deploy never takes your running app down. The previous version keeps
serving, and the platform shows the failing step, its error and the last log
lines.

### Rules the build enforces

The build checks this folder's `Dockerfile` before building. The base images
must be on the allowlist (`node:24-alpine`, `node:24-bookworm-slim`). The final
stage must run as a non-root `USER`. No `ARG`/`ENV` may be named like a
secret, and `ADD` may not fetch a URL. The image must expose port `3000` and
keep `GET /api/health` public (it is listed in `PUBLIC_ROUTES`). The platform
sets CPU, memory, network and privilege limits at runtime, so nothing in this
Dockerfile can change them.

### Migrations must be backward compatible

Migrations run **before** the new version starts, while the previous version
is still serving, against the same database. Rolling back never reverts the
schema either: Drizzle has no down-migrations, so an older version simply runs
on the newer schema. So:

- **Safe in one deploy:** adding a table, or adding a nullable / defaulted column.
- **Needs two deploys:** renaming or dropping a column or table, or adding a
  `NOT NULL` column without a default. First deploy code that stops using the
  old shape. Drop or rename it in a **later** deploy.

Drizzle only applies migrations newer than the latest one already recorded. A
migration generated on an old branch and merged after a newer one is
**silently skipped**, so regenerate it on top of `main`.

### Don't edit `.github/` in calcite

`.github/workflows/build-app.yml` and `.github/scripts/` are owned by the
platform and rewritten whenever a project is created. Changes there are
overwritten, and they affect every app's build.
