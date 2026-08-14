import { handleAdminAnalytics, handleCollect, handleExcludeMe } from './analytics-api';
import { handleCallback, handleLogin, handleLogout, readAdminSession } from './auth';
import type { Env } from './types';

function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: location, 'Cache-Control': 'no-store' } });
}

function secureAdminAsset(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function route(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/collect') return handleCollect(request, env);
  if (path === '/auth/login') return handleLogin(request, env);
  if (path === '/auth/callback') return handleCallback(request, env, context);
  if (path === '/auth/logout') return handleLogout(request);

  if (path.startsWith('/api/admin/') || path === '/admin' || path.startsWith('/admin/')) {
    const session = await readAdminSession(request, env);
    if (!session) {
      if (path.startsWith('/api/admin/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-store' },
        });
      }
      return redirect(`/auth/login?returnTo=${encodeURIComponent(`${path}${url.search}`)}`);
    }

    if (path === '/api/admin/analytics') return handleAdminAnalytics(request, env);
    if (path === '/api/admin/exclude-me') return handleExcludeMe(request, env);
    if (path.startsWith('/api/admin/')) return new Response('Not found', { status: 404 });

    return secureAdminAsset(await env.ASSETS.fetch(request));
  }

  if (path === '/') return redirect('/admin/');
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env, context): Promise<Response> {
    try {
      return await route(request, env, context);
    } catch (error) {
      console.error('Unhandled analytics worker error', error);
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      });
    }
  },
} satisfies ExportedHandler<Env>;
