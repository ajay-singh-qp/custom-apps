import type { IOauthUser } from "@npm-questionpro/questionpro-global-oauth";

export type { IOauthUser };

// Shape of the OAuth token endpoint response (QP OAuth 2).
export interface IOauthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  dc: string;
  global_session_id?: string;
}

// Shape of the state blob we encrypt before sending to QuestionPro.
export interface IStatePayload {
  appOrigin?: string;
  nonce: string;
}
