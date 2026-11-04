"use client";

import type { IOauthUser } from "@npm-questionpro/questionpro-global-oauth";
import {
  WuAppHeader,
  WuFooter,
  WuSidebar,
  WuSidebarContent,
  WuSidebarGroup,
  WuSidebarItem,
  WuSidebarMenu,
} from "@npm-questionpro/wick-ui-lib";
import Link from "next/link";
import React from "react";

import classes from "./AppShell.module.css";
import { LogoutForm } from "./LogoutForm";

const PRODUCT_NAME = "My App";
const HOME_LINK = "/";
const FOOTER_TEXT = "My App • Built with Custom Apps";

export interface IAppShellProps {
  children: React.ReactNode;
  // Absent while OAuth is off: the header then shows no account menu/logout.
  user?: IOauthUser;
}

function toHeaderAccount(user: IOauthUser) {
  return {
    profile: {
      title: `${user.firstName} ${user.lastName}`,
      subtitle: user.email,
      initials:
        user.initials || `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`,
    },
  };
}

const SidebarNav: React.FC = () => (
  <WuSidebarContent>
    <WuSidebarGroup label="Navigation">
      <WuSidebarMenu>
        {/* Replace with your own navigation items. */}
        <WuSidebarItem Icon={<i className="wm-home" aria-hidden />} isActive>
          <Link href={HOME_LINK} className={classes.sidebarNavLink}>
            Home
          </Link>
        </WuSidebarItem>
      </WuSidebarMenu>
    </WuSidebarGroup>
  </WuSidebarContent>
);

export const AppShell: React.FC<IAppShellProps> = ({ children, user }) => (
  <LogoutForm>
    {(handleLogout) => (
      <div className={classes.appLayout}>
        <WuAppHeader
          productName={PRODUCT_NAME}
          homeLink={HOME_LINK}
          categories={[]}
          user={user ? toHeaderAccount(user) : undefined}
          onLogout={user ? handleLogout : undefined}
        />
        <div className={classes.appLayoutBody}>
          <WuSidebar
            Sidebar={<SidebarNav />}
            className={classes.appLayoutSidebar}
          >
            <main className={classes.appLayoutContent}>{children}</main>
          </WuSidebar>
        </div>
        <WuFooter className={classes.appLayoutFooter}>{FOOTER_TEXT}</WuFooter>
      </div>
    )}
  </LogoutForm>
);
