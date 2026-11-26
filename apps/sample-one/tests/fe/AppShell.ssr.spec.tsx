// @vitest-environment node
// Server rendering has no `window`. wick-ui's header reads `window` while
// rendering, so the shell must only render in the browser.
import { renderToString } from "react-dom/server";

import { AppShell } from "../../app/_components/AppShell";
import { ClientAppShell } from "../../app/_components/ClientAppShell";

describe("AppShell on the server", () => {
  test("rendering the wick-ui shell directly on the server fails (why ClientAppShell exists)", () => {
    expect(() =>
      renderToString(
        <AppShell>
          <div>child</div>
        </AppShell>,
      ),
    ).toThrow(/window is not defined/);
  });

  test("ClientAppShell server-renders without touching window", () => {
    expect(() =>
      renderToString(
        <ClientAppShell>
          <div>child</div>
        </ClientAppShell>,
      ),
    ).not.toThrow();
  });
});
