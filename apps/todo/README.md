# Custom App

This Next.js app was set up by the Custom Apps platform with a PostgreSQL
database (Drizzle ORM). It lives in the calcite monorepo under `apps/<slug>/`
and is deployed from the platform UI.

## Run it locally

You need Node 24+ and Docker.

```bash
docker compose -f docker-compose.dev.yml up -d   # shared local Postgres
npm install                                      # first time: commit the package-lock.json it creates
npm run db:create                                # creates this app's database (safe to re-run)
npm run db:migrate                               # applies drizzle/migrations
npm run dev                                      # http://localhost:3000
```

The home page shows a database probe: "Connected to `<your db>`" means
everything is wired up.

### Where the settings come from

| File               | What it holds                                                                |
| ------------------ | ---------------------------------------------------------------------------- |
| `.env.development` | `DB_*` for your laptop. The platform wrote it with this app's database name. |
| `.env.local`       | OAuth / session placeholders. It holds no `DB_*`.                            |

`next dev`, `npm run db:*` and `drizzle-kit` all read these files the same
way. In a deploy, the platform injects its own `DB_*`, and neither file is
used.

## Changing the schema

1. Edit `db/schema.ts`.
2. Run `npm run db:generate`. This writes a new SQL file to
   `drizzle/migrations/`. Review it.
3. Run `npm run db:migrate` to apply it locally.
4. Commit the schema change and the migration together. The next deploy
   applies the migration before the new version starts.

## Tests

```bash
npm test   # backend (jest) + frontend (vitest)
```

The database tests start their own throwaway Postgres with testcontainers, so
Docker must be running. They never touch your local database.

`npm run docker:smoke` builds the production image and boots it the way a
deploy does: first the migrations container, then the app with the
`/api/health` healthcheck. It runs against a throwaway database on the local
Postgres, and needs `NPM_TOKEN` set.

## Troubleshooting

- **Port 5432 is already in use.** Another Postgres is running on your
  machine. Stop it, or change the port mapping in `docker-compose.dev.yml` and
  `DB_PORT` in `.env.development` together.
- **"container name custom-apps-postgres-dev is already in use".** You
  already started the shared Postgres from another app or from the platform
  repo. That's fine: every Custom App shares this one container. Skip the
  `docker compose` step.
- **`database "…" does not exist`.** Run `npm run db:create`.
- **Start over with an empty database.** Run
  `docker exec custom-apps-postgres-dev dropdb -U root <DB_NAME>`, then
  `npm run db:create && npm run db:migrate`. To wipe every app's local data,
  run `docker compose -f docker-compose.dev.yml down -v`.

## Login (QuestionPro OAuth) is off by default

Until the platform can register a QuestionPro callback URL for each app,
login is disabled. Every page is public and the header shows no account menu.
`/api/oauth`, `/api/oauth/callback` and `/api/logout` answer `404`.

To turn login on, set these in the project's App env on the platform, then
redeploy:

- `QUESTIONPRO_OAUTH_ENABLED=true` (exactly `true`; any other value leaves it off)
- `QUESTIONPRO_OAUTH_CLIENT_ID`, `QUESTIONPRO_OAUTH_ENCRYPTION_KEY`,
  `QUESTIONPRO_OAUTH_HOST_URL`
- `QUESTIONPRO_OAUTH_SUCCESS_REDIRECT_URL` and `QUESTIONPRO_OAUTH_REDIRECT_URI`,
  both pointing at the deployed app's address. The redirect URI must be
  registered on the OAuth client.
- `SESSION_PASSWORD` (at least 32 characters: `openssl rand -hex 32`)

The app shell (`ClientAppShell`) renders in the browser only. wick-ui's header
reads `window` while it renders, so it can't be server-rendered.

## Deploying

1. Push your changes to `main` in calcite.
2. In the platform, click **Deploy** on the project. The deploy runs these
   steps:
   - **Database:** the first deploy creates your app's own database and user.
     The **Database** tab then shows the connection details.
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

The build checks this folder's `Dockerfile` before building:

- The base images must be on the allowlist (`node:24-alpine`,
  `node:24-bookworm-slim`).
- The final stage must run as a non-root `USER`.
- No `ARG`/`ENV` may be named like a secret.
- `ADD` may not fetch a URL.
- The image must expose port `3000` and keep `GET /api/health` public (it is
  listed in `PUBLIC_ROUTES`).
- `migrate.js` must stay in the image. A deploy fails with
  `migrate_script_missing` without it.

The platform sets CPU, memory, network and privilege limits at runtime, so
nothing in this Dockerfile can change them.

### Migrations must be backward compatible

Migrations run **before** the new version starts. The previous version is
still serving at that point, against the same database. Rolling back never
reverts the schema either: Drizzle has no down-migrations, so an older version
simply runs on the newer schema. So:

- **Safe in one deploy:** adding a table, or adding a nullable or defaulted
  column.
- **Needs two deploys:** renaming or dropping a column or table, or adding a
  `NOT NULL` column without a default. First deploy code that stops using the
  old shape, then drop or rename it in a **later** deploy.

Drizzle only applies migrations newer than the latest one it has already
recorded. A migration generated on an old branch and merged after a newer one
is **silently skipped**, so regenerate it on top of `main`.

### Don't edit `.github/` in calcite

The platform owns `.github/workflows/build-app.yml` and `.github/scripts/`,
and rewrites them whenever a project is created. Your changes there are
overwritten, and they affect every app's build.
