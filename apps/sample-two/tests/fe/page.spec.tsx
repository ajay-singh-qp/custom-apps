import { render, screen } from "@testing-library/react";

import { DbProbeResult } from "../../app/_components/DbProbeResult";

describe("DbProbeResult", () => {
  test("renders connected state with database name and post count", () => {
    render(
      <DbProbeResult
        probe={{
          ok: true,
          database: "mydb",
          serverTime: "2026-01-01T00:00:00.000Z",
          postgresVersion: "PostgreSQL 17.0",
          postCount: 3,
        }}
      />,
    );
    expect(screen.getByText(/Connected to mydb/)).toBeInTheDocument();
    expect(screen.getByText(/3 rows/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-01/)).toBeInTheDocument();
  });

  test("renders not-connected state with error message", () => {
    render(
      <DbProbeResult
        probe={{
          ok: false,
          errorMessage: "connection refused",
        }}
      />,
    );
    expect(screen.getByText(/Not connected/)).toBeInTheDocument();
    expect(screen.getByText(/connection refused/)).toBeInTheDocument();
  });

  test("connected state does not show error message", () => {
    render(
      <DbProbeResult
        probe={{
          ok: true,
          database: "mydb",
          serverTime: "2026-01-01T00:00:00.000Z",
          postgresVersion: "PostgreSQL 17.0",
          postCount: 0,
        }}
      />,
    );
    expect(screen.queryByText(/Not connected/)).not.toBeInTheDocument();
  });

  test("not-connected state does not show database name", () => {
    render(
      <DbProbeResult
        probe={{
          ok: false,
          errorMessage: "timeout",
        }}
      />,
    );
    expect(screen.queryByText(/Connected to/)).not.toBeInTheDocument();
  });

  test("renders zero post count", () => {
    render(
      <DbProbeResult
        probe={{
          ok: true,
          database: "testdb",
          serverTime: "2026-01-01T00:00:00.000Z",
          postgresVersion: "PostgreSQL 17.0",
          postCount: 0,
        }}
      />,
    );
    expect(screen.getByText(/0 rows/)).toBeInTheDocument();
  });
});
