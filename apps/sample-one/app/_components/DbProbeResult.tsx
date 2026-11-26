"use client";

interface IDbProbeSuccess {
  ok: true;
  database: string;
  serverTime: string;
  postgresVersion: string;
  postCount: number;
}

interface IDbProbeFailure {
  ok: false;
  errorMessage: string;
}

export type IDbProbe = IDbProbeSuccess | IDbProbeFailure;

export function DbProbeResult({ probe }: { probe: IDbProbe }) {
  return (
    <div>
      {probe.ok ? (
        <div style={{ color: "#1e7c3a" }}>
          <p>✓ Connected to {probe.database}.</p>
          <p>Server time: {probe.serverTime}</p>
          <p>Postgres version: {probe.postgresVersion}</p>
          <p>Posts: {probe.postCount} rows</p>
        </div>
      ) : (
        <div style={{ color: "#b8281a" }}>
          <p>✗ Not connected.</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{probe.errorMessage}</pre>
          <p>
            Check that the postgres container is running (
            <code>docker compose -f docker-compose.dev.yml up -d</code>) and the{" "}
            <code>DB_*</code> vars in <code>.env.local</code> match your setup.
          </p>
        </div>
      )}
    </div>
  );
}
