-- New rating dimensions: gender_rating, price_value, longevity_v2, sillage_v2
-- Run in Supabase SQL Editor

ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS gender_rating smallint CHECK (gender_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS price_value   smallint CHECK (price_value   BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS longevity_v2  smallint CHECK (longevity_v2  BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sillage_v2    smallint CHECK (sillage_v2    BETWEEN 1 AND 5);

-- Drop and recreate (CREATE OR REPLACE can't change column structure)
DROP VIEW IF EXISTS fragrance_stats;
CREATE VIEW fragrance_stats AS
SELECT
  f.id,
  ROUND(AVG(r.score)::numeric, 2)                                            AS avg_score,
  COUNT(r.id)::int                                                           AS rating_count,
  ROUND(AVG(CASE WHEN r.recommend THEN 100.0 ELSE 0.0 END))::int            AS recommend_pct,
  ROUND(AVG(r.longevity_v2)::numeric, 1)                                    AS avg_longevity,
  ROUND(AVG(r.sillage_v2)::numeric, 1)                                      AS avg_sillage,
  ROUND(AVG(r.gender_rating)::numeric, 1)                                   AS avg_gender,
  ROUND(AVG(r.price_value)::numeric, 1)                                     AS avg_price_value
FROM fragrances f
LEFT JOIN ratings r ON r.fragrance_id = f.id
GROUP BY f.id;
