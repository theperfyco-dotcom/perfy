-- First-party page-view counter (no cookies, no PII — path + referrer host only)
CREATE TABLE IF NOT EXISTS page_views (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path       TEXT NOT NULL,
  ref_host   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS page_views_created_idx ON page_views (created_at);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
-- No anon policies: inserts happen server-side via the service role only.
