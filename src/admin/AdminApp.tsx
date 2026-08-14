import {
  Activity,
  CalendarDays,
  Eye,
  FileText,
  Gauge,
  Globe2,
  Link2,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  ShieldOff,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Summary = { pageViews: number; visitors: number; sessions: number };
type DailyPoint = { day: string; pageViews: number; visitors: number };
type PageRow = { pathname: string; title: string; pageViews: number; visitors: number };
type CountryRow = { country: string; visitors: number };
type SourceRow = { source: string; visitors: number };
type DeviceRow = { device: string; visitors: number };
type Context = {
  totalViews: number;
  totalVisitors: number;
  todayViews: number;
  todayVisitors: number;
  yesterdayViews: number;
  yesterdayVisitors: number;
  last7Views: number;
  last7Visitors: number;
  last30Views: number;
  last30Visitors: number;
};

type AnalyticsData = {
  range: { start: string | null; end: string; allTime: boolean; timezone: string };
  summary: Summary;
  daily: DailyPoint[];
  topPages: PageRow[];
  countries: CountryRow[];
  sources: SourceRow[];
  devices: DeviceRow[];
  context: Context;
};

type Preset = 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom';
type Range = { start: string; end: string; allTime: boolean };

const presets: Array<{ id: Preset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const numberFormat = new Intl.NumberFormat('en-US');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function utcDate(offsetDays = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function rangeForPreset(preset: Preset, customStart: string, customEnd: string): Range {
  if (preset === 'all') return { start: '', end: utcDate(), allTime: true };
  if (preset === 'custom') return { start: customStart, end: customEnd, allTime: false };
  if (preset === 'today') return { start: utcDate(), end: utcDate(), allTime: false };
  if (preset === 'yesterday') return { start: utcDate(-1), end: utcDate(-1), allTime: false };
  const offset = preset === '7d' ? -6 : -29;
  return { start: utcDate(offset), end: utcDate(), allTime: false };
}

function formatNumber(value: number): string {
  return numberFormat.format(Number(value) || 0);
}

function formatShortDay(day: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  );
}

function rangeLabel(data: AnalyticsData | null): string {
  if (!data) return 'Loading';
  if (data.range.allTime) return 'All time';
  if (data.range.start === data.range.end) return formatShortDay(data.range.end);
  return `${formatShortDay(data.range.start ?? data.range.end)} - ${formatShortDay(data.range.end)}`;
}

function mockData(): AnalyticsData {
  const daily = Array.from({ length: 30 }, (_, index) => {
    const day = utcDate(index - 29);
    const wave = Math.round(16 + Math.sin(index / 2.7) * 7 + index * 0.45);
    return { day, pageViews: wave * 2 + (index % 4) * 3, visitors: wave };
  });
  return {
    range: {
      start: daily[0].day,
      end: daily[daily.length - 1]?.day ?? utcDate(),
      allTime: false,
      timezone: 'UTC',
    },
    summary: { pageViews: 1312, visitors: 694, sessions: 812 },
    daily,
    topPages: [
      { pathname: '/', title: 'Shuai Zilong Nicolò - Portfolio', pageViews: 984, visitors: 612 },
      { pathname: '/projects', title: 'Projects', pageViews: 208, visitors: 164 },
      { pathname: '/about', title: 'About', pageViews: 120, visitors: 91 },
    ],
    countries: [
      { country: 'IT', visitors: 288 },
      { country: 'CN', visitors: 174 },
      { country: 'US', visitors: 102 },
      { country: 'DE', visitors: 46 },
      { country: 'JP', visitors: 29 },
    ],
    sources: [
      { source: 'Google', visitors: 262 },
      { source: 'Direct / Unknown', visitors: 224 },
      { source: 'GitHub', visitors: 118 },
      { source: 'LinkedIn', visitors: 54 },
      { source: 'WeChat', visitors: 36 },
    ],
    devices: [
      { device: 'Desktop', visitors: 401 },
      { device: 'Mobile', visitors: 272 },
      { device: 'Tablet', visitors: 21 },
    ],
    context: {
      totalViews: 2950,
      totalVisitors: 1284,
      todayViews: 84,
      todayVisitors: 46,
      yesterdayViews: 71,
      yesterdayVisitors: 39,
      last7Views: 488,
      last7Visitors: 271,
      last30Views: 1312,
      last30Visitors: 694,
    },
  };
}

async function fetchAnalytics(range: Range, signal: AbortSignal): Promise<AnalyticsData> {
  if (import.meta.env.DEV) return mockData();

  const search = range.allTime
    ? new URLSearchParams({ range: 'all' })
    : new URLSearchParams({ start: range.start, end: range.end });
  const response = await fetch(`/api/admin/analytics?${search}`, {
    credentials: 'same-origin',
    signal,
  });

  if (response.status === 401) {
    window.location.assign('/auth/login?returnTo=/admin/');
    throw new Error('Your session has expired.');
  }
  if (!response.ok) throw new Error('Analytics data could not be loaded.');
  return (await response.json()) as AnalyticsData;
}

function fillDaily(points: DailyPoint[], dataRange: AnalyticsData['range']): DailyPoint[] {
  if (!points.length) return [];
  const byDay = new Map(points.map((point) => [point.day, point]));
  const startDay = dataRange.allTime ? points[0].day : (dataRange.start ?? points[0].day);
  const cursor = new Date(`${startDay}T00:00:00Z`);
  const end = new Date(`${dataRange.end}T00:00:00Z`);
  const filled: DailyPoint[] = [];

  while (cursor <= end && filled.length < 3660) {
    const day = cursor.toISOString().slice(0, 10);
    filled.push(byDay.get(day) ?? { day, pageViews: 0, visitors: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return filled;
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <div className="metric-icon" aria-hidden="true"><Icon size={18} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function TrafficChart({ points }: { points: DailyPoint[] }) {
  const width = 900;
  const height = 260;
  const padding = { top: 20, right: 18, bottom: 34, left: 42 };
  const maxValue = Math.max(1, ...points.flatMap((point) => [point.pageViews, point.visitors]));
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const y = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;
  const line = (key: 'pageViews' | 'visitors') =>
    points.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');
  const labelIndexes = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])).filter(
    (index) => index >= 0,
  );

  if (!points.length) return <div className="empty-state">No traffic recorded for this period.</div>;

  return (
    <div className="chart-wrap">
      <svg className="traffic-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Page views and visitors over time">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const gridY = padding.top + chartHeight * ratio;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={gridY} y2={gridY} className="chart-grid" />
              <text x={padding.left - 9} y={gridY + 4} textAnchor="end" className="chart-axis">
                {Math.round(maxValue * (1 - ratio))}
              </text>
            </g>
          );
        })}
        <polyline points={line('pageViews')} className="chart-line chart-line-views" />
        <polyline points={line('visitors')} className="chart-line chart-line-visitors" />
        {points.map((point, index) => (
          <g key={point.day}>
            <circle cx={x(index)} cy={y(point.pageViews)} r="3" className="chart-point chart-point-views">
              <title>{`${formatShortDay(point.day)}: ${point.pageViews} page views`}</title>
            </circle>
            <circle cx={x(index)} cy={y(point.visitors)} r="3" className="chart-point chart-point-visitors">
              <title>{`${formatShortDay(point.day)}: ${point.visitors} visitors`}</title>
            </circle>
          </g>
        ))}
        {labelIndexes.map((index) => (
          <text key={index} x={x(index)} y={height - 8} textAnchor="middle" className="chart-axis chart-date">
            {formatShortDay(points[index].day)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Distribution({ rows, label }: { rows: Array<{ name: string; value: number }>; label: string }) {
  const total = rows.reduce((sum, row) => sum + Number(row.value), 0);
  if (!rows.length) return <div className="empty-state">No {label.toLowerCase()} data for this period.</div>;

  return (
    <div className="distribution-list">
      {rows.map((row) => {
        const percent = total ? (Number(row.value) / total) * 100 : 0;
        return (
          <div className="distribution-row" key={row.name}>
            <div className="distribution-label"><span>{row.name}</span><strong>{formatNumber(row.value)}</strong></div>
            <div className="distribution-track" aria-label={`${row.name}: ${percent.toFixed(1)}%`}>
              <span style={{ width: `${Math.max(percent, 1.5)}%` }} />
            </div>
            <small>{percent.toFixed(1)}%</small>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminApp() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customStart, setCustomStart] = useState(utcDate(-29));
  const [customEnd, setCustomEnd] = useState(utcDate());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showExclusion, setShowExclusion] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const range = useMemo(() => rangeForPreset(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const load = useCallback((signal: AbortSignal) => {
    if (!range.allTime && (!range.start || !range.end || range.start > range.end)) {
      setError('Choose a valid UTC date range.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    void fetchAnalytics(range, signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Analytics data could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const daily = useMemo(() => (data ? fillDaily(data.daily, data.range) : []), [data]);
  const pagesPerVisitor = data?.summary.visitors ? data.summary.pageViews / data.summary.visitors : 0;

  const excludeCurrentVisitor = async () => {
    setExcluding(true);
    try {
      if (!import.meta.env.DEV) {
        const response = await fetch('/api/admin/exclude-me', { method: 'POST', credentials: 'same-origin' });
        if (!response.ok) throw new Error('This visitor could not be excluded.');
      }
      setShowExclusion(false);
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This visitor could not be excluded.');
    } finally {
      setExcluding(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/admin/" aria-label="Nicolò Shuai analytics home">
          <span>NS</span><div><strong>Nicolò Shuai</strong><small>Private analytics</small></div>
        </a>
        <div className="header-actions">
          <button className="icon-button" type="button" title="Exclude my visits" onClick={() => setShowExclusion(true)}>
            <ShieldOff size={18} /><span className="sr-only">Exclude my visits</span>
          </button>
          <button className="icon-button" type="button" title="Refresh data" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} /><span className="sr-only">Refresh data</span>
          </button>
          <form action="/auth/logout" method="post">
            <button className="icon-button" type="submit" title="Sign out"><LogOut size={18} /><span className="sr-only">Sign out</span></button>
          </form>
        </div>
      </header>

      <main className="admin-main">
        <div className="dashboard-heading">
          <div><p className="eyebrow">Analytics dashboard</p><h1>{rangeLabel(data)}</h1></div>
          <span className="timezone"><CalendarDays size={15} /> UTC</span>
        </div>

        <div className="range-toolbar" aria-label="Analytics date range">
          <div className="preset-list">
            {presets.map((item) => (
              <button key={item.id} type="button" className={preset === item.id ? 'active' : ''} onClick={() => setPreset(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="custom-range">
              <label>From<input type="date" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} /></label>
              <label>To<input type="date" value={customEnd} min={customStart} max={utcDate()} onChange={(event) => setCustomEnd(event.target.value)} /></label>
            </div>
          )}
        </div>

        {error && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError('')} title="Dismiss"><X size={16} /></button></div>}

        <section className="metrics-grid" aria-label="Selected period summary">
          <MetricCard icon={Eye} label="Total views" value={loading ? '—' : formatNumber(data?.summary.pageViews ?? 0)} detail="Selected period" />
          <MetricCard icon={Users} label="Unique visitors" value={loading ? '—' : formatNumber(data?.summary.visitors ?? 0)} detail="Privacy-preserving estimate" />
          <MetricCard icon={Activity} label="Sessions" value={loading ? '—' : formatNumber(data?.summary.sessions ?? 0)} detail="30-minute window" />
          <MetricCard icon={Gauge} label="Views / visitor" value={loading ? '—' : pagesPerVisitor.toFixed(1)} detail="Selected period" />
        </section>

        <section className="context-strip" aria-label="Traffic snapshots">
          <div><span>Today</span><strong>{formatNumber(data?.context.todayViews ?? 0)}</strong><small>{formatNumber(data?.context.todayVisitors ?? 0)} visitors</small></div>
          <div><span>Yesterday</span><strong>{formatNumber(data?.context.yesterdayViews ?? 0)}</strong><small>{formatNumber(data?.context.yesterdayVisitors ?? 0)} visitors</small></div>
          <div><span>Last 7 days</span><strong>{formatNumber(data?.context.last7Views ?? 0)}</strong><small>{formatNumber(data?.context.last7Visitors ?? 0)} visitors</small></div>
          <div><span>Last 30 days</span><strong>{formatNumber(data?.context.last30Views ?? 0)}</strong><small>{formatNumber(data?.context.last30Visitors ?? 0)} visitors</small></div>
          <div><span>All time</span><strong>{formatNumber(data?.context.totalViews ?? 0)}</strong><small>{formatNumber(data?.context.totalVisitors ?? 0)} visitors</small></div>
        </section>

        <section className="panel traffic-panel">
          <div className="panel-heading"><div><Activity size={18} /><h2>Traffic overview</h2></div><div className="legend"><span className="views">Page views</span><span className="visitors">Visitors</span></div></div>
          {loading ? <div className="loading-block" /> : <TrafficChart points={daily} />}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><FileText size={18} /><h2>Top pages</h2></div></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Page</th><th>Views</th><th>Visitors</th></tr></thead>
              <tbody>
                {data?.topPages.length ? data.topPages.map((page) => (
                  <tr key={page.pathname}><td><strong>{page.pathname}</strong><span>{page.title}</span></td><td>{formatNumber(page.pageViews)}</td><td>{formatNumber(page.visitors)}</td></tr>
                )) : <tr><td colSpan={3} className="table-empty">No pages recorded for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-heading"><div><Globe2 size={18} /><h2>Countries</h2></div><span>Visitors</span></div>
            <Distribution label="Countries" rows={(data?.countries ?? []).map((row) => ({ name: row.country === 'XX' ? 'Unknown' : (regionNames.of(row.country) ?? row.country), value: row.visitors }))} />
          </section>
          <section className="panel">
            <div className="panel-heading"><div><Link2 size={18} /><h2>Traffic sources</h2></div><span>Visitors</span></div>
            <Distribution label="Sources" rows={(data?.sources ?? []).map((row) => ({ name: row.source, value: row.visitors }))} />
          </section>
        </div>

        <section className="panel device-panel">
          <div className="panel-heading"><div><MonitorSmartphone size={18} /><h2>Devices</h2></div><span>Unique visitors</span></div>
          <Distribution label="Devices" rows={(data?.devices ?? []).map((row) => ({ name: row.device, value: row.visitors }))} />
        </section>
      </main>

      {showExclusion && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowExclusion(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="exclude-title">
            <div className="dialog-icon"><ShieldOff size={22} /></div>
            <h2 id="exclude-title">Exclude this visitor?</h2>
            <p>Past events matching this network and browser will be removed. Future matching visits will not be recorded.</p>
            <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setShowExclusion(false)}>Cancel</button><button type="button" className="danger-button" onClick={excludeCurrentVisitor} disabled={excluding}>{excluding ? 'Excluding…' : 'Exclude visits'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
