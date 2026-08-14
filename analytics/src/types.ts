export interface Env {
  ANALYTICS_DB: D1Database;
  ASSETS: Fetcher;
  SITE_ORIGIN: string;
  SITE_PATH_PREFIX: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_ADMIN_ID: string;
  VISITOR_HASH_KEY: string;
  SESSION_SIGNING_KEY: string;
  GITHUB_CLIENT_SECRET: string;
}

export type CollectPayload = {
  eventId: string;
  path: string;
  title: string;
  referrer: string;
  sessionId: string;
};

export type AdminSession = {
  sub: number;
  login: string;
  exp: number;
};
