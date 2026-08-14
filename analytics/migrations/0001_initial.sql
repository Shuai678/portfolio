CREATE TABLE IF NOT EXISTS page_views (
  event_id TEXT PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  day TEXT NOT NULL,
  pathname TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  country TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  device_type TEXT NOT NULL,
  browser TEXT NOT NULL,
  CHECK (length(event_id) BETWEEN 16 AND 64),
  CHECK (length(visitor_hash) = 64),
  CHECK (length(session_hash) = 64),
  CHECK (length(country) = 2)
);

CREATE INDEX IF NOT EXISTS idx_page_views_occurred_at
  ON page_views (occurred_at);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor_time
  ON page_views (visitor_hash, occurred_at);

CREATE INDEX IF NOT EXISTS idx_page_views_day
  ON page_views (day);

CREATE INDEX IF NOT EXISTS idx_page_views_path_time
  ON page_views (pathname, occurred_at);

CREATE TABLE IF NOT EXISTS excluded_visitors (
  visitor_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT 'Admin exclusion',
  CHECK (length(visitor_hash) = 64)
);
