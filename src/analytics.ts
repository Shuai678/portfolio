const SESSION_KEY = 'portfolio.analytics.session';
const OPT_OUT_KEY = 'portfolio.analytics.optOut';
const SESSION_TTL_MS = 30 * 60 * 1000;

type AnalyticsSession = {
  id: string;
  lastActivity: number;
  landingReferrer: string;
};

type NavigatorWithPrivacySignals = Navigator & {
  globalPrivacyControl?: boolean;
};

function randomId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
}

function referrerOrigin(referrer: string): string {
  if (!referrer) return '';

  try {
    return new URL(referrer).origin;
  } catch {
    return '';
  }
}

function updateOptOutPreference(): void {
  const preference = new URLSearchParams(window.location.search).get('analytics');

  try {
    if (preference === 'off') {
      localStorage.setItem(OPT_OUT_KEY, '1');
    } else if (preference === 'on') {
      localStorage.removeItem(OPT_OUT_KEY);
    }
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
}

function hasOptedOut(): boolean {
  const privacyNavigator = navigator as NavigatorWithPrivacySignals;

  if (navigator.doNotTrack === '1' || privacyNavigator.globalPrivacyControl === true) {
    return true;
  }

  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

function getSession(): AnalyticsSession {
  const now = Date.now();

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored) as Partial<AnalyticsSession>;
      if (
        typeof session.id === 'string' &&
        typeof session.lastActivity === 'number' &&
        typeof session.landingReferrer === 'string' &&
        now - session.lastActivity < SESSION_TTL_MS
      ) {
        const refreshed = {
          ...session,
          lastActivity: now,
          landingReferrer: referrerOrigin(session.landingReferrer),
        } as AnalyticsSession;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
        return refreshed;
      }
    }

    const created: AnalyticsSession = {
      id: randomId(),
      lastActivity: now,
      landingReferrer: referrerOrigin(document.referrer),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(created));
    return created;
  } catch {
    return {
      id: randomId(),
      lastActivity: now,
      landingReferrer: referrerOrigin(document.referrer),
    };
  }
}

function normalizedPath(): string {
  let pathname = window.location.pathname.replace(/\/{2,}/g, '/');
  const prefix = (import.meta.env.VITE_ANALYTICS_PATH_PREFIX ?? '/portfolio').replace(/\/$/, '');

  if (prefix && pathname === prefix) {
    return '/';
  }

  if (prefix && pathname.startsWith(`${prefix}/`)) {
    pathname = pathname.slice(prefix.length);
  }

  return pathname || '/';
}

function canTrack(endpoint: string): boolean {
  const allowedHosts = (import.meta.env.VITE_ANALYTICS_HOSTS ?? 'shuai678.github.io')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return (
    import.meta.env.PROD &&
    endpoint.startsWith('https://') &&
    allowedHosts.includes(window.location.hostname.toLowerCase()) &&
    !hasOptedOut()
  );
}

function sendPageView(endpoint: string): void {
  const session = getSession();
  const payload = {
    eventId: randomId(),
    path: normalizedPath(),
    title: document.title,
    referrer: session.landingReferrer,
    sessionId: session.id,
  };

  void fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Analytics must never affect the portfolio experience.
  });
}

export function startAnalytics(): void {
  updateOptOutPreference();

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim();
  if (!endpoint || !canTrack(endpoint)) {
    return;
  }

  let lastTrackedPath = '';
  let scheduled = false;

  const trackCurrentPath = () => {
    scheduled = false;
    const path = normalizedPath();
    if (path === lastTrackedPath) {
      return;
    }

    lastTrackedPath = path;
    sendPageView(endpoint);
  };

  const scheduleTracking = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(trackCurrentPath, 0);
  };

  const pushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    pushState(...args);
    scheduleTracking();
  };

  const replaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    replaceState(...args);
    scheduleTracking();
  };

  window.addEventListener('popstate', scheduleTracking);
  scheduleTracking();
}
