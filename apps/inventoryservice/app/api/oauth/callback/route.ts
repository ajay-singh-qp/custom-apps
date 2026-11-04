import { NextRequest, NextResponse } from "next/server";

import { oauthDisabledResponse } from "@/lib/oauth/disabled";
import { getOauthEnv } from "@/lib/oauth/env";
import { getSession } from "@/lib/oauth/session";
import { decryptState } from "@/lib/oauth/state";
import { exchangeCodeForTokens } from "@/lib/oauth/tokens";
import type { IOauthUser } from "@/lib/oauth/types";
import { fetchUserInfo } from "@/lib/oauth/userInfo";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const disabled = oauthDisabledResponse();
  if (disabled) return disabled;
  const env = getOauthEnv();
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  if (!code || !stateParam) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }
  const state = decryptState(stateParam, env.encryptionKey);
  const host = state.appOrigin ?? env.hostUrl;
  const tokens = await exchangeCodeForTokens(
    host,
    code,
    env.clientId,
    env.redirectUri,
  );
  const userInfo = await fetchUserInfo(host, tokens.access_token);
  const user: IOauthUser = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : undefined,
    userId: userInfo.userID,
    email: userInfo.emailAddress,
    profilePic: userInfo.profilePic ?? "",
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    initials:
      userInfo.initials ??
      `${userInfo.firstName?.[0] ?? ""}${userInfo.lastName?.[0] ?? ""}`,
    orgId: userInfo.orgID,
    isAdmin: userInfo.isAdmin ?? false,
    defaultProduct: userInfo.defaultProductUponLogin ?? "",
    isPartner: userInfo.isPartner ?? false,
    languageCode: userInfo.languageCode ?? "en",
    oauthCode: code,
    dc: tokens.dc,
    appOrigin: host,
    isAdminLoggedIntoUser: userInfo.isAdminLoggedIntoUser ?? false,
    isMasterAccountLoggedIntoSubAccount:
      userInfo.isMasterAccountLoggedIntoSubAccount ?? false,
    isPrimaryAccount: userInfo.isPrimaryAccount ?? true,
    globalSessionId: tokens.global_session_id,
  };
  const session = await getSession();
  session.user = user;
  await session.save();
  return NextResponse.redirect(env.successRedirectUrl);
}
