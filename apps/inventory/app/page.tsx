import { count, sql } from "drizzle-orm";

import { db } from "../db";
import { posts } from "../db/schema";
import { DbProbeResult, IDbProbe } from "./_components/DbProbeResult";
import { TerminalLogButton } from "./_components/TerminalLogButton";

// Opt out of Next.js static prerendering. Without this the page is
// rendered at `next build` time inside the Docker builder — where the
// DB_* env vars do not exist — so the probe fails and the "not
// connected" HTML gets frozen into the image, served forever after.
// `force-dynamic` re-runs `probeDb()` on every request, at which point
// the runtime env is populated by the Custom Apps deploy.
export const dynamic = "force-dynamic";

async function probeDb(): Promise<IDbProbe> {
  try {
    const result = await db.execute<{
      db: string;
      ts: string;
      pg_version: string;
    }>(
      sql`SELECT current_database() AS db, NOW() AS ts, version() AS pg_version`,
    );
    const meta = result.rows[0];
    const [{ value: postCount }] = await db
      .select({ value: count() })
      .from(posts);
    return {
      ok: true,
      database: meta.db,
      serverTime: new Date(meta.ts).toISOString(),
      postgresVersion: meta.pg_version,
      postCount,
    };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function Home() {
  const probe = await probeDb();
  return (
    <>
      <h1>Welcome to your Custom App</h1>
      <p>
        Edit <code>app/page.tsx</code> and push to deploy.
      </p>
      <TerminalLogButton />
      <h2>Database connection</h2>
      <DbProbeResult probe={probe} />
    </>
  );
}
