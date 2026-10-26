import type { Metadata } from "next";

import "@npm-questionpro/wick-ui-icon/dist/wu-icon.css";
import "@npm-questionpro/wick-ui-lib/dist/style.css";

import { ClientAppShell } from "./_components/ClientAppShell";
import { resolveShellUser } from "@/lib/oauth/shell-user";

// Render every page per request. QUESTIONPRO_OAUTH_ENABLED is set when the
// container starts, so it must be read at request time, never baked in at
// build. (Before the flag, the session read made this implicit.)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom App",
  description: "Scaffolded by Custom Apps",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `null` while OAuth is off (QUESTIONPRO_OAUTH_ENABLED unset).
  const user = await resolveShellUser();
  return (
    <html lang="en">
      <body>
        <ClientAppShell user={user ?? undefined}>{children}</ClientAppShell>
      </body>
    </html>
  );
}
