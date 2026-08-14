import { cookie, randomToken, readCookie, sha256Base64Url, signObject, verifyObject } from './crypto';
import type { AdminSession, Env } from './types';

const SESSION_COOKIE = 'portfolio_admin_session';
const OAUTH_COOKIE = 'portfolio_oauth_state';
const SESSION_SECONDS = 12 * 60 * 60;
const OAUTH_SECONDS = 10 * 60;

type OAuthState = {
  state: string;
  verifier: string;
  returnTo: string;
  exp: number;
};

type GitHubUser = {
  id: number;
  login: string;
};

function isConfigured(env: Env): boolean {
  return (
    Boolean(env.GITHUB_CLIENT_ID) &&
    !env.GITHUB_CLIENT_ID.startsWith('REPLACE_') &&
    Boolean(env.GITHUB_CLIENT_SECRET) &&
    env.SESSION_SIGNING_KEY.length >= 32
  );
}

function secureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

function safeReturnTo(value: string | null): string {
  return value?.startsWith('/admin') ? value : '/admin/';
}

function page(title: string, message: string, status: number): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>html{color-scheme:dark}*{box-sizing:border-box;letter-spacing:0}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0b;color:#f5f5f5;font-family:Inter,system-ui,sans-serif;padding:24px}.box{width:min(460px,100%);border:1px solid #2c2c2f;border-radius:8px;background:#121214;padding:32px}p{color:#a7a7ad;line-height:1.6}a{color:#ff9855}</style></head>
<body><main class="box"><h1>${title}</h1><p>${message}</p><a href="/auth/login">Try another GitHub account</a></main></body></html>`;

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function revokeGitHubToken(env: Env, accessToken: string): Promise<void> {
  const basic = btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`);
  await fetch(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      'User-Agent': 'nicolo-portfolio-analytics',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
}

export async function readAdminSession(request: Request, env: Env): Promise<AdminSession | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !env.SESSION_SIGNING_KEY) return null;

  const session = await verifyObject<AdminSession>(token, env.SESSION_SIGNING_KEY);
  if (
    !session ||
    !Number.isInteger(session.sub) ||
    session.sub !== Number(env.GITHUB_ADMIN_ID) ||
    typeof session.login !== 'string' ||
    session.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return session;
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (!isConfigured(env)) {
    return page('Analytics is not configured', 'Complete the Cloudflare and GitHub OAuth setup before signing in.', 503);
  }

  const requestUrl = new URL(request.url);
  const state = randomToken();
  const verifier = randomToken(48);
  const oauthState: OAuthState = {
    state,
    verifier,
    returnTo: safeReturnTo(requestUrl.searchParams.get('returnTo')),
    exp: Math.floor(Date.now() / 1000) + OAUTH_SECONDS,
  };
  const signedState = await signObject(oauthState, env.SESSION_SIGNING_KEY);
  const callbackUrl = `${requestUrl.origin}/auth/callback`;
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', await sha256Base64Url(verifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('allow_signup', 'false');

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      'Cache-Control': 'no-store',
      'Set-Cookie': cookie(OAUTH_COOKIE, signedState, {
        maxAge: OAUTH_SECONDS,
        path: '/auth',
        secure: secureRequest(request),
      }),
    },
  });
}

export async function handleCallback(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  if (!isConfigured(env)) return page('Analytics is not configured', 'OAuth secrets are missing.', 503);

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const signedState = readCookie(request, OAUTH_COOKIE);
  const oauthState = signedState
    ? await verifyObject<OAuthState>(signedState, env.SESSION_SIGNING_KEY)
    : null;

  if (
    !code ||
    !state ||
    !oauthState ||
    oauthState.state !== state ||
    oauthState.exp <= Math.floor(Date.now() / 1000)
  ) {
    return page('Sign-in failed', 'The OAuth request is missing, expired, or has an invalid state.', 400);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'nicolo-portfolio-analytics',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${requestUrl.origin}/auth/callback`,
      code_verifier: oauthState.verifier,
    }),
  });

  const tokenBody = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenResponse.ok || !tokenBody.access_token) {
    return page('Sign-in failed', 'GitHub did not issue a valid access token.', 401);
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenBody.access_token}`,
      'User-Agent': 'nicolo-portfolio-analytics',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const user = (await userResponse.json()) as Partial<GitHubUser>;
  context.waitUntil(revokeGitHubToken(env, tokenBody.access_token).catch(() => undefined));

  if (!userResponse.ok || user.id !== Number(env.GITHUB_ADMIN_ID) || typeof user.login !== 'string') {
    return page('Access denied', 'This GitHub account is not allowed to view the analytics dashboard.', 403);
  }

  const session: AdminSession = {
    sub: user.id,
    login: user.login,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const token = await signObject(session, env.SESSION_SIGNING_KEY);
  const headers = new Headers({ Location: safeReturnTo(oauthState.returnTo), 'Cache-Control': 'no-store' });
  headers.append(
    'Set-Cookie',
    cookie(SESSION_COOKIE, token, {
      maxAge: SESSION_SECONDS,
      path: '/',
      secure: secureRequest(request),
    }),
  );
  headers.append(
    'Set-Cookie',
    cookie(OAUTH_COOKIE, '', { maxAge: 0, path: '/auth', secure: secureRequest(request) }),
  );

  return new Response(null, { status: 302, headers });
}

export function handleLogout(request: Request): Response {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Cache-Control': 'no-store',
      'Set-Cookie': cookie(SESSION_COOKIE, '', {
        maxAge: 0,
        path: '/',
        secure: secureRequest(request),
      }),
    },
  });
}
