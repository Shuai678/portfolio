const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|uptimerobot|pingdom|monitoring/i;

export type ClientInfo = {
  browser: string;
  deviceType: string;
  os: string;
};

export type DateRange = {
  start: number;
  endExclusive: number;
  startDay: string;
  endDay: string;
  days: number;
};

export function isBot(userAgent: string): boolean {
  return !userAgent.trim() || BOT_PATTERN.test(userAgent);
}

export function parseClient(userAgent: string): ClientInfo {
  const browser = /edg\//i.test(userAgent)
    ? 'Edge'
    : /opr\/|opera/i.test(userAgent)
      ? 'Opera'
      : /samsungbrowser/i.test(userAgent)
        ? 'Samsung Internet'
        : /chrome\//i.test(userAgent)
          ? 'Chrome'
          : /firefox\//i.test(userAgent)
            ? 'Firefox'
            : /safari\//i.test(userAgent)
              ? 'Safari'
              : 'Other';

  const deviceType = /ipad|tablet|playbook|silk/i.test(userAgent)
    ? 'Tablet'
    : /mobi|iphone|ipod|android/i.test(userAgent)
      ? 'Mobile'
      : 'Desktop';

  const os = /iphone|ipad|ipod/i.test(userAgent)
    ? 'iOS'
    : /android/i.test(userAgent)
      ? 'Android'
      : /windows/i.test(userAgent)
        ? 'Windows'
        : /macintosh|mac os x/i.test(userAgent)
          ? 'macOS'
          : /linux/i.test(userAgent)
            ? 'Linux'
            : 'Other';

  return { browser, deviceType, os };
}

export function normalizePath(path: string, prefix = ''): string | null {
  if (typeof path !== 'string') return null;

  let normalized = path.trim().split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
  if (!normalized.startsWith('/') || normalized.length > 180 || /[\u0000-\u001f]/.test(normalized)) {
    return null;
  }

  const cleanPrefix = prefix.trim().replace(/\/$/, '');
  if (cleanPrefix && normalized === cleanPrefix) {
    normalized = '/';
  } else if (cleanPrefix && normalized.startsWith(`${cleanPrefix}/`)) {
    normalized = normalized.slice(cleanPrefix.length);
  }

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/$/, '');
  }

  return normalized || '/';
}

export function sanitizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
    : '';
}

export function classifyReferrer(referrer: string, siteOrigin: string): string {
  if (!referrer) return 'Direct / Unknown';

  try {
    const url = new URL(referrer);
    const siteHost = new URL(siteOrigin).hostname.replace(/^www\./, '').toLowerCase();
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === siteHost) return 'Internal';
    if (/(^|\.)google\./.test(host)) return 'Google';
    if (host === 'bing.com' || host.endsWith('.bing.com')) return 'Bing';
    if (host === 'duckduckgo.com' || host.endsWith('.duckduckgo.com')) return 'DuckDuckGo';
    if (host === 'baidu.com' || host.endsWith('.baidu.com')) return 'Baidu';
    if (host === 'github.com' || host.endsWith('.github.com')) return 'GitHub';
    if (/weixin\.qq\.com$|wechat\.com$/.test(host)) return 'WeChat';
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
      return 'X / Twitter';
    }
    if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'Facebook';
    if (host === 'reddit.com' || host.endsWith('.reddit.com')) return 'Reddit';
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'LinkedIn';

    return host.slice(0, 100) || 'Direct / Unknown';
  } catch {
    return 'Direct / Unknown';
  }
}

export function validEventId(value: string): boolean {
  return /^[a-zA-Z0-9-]{16,64}$/.test(value);
}

export function validSessionId(value: string): boolean {
  return /^[a-zA-Z0-9-]{16,128}$/.test(value);
}

export function normalizeCountry(value: unknown): string {
  const country = typeof value === 'string' ? value.toUpperCase() : '';
  return /^[A-Z]{2}$/.test(country) ? country : 'XX';
}

export function utcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && utcDay(timestamp) === value ? timestamp : null;
}

export function parseDateRange(startDay: string, endDay: string): DateRange | null {
  const start = parseDay(startDay);
  const end = parseDay(endDay);
  if (start === null || end === null || end < start) return null;

  const days = Math.floor((end - start) / 86_400_000) + 1;
  if (days > 3660) return null;

  return {
    start,
    endExclusive: end + 86_400_000,
    startDay,
    endDay,
    days,
  };
}
