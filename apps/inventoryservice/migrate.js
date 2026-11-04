// Applies pending Drizzle migrations from ./drizzle/migrations, then exits.
//
// The platform's deploy agent runs this as a one-off container from the new
// image (`node migrate.js`) BEFORE starting the new version of the app. A
// non-zero exit stops the deploy and the previous version keeps serving.
// Drizzle applies all pending migrations in one transaction, so a failure
// leaves the schema unchanged.
//
// Plain CommonJS on purpose: it runs in the production image next to Next's
// standalone server, with no TypeScript toolchain.
const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");

const MIGRATIONS_FOLDER = "./drizzle/migrations";

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("Migrations applied");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error && error.message}`);
  process.exit(1);
});
