CREATE TABLE IF NOT EXISTS youtube_cache (
  fragrance_id  UUID        PRIMARY KEY REFERENCES fragrances(id) ON DELETE CASCADE,
  videos        JSONB       NOT NULL DEFAULT '[]',
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
