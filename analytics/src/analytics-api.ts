import { hmacHex } from './crypto';
import {
  classifyReferrer,
  isBot,
  normalizeCountry,
  normalizePath,
  parseClient,
  parseDateRange,
  sanitizeText,
  utcDay,
  validEventId,
  validSessionId,
} from './lib';
import type { CollectPayload, Env } from './types';

const MAX_BODY_BYTES = 4096;
const MAX_VIEWS_PER_MINUTE = 120;

type RequestWithCf = Request & {
  cf?: { country?: string | null };
};

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json;charset=UTF-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': new URL(env.SITE_ORIGIN).origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  return origin === new URL(env.SITE_ORIGIN).origin;
}

function validPayload(value: unknown): value is CollectPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<CollectPayload>;
  return (
    typeof payload.eventId === 'string' &&
    validEventId(payload.eventId) &&
    typeof payload.path === 'string' &&
    typeof payload.title === 'string' &&
    typeof payload.referrer === 'string' &&
    typeof payload.sessionId === 'string' &&
    validSessionId(payload.sessionId)
  );
}

async function visitorHash(request: Request, env: Env): Promise<{ hash: string; browser: string; device: string }> {
  const userAgent = request.headers.get('User-Agent') ?? '';
  const client = parseClient(userAgent);
  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const hash = await hmacHex(env.VISITOR_HASH_KEY, `visitor:v1|${ip}|${client.browser}|${client.os}`);
  return { hash, browser: client.browser, device: client.deviceType };
}

export async function handleCollect(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405, headers: cors });
  if (!originAllowed(request, env)) return json({ error: 'Origin not allowed' }, { status: 403, headers: cors });
  if (!env.VISITOR_HASH_KEY || env.VISITOR_HASH_KEY.length < 32) {
    return json({ error: 'Analytics is not configured' }, { status: 503, headers: cors });
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) return json({ error: 'Payload too large' }, { status: 413, headers: cors });

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, { status: 413, headers: cors });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400, headers: cors });
  }
  if (!validPayload(payload)) return json({ error: 'Invalid payload' }, { status: 400, headers: cors });

  const userAgent = request.headers.get('User-Agent') ?? '';
  if (isBot(userAgent)) return new Response(null, { status: 202, headers: cors });

  const pathname = normalizePath(payload.path, env.SITE_PATH_PREFIX);
  if (!pathname) return json({ error: 'Invalid path' }, { status: 400, headers: cors });

  const now = Date.now();
  const visitor = await visitorHash(request, env);
  const excluded = await env.ANALYTICS_DB.prepare(
    'SELECT 1 AS excluded FROM excluded_visitors WHERE visitor_hash = ?1 LIMIT 1',
  )
    .bind(visitor.hash)
    .first<{ excluded: number }>();
  if (excluded) return new Response(null, { status: 202, headers: cors });

  const recent = await env.ANALYTICS_DB.prepare(
    'SELECT COUNT(*) AS count FROM page_views WHERE visitor_hash = ?1 AND occurred_at >= ?2',
  )
    .bind(visitor.hash, now - 60_000)
    .first<{ count: number }>();
  if (Number(recent?.count ?? 0) >= MAX_VIEWS_PER_MINUTE) {
    return new Response(null, { status: 202, headers: cors });
  }

  const sessionHash = await hmacHex(env.VISITOR_HASH_KEY, `session:v1|${payload.sessionId}`);
  const country = normalizeCountry((request as RequestWithCf).cf?.country);
  const source = classifyReferrer(sanitizeText(payload.referrer, 500), env.SITE_ORIGIN);
  const title = sanitizeText(payload.title, 160);

  await env.ANALYTICS_DB.prepare(
    `INSERT OR IGNORE INTO page_views
      (event_id, occurred_at, day, pathname, page_title, source, country, visitor_hash, session_hash, device_type, browser)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
  )
    .bind(
      payload.eventId,
      now,
      utcDay(now),
      pathname,
      title,
      source,
      country,
      visitor.hash,
      sessionHash,
      visitor.device,
      visitor.browser,
    )
    .run();

  return new Response(null, { status: 202, headers: cors });
}

type QueryWindow = {
  start: number;
  endExclusive: number;
  startDay: string | null;
  endDay: string;
  allTime: boolean;
};

function queryWindow(url: URL): QueryWindow | null {
  const today = utcDay(Date.now());
  if (url.searchParams.get('range') === 'all') {
    return { start: 0, endExclusive: Date.now() + 1, startDay: null, endDay: today, allTime: true };
  }

  const range = parseDateRange(
    url.searchParams.get('start') ?? '',
    url.searchParams.get('end') ?? '',
  );
  return range
    ? {
        start: range.start,
        endExclusive: range.endExclusive,
        startDay: range.startDay,
        endDay: range.endDay,
        allTime: false,
      }
    : null;
}

function rows<T>(result: D1Result<unknown>): T[] {
  return (result.results ?? []) as T[];
}

export async function handleAdminAnalytics(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, { status: 405 });
  const window = queryWindow(new URL(request.url));
  if (!window) return json({ error: 'Invalid date range' }, { status: 400 });

  const period = [window.start, window.endExclusive] as const;
  const todayStart = Date.parse(`${utcDay(Date.now())}T00:00:00.000Z`);
  const yesterdayStart = todayStart - 86_400_000;
  const last7Start = todayStart - 6 * 86_400_000;
  const last30Start = todayStart - 29 * 86_400_000;

  const results = await env.ANALYTICS_DB.batch([
    env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) AS pageViews,
              COUNT(DISTINCT visitor_hash) AS visitors,
              COUNT(DISTINCT session_hash) AS sessions
         FROM page_views WHERE occurred_at >= ?1 AND occurred_at < ?2`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT day, COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS visitors
         FROM page_views
        WHERE occurred_at >= ?1 AND occurred_at < ?2
        GROUP BY day ORDER BY day ASC`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT pathname, COALESCE(MAX(NULLIF(page_title, '')), pathname) AS title,
              COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS visitors
         FROM page_views
        WHERE occurred_at >= ?1 AND occurred_at < ?2
        GROUP BY pathname ORDER BY pageViews DESC LIMIT 10`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT country, COUNT(DISTINCT visitor_hash) AS visitors
         FROM page_views
        WHERE occurred_at >= ?1 AND occurred_at < ?2
        GROUP BY country ORDER BY visitors DESC LIMIT 12`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT source, COUNT(DISTINCT visitor_hash) AS visitors
         FROM page_views
        WHERE occurred_at >= ?1 AND occurred_at < ?2
        GROUP BY source ORDER BY visitors DESC LIMIT 12`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT device_type AS device, COUNT(DISTINCT visitor_hash) AS visitors
         FROM page_views
        WHERE occurred_at >= ?1 AND occurred_at < ?2
        GROUP BY device_type ORDER BY visitors DESC`,
    ).bind(...period),
    env.ANALYTICS_DB.prepare(
      `SELECT COUNT(*) AS totalViews,
              COUNT(DISTINCT visitor_hash) AS totalVisitors,
              SUM(CASE WHEN occurred_at >= ?1 THEN 1 ELSE 0 END) AS todayViews,
              COUNT(DISTINCT CASE WHEN occurred_at >= ?1 THEN visitor_hash END) AS todayVisitors,
              SUM(CASE WHEN occurred_at >= ?2 AND occurred_at < ?1 THEN 1 ELSE 0 END) AS yesterdayViews,
              COUNT(DISTINCT CASE WHEN occurred_at >= ?2 AND occurred_at < ?1 THEN visitor_hash END) AS yesterdayVisitors,
              SUM(CASE WHEN occurred_at >= ?3 THEN 1 ELSE 0 END) AS last7Views,
              COUNT(DISTINCT CASE WHEN occurred_at >= ?3 THEN visitor_hash END) AS last7Visitors,
              SUM(CASE WHEN occurred_at >= ?4 THEN 1 ELSE 0 END) AS last30Views,
              COUNT(DISTINCT CASE WHEN occurred_at >= ?4 THEN visitor_hash END) AS last30Visitors
         FROM page_views`,
    ).bind(todayStart, yesterdayStart, last7Start, last30Start),
  ]);

  return json({
    range: {
      start: window.startDay,
      end: window.endDay,
      allTime: window.allTime,
      timezone: 'UTC',
    },
    summary: rows<Record<string, number>>(results[0])[0] ?? { pageViews: 0, visitors: 0, sessions: 0 },
    daily: rows<Record<string, number | string>>(results[1]),
    topPages: rows<Record<string, number | string>>(results[2]),
    countries: rows<Record<string, number | string>>(results[3]),
    sources: rows<Record<string, number | string>>(results[4]),
    devices: rows<Record<string, number | string>>(results[5]),
    context: rows<Record<string, number>>(results[6])[0] ?? {},
  });
}

export async function handleExcludeMe(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const visitor = await visitorHash(request, env);
  await env.ANALYTICS_DB.batch([
    env.ANALYTICS_DB.prepare(
      `INSERT INTO excluded_visitors (visitor_hash, created_at, note)
       VALUES (?1, ?2, 'Admin browser/network')
       ON CONFLICT(visitor_hash) DO UPDATE SET created_at = excluded.created_at`,
    ).bind(visitor.hash, Date.now()),
    env.ANALYTICS_DB.prepare('DELETE FROM page_views WHERE visitor_hash = ?1').bind(visitor.hash),
  ]);

  return json({ excluded: true });
}
