import { spawnSync } from "node:child_process";
import * as path from "node:path";

import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

// `migrate.js` is what the platform's deploy agent runs as a one-off
// container (`node migrate.js`) before starting a new version of the app.
// It must apply pending Drizzle migrations from DB_* env and exit non-zero
// on failure so the deploy stops before the swap.

const POSTGRES_USER = "test";
const POSTGRES_PASSWORD = "test";
const POSTGRES_DB = "migratedb";
const POSTGRES_PORT = 5432;
const MIGRATE_SCRIPT = path.join(__dirname, "../../migrate.js");
const MIGRATE_TIMEOUT_MS = 30000;

let container: StartedTestContainer;
let pool: Pool;

const runMigrate = (password: string): ReturnType<typeof spawnSync> =>
  spawnSync(process.execPath, [MIGRATE_SCRIPT], {
    cwd: path.join(__dirname, "../.."),
    timeout: MIGRATE_TIMEOUT_MS,
    encoding: "utf-8",
    env: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      DB_HOST: container.getHost(),
      DB_PORT: String(container.getMappedPort(POSTGRES_PORT)),
      DB_USER: POSTGRES_USER,
      DB_PASSWORD: password,
      DB_NAME: POSTGRES_DB,
    },
  });

beforeAll(async () => {
  container = await new GenericContainer("postgres:17-alpine")
    .withEnvironment({ POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB })
    .withExposedPorts(POSTGRES_PORT)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections", 2),
    )
    .start();
  pool = new Pool({
    host: container.getHost(),
    port: container.getMappedPort(POSTGRES_PORT),
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
  });
});

afterAll(async () => {
  await pool.end();
  await container.stop();
});

describe("migrate.js", () => {
  test("applies pending migrations and exits 0", async () => {
    const result = runMigrate(POSTGRES_PASSWORD);
    expect(result.status).toBe(0);
    const tables = await pool.query(
      "SELECT to_regclass('public.posts') AS posts",
    );
    expect(tables.rows[0].posts).toBe("posts");
  });

  test("is a no-op on a second run", () => {
    const result = runMigrate(POSTGRES_PASSWORD);
    expect(result.status).toBe(0);
  });

  test("exits non-zero when the database rejects the connection", () => {
    const result = runMigrate("wrong-password");
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/migration failed/i);
  });
});
