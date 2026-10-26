import { count, sql } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

import * as schema from "../../db/schema";
import { posts } from "../../db/schema";

type ISchema = typeof schema;

const POSTGRES_USER = "test";
const POSTGRES_PASSWORD = "test";
const POSTGRES_DB = "testdb";
const POSTGRES_PORT = 5432;

let container: StartedTestContainer;
let pool: Pool;
let db: NodePgDatabase<ISchema>;

beforeAll(async () => {
  container = await new GenericContainer("postgres:17-alpine")
    .withEnvironment({
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_DB,
    })
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
  db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
});

afterAll(async () => {
  await pool.end();
  await container.stop();
});

describe("Drizzle migrations", () => {
  test("migrations run without error", () => {
    // Covered by beforeAll — if migrate() throws, beforeAll fails and every
    // test in this file is skipped with a clear error message.
    expect(pool).toBeDefined();
  });

  test("posts table exists and is empty after a fresh migration", async () => {
    const [{ value }] = await db.select({ value: count() }).from(posts);
    expect(value).toBe(0);
  });
});

describe("posts table", () => {
  test("accepts inserts and the count reflects inserted rows", async () => {
    await db.insert(posts).values({ title: "Hello", body: "World" });
    const [{ value }] = await db.select({ value: count() }).from(posts);
    expect(value).toBe(1);
  });

  test("inserted row has an auto-generated id and createdAt timestamp", async () => {
    const [row] = await db
      .insert(posts)
      .values({ title: "Title", body: "Body" })
      .returning();
    expect(typeof row.id).toBe("number");
    expect(row.id).toBeGreaterThan(0);
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  test("title and body are stored and retrieved correctly", async () => {
    const [row] = await db
      .insert(posts)
      .values({ title: "My Title", body: "My Body" })
      .returning();
    expect(row.title).toBe("My Title");
    expect(row.body).toBe("My Body");
  });
});

describe("DB probe query shape", () => {
  test("probeDb-style SELECT returns database name, timestamp, and version", async () => {
    const result = await db.execute<{
      db: string;
      ts: string;
      pg_version: string;
    }>(
      sql`SELECT current_database() AS db, NOW() AS ts, version() AS pg_version`,
    );
    const meta = result.rows[0];
    expect(typeof meta.db).toBe("string");
    expect(meta.db.length).toBeGreaterThan(0);
    expect(typeof meta.ts).toBe("string");
    expect(typeof meta.pg_version).toBe("string");
    expect(meta.pg_version).toMatch(/PostgreSQL/);
  });
});
