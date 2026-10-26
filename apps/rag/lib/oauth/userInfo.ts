import type { IQuestionProUserInfoApiData } from "@npm-questionpro/questionpro-global-oauth";

import { OAUTH_ME_PATH } from "./constants";

const USER_INFO_ERROR_PREFIX = "User info fetch failed";

export async function fetchUserInfo(
  host: string,
  accessToken: string,
): Promise<IQuestionProUserInfoApiData> {
  let response: Response;
  try {
    response = await fetch(`${host}${OAUTH_ME_PATH}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    throw new Error(
      `${USER_INFO_ERROR_PREFIX}: network error - ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!response.ok) {
    throw new Error(`${USER_INFO_ERROR_PREFIX}: status ${response.status}`);
  }
  const parsed = (await response.json()) as IQuestionProUserInfoApiData;
  if (!parsed.userID || !parsed.emailAddress) {
    throw new Error(
      `${USER_INFO_ERROR_PREFIX}: response missing required fields`,
    );
  }
  return parsed;
}
