import type { IOauthUser } from "@npm-questionpro/questionpro-global-oauth";
import { render, screen } from "@testing-library/react";

import { AppShell } from "../../app/_components/AppShell";

const BASE_USER: IOauthUser = {
  accessToken: "access",
  refreshToken: "refresh",
  userId: 42,
  email: "alice@example.com",
  profilePic: "",
  firstName: "Alice",
  lastName: "Doe",
  initials: "AD",
  orgId: 1,
  isAdmin: false,
  defaultProduct: "",
  isPartner: false,
  languageCode: "en",
  oauthCode: "code",
  isAdminLoggedIntoUser: false,
  isMasterAccountLoggedIntoSubAccount: false,
  isPrimaryAccount: true,
};

describe("AppShell", () => {
  test("renders without a user when OAuth is disabled: product name, no account details", () => {
    render(
      <AppShell>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText("My App")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.queryByText(/Alice Doe/)).not.toBeInTheDocument();
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
  });

  test("renders the product name in the header", () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText("My App")).toBeInTheDocument();
  });

  test("renders the signed-in user name", () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText(/Alice Doe/)).toBeInTheDocument();
  });

  test("renders the user email as subtitle", () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  test("falls back to firstName+lastName initials when user.initials is empty", () => {
    render(
      <AppShell user={{ ...BASE_USER, initials: "" }}>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText("AD")).toBeInTheDocument();
  });

  test("renders the Home sidebar item", () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  test("renders the footer text", () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    expect(
      screen.getByText(/My App • Built with Custom Apps/),
    ).toBeInTheDocument();
  });

  test("renders children inside the main content area", () => {
    render(
      <AppShell user={BASE_USER}>
        <div data-testid="page-child">page content</div>
      </AppShell>,
    );
    expect(screen.getByTestId("page-child")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  test('Home sidebar item links to "/"', () => {
    render(
      <AppShell user={BASE_USER}>
        <div>child content</div>
      </AppShell>,
    );
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).not.toBeNull();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
