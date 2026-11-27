import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Same env files and precedence as `next dev` (dev mode: drizzle-kit only
// runs on a laptop). The platform-generated `.env.development` carries this
// app's DB_* for local development.
const DEV_MODE = true;
loadEnvConfig(process.cwd(), DEV_MODE);

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: false,
  },
});
