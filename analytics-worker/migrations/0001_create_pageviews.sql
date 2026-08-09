CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  country TEXT NOT NULL DEFAULT 'unknown',
  event_type TEXT NOT NULL DEFAULT 'pageview',
  normalized_path TEXT,
  referrer TEXT,
  referrer_host TEXT,
  user_agent TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0 CHECK (is_bot IN (0, 1)),
  tool_id TEXT,
  title TEXT
);

CREATE INDEX IF NOT EXISTS idx_pageviews_event_ts
  ON pageviews (event_type, is_bot, ts);

CREATE INDEX IF NOT EXISTS idx_pageviews_path
  ON pageviews (normalized_path);

CREATE INDEX IF NOT EXISTS idx_pageviews_country
  ON pageviews (country);

CREATE INDEX IF NOT EXISTS idx_pageviews_referrer
  ON pageviews (referrer_host);
