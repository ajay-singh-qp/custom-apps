import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

type ISchema = typeof schema;

declare global {
  // eslint-disable-next-line no-var
  var __customAppsPgPool: Pool | undefined;
}

const pool =
  global.__customAppsPgPool ??
  (global.__customAppsPgPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }));

export const db: NodePgDatabase<ISchema> = drizzle(pool, { schema });
