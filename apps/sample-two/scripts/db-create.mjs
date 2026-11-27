// `npm run db:create` — creates this app's database on your LOCAL Postgres
// (the shared `custom-apps-postgres-dev` container from
// docker-compose.dev.yml) if it doesn't exist yet. Reads DB_* the same way
// `next dev` does: `.env.local` overrides `.env.development`.
//
// Local only: deployed apps get their database from the platform, and the
// deployed DB role is not allowed to create databases.
import nextEnv from "@next/env";
import pg from "pg";

// Connect to the always-present maintenance database to run CREATE DATABASE.
const MAINTENANCE_DATABASE = "postgres";
const DEV_MODE = true;

nextEnv.loadEnvConfig(process.cwd(), DEV_MODE);

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function main() {
  if (!DB_NAME) {
    throw new Error("DB_NAME is not set — is .env.development missing?");
  }
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : undefined,
    user: DB_USER,
    password: DB_PASSWORD,
    database: MAINTENANCE_DATABASE,
  });
  await client.connect();
  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME],
    );
    if (existing.rowCount > 0) {
      console.log(`Database "${DB_NAME}" already exists`);
      return;
    }
    // Identifiers can't be bound as parameters; escape embedded quotes.
    await client.query(`CREATE DATABASE "${DB_NAME.replaceAll('"', '""')}"`);
    console.log(`Created database "${DB_NAME}"`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`db:create failed: ${error && error.message}`);
  process.exit(1);
});
