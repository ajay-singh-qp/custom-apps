"use client";

import dynamic from "next/dynamic";

import type { IAppShellProps } from "./AppShell";

// wick-ui's header reads `window` while rendering, so the shell can't be
// server-rendered. Load it in the browser only; the server sends nothing for
// the shell and the client renders it on hydration.
const BrowserOnlyAppShell = dynamic(
  () => import("./AppShell").then((mod) => mod.AppShell),
  { ssr: false },
);

export function ClientAppShell(props: IAppShellProps) {
  return <BrowserOnlyAppShell {...props} />;
}
