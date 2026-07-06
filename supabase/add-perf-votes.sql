-- ── Per-attribute performance votes ────────────────────────────────────────
-- Lightweight table: one row per user-session per attribute per fragrance.
-- Separate from the full `ratings` table so attributes can be voted on
-- independently without requiring an overall score.

CREATE TABLE IF NOT EXISTS fragrance_perf_votes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id UUID        NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  session_id   TEXT        NOT NULL,
  attribute    TEXT        NOT NULL CHECK (attribute IN ('longevity','sillage','gender','price_value')),
  value        SMALLINT    NOT NULL CHECK (value BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fragrance_id, session_id, attribute)
);

ALTER TABLE fragrance_perf_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perf_votes_select" ON fragrance_perf_votes FOR SELECT USING (true);
CREATE POLICY "perf_votes_insert" ON fragrance_perf_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "perf_votes_delete" ON fragrance_perf_votes FOR DELETE USING (true);
