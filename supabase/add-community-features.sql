-- ── Statements (short community opinions) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS fragrance_statements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id   UUID        NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id     TEXT,
  body           TEXT        NOT NULL CHECK (char_length(body) BETWEEN 10 AND 500),
  score_scent    SMALLINT    CHECK (score_scent BETWEEN 1 AND 10),
  score_longevity SMALLINT   CHECK (score_longevity BETWEEN 1 AND 5),
  score_sillage  SMALLINT    CHECK (score_sillage BETWEEN 1 AND 5),
  is_positive    BOOLEAN,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fragrance_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statements_select" ON fragrance_statements FOR SELECT USING (true);
CREATE POLICY "statements_insert" ON fragrance_statements FOR INSERT WITH CHECK (true);

-- ── Classifications (Season / Occasion / Style community voting) ────────────
CREATE TABLE IF NOT EXISTS fragrance_classifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id  UUID        NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id    TEXT,
  season        TEXT        CHECK (season   IN ('spring','summer','autumn','winter')),
  occasion      TEXT        CHECK (occasion IN ('daily','office','evening','sport','formal','date')),
  style         TEXT        CHECK (style    IN ('fresh','elegant','casual','sporty','romantic','bold','dark','cozy')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fragrance_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classifications_select" ON fragrance_classifications FOR SELECT USING (true);
CREATE POLICY "classifications_insert" ON fragrance_classifications FOR INSERT WITH CHECK (true);

-- ── User collections (Owned / Wishlist / Worn / Tried) ──────────────────────
CREATE TABLE IF NOT EXISTS user_collections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id  UUID        NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL CHECK (status IN ('owned','wishlist','worn','tried')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, fragrance_id, status)
);

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_select" ON user_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "collection_all"    ON user_collections FOR ALL    USING (auth.uid() = user_id);

-- ── Classification stats view ────────────────────────────────────────────────
CREATE OR REPLACE VIEW fragrance_classification_stats AS
SELECT
  fragrance_id,
  COUNT(*) AS total_votes,
  -- Season
  COUNT(*) FILTER (WHERE season IS NOT NULL)                                          AS season_votes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE season = 'spring') / NULLIF(COUNT(*) FILTER (WHERE season IS NOT NULL), 0)) AS spring_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE season = 'summer') / NULLIF(COUNT(*) FILTER (WHERE season IS NOT NULL), 0)) AS summer_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE season = 'autumn') / NULLIF(COUNT(*) FILTER (WHERE season IS NOT NULL), 0)) AS autumn_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE season = 'winter') / NULLIF(COUNT(*) FILTER (WHERE season IS NOT NULL), 0)) AS winter_pct,
  -- Occasion
  COUNT(*) FILTER (WHERE occasion IS NOT NULL)                                         AS occasion_votes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'daily'  ) / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_daily_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'office' ) / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_office_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'evening') / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_evening_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'sport'  ) / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_sport_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'formal' ) / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_formal_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE occasion = 'date'   ) / NULLIF(COUNT(*) FILTER (WHERE occasion IS NOT NULL), 0)) AS occ_date_pct,
  -- Style
  COUNT(*) FILTER (WHERE style IS NOT NULL)                                            AS style_votes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'fresh'   ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_fresh_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'elegant' ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_elegant_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'casual'  ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_casual_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'sporty'  ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_sporty_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'romantic') / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_romantic_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'bold'    ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_bold_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'dark'    ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_dark_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE style = 'cozy'    ) / NULLIF(COUNT(*) FILTER (WHERE style IS NOT NULL), 0)) AS style_cozy_pct
FROM fragrance_classifications
GROUP BY fragrance_id;
