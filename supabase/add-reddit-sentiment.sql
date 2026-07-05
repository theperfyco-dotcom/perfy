-- Reddit sentiment tables
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS reddit_sentiments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id      uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  reddit_post_id    text NOT NULL,
  reddit_comment_id text,
  subreddit         text NOT NULL DEFAULT 'fragrance',
  post_title        text,
  body_text         text,
  author            text,
  post_date         timestamptz NOT NULL,
  upvotes           int DEFAULT 0,
  score_signal      smallint CHECK (score_signal      BETWEEN 1 AND 10),
  longevity_signal  smallint CHECK (longevity_signal  BETWEEN 1 AND 5),
  sillage_signal    smallint CHECK (sillage_signal    BETWEEN 1 AND 5),
  gender_signal     smallint CHECK (gender_signal     BETWEEN 1 AND 5),
  price_value_signal smallint CHECK (price_value_signal BETWEEN 1 AND 5),
  sentiment_score   numeric(3,2) CHECK (sentiment_score BETWEEN -1 AND 1),
  confidence        numeric(3,2) CHECK (confidence    BETWEEN 0 AND 1),
  analyzed_at       timestamptz DEFAULT now()
);

-- Prevent duplicate posts and duplicate comments separately
CREATE UNIQUE INDEX IF NOT EXISTS reddit_sentiments_unique_post
  ON reddit_sentiments(reddit_post_id)
  WHERE reddit_comment_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reddit_sentiments_unique_comment
  ON reddit_sentiments(reddit_post_id, reddit_comment_id)
  WHERE reddit_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reddit_sentiments_fragrance_idx ON reddit_sentiments(fragrance_id);
CREATE INDEX IF NOT EXISTS reddit_sentiments_date_idx      ON reddit_sentiments(post_date);
CREATE INDEX IF NOT EXISTS reddit_sentiments_month_idx     ON reddit_sentiments(date_trunc('month', post_date));

-- Monthly awards
CREATE TABLE IF NOT EXISTS reddit_monthly_awards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id   uuid NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
  award_month    date NOT NULL,
  award_type     text NOT NULL CHECK (award_type IN (
    'most_discussed','reddit_favourite','hidden_gem',
    'rising','best_value','beast_mode','most_longevity'
  )),
  mention_count  int,
  avg_sentiment  numeric(3,2),
  avg_score      numeric(3,1),
  detail         jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  UNIQUE(award_month, award_type)
);

CREATE INDEX IF NOT EXISTS reddit_awards_month_idx ON reddit_monthly_awards(award_month);

-- Aggregated view
DROP VIEW IF EXISTS fragrance_reddit_stats;
CREATE VIEW fragrance_reddit_stats AS
SELECT
  fragrance_id,
  COUNT(*)                                                                           AS mention_count,
  ROUND(AVG(sentiment_score)::numeric, 2)                                            AS avg_sentiment,
  ROUND(AVG(score_signal)::numeric, 1)                                               AS avg_score,
  ROUND(AVG(longevity_signal)::numeric, 1)                                           AS avg_longevity,
  ROUND(AVG(sillage_signal)::numeric, 1)                                             AS avg_sillage,
  ROUND(AVG(gender_signal)::numeric, 1)                                              AS avg_gender,
  ROUND(AVG(price_value_signal)::numeric, 1)                                         AS avg_price_value,
  MAX(post_date)                                                                     AS last_mention,
  COUNT(*) FILTER (WHERE post_date >= NOW() - INTERVAL '30 days')                   AS mentions_this_month,
  COUNT(*) FILTER (WHERE post_date >= NOW() - INTERVAL '60 days'
                     AND post_date <  NOW() - INTERVAL '30 days')                   AS mentions_last_month
FROM reddit_sentiments
WHERE confidence >= 0.5
GROUP BY fragrance_id;

-- RLS
ALTER TABLE reddit_sentiments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_monthly_awards  ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read reddit_sentiments"     ON reddit_sentiments     FOR SELECT USING (true);
CREATE POLICY "Public read reddit_monthly_awards" ON reddit_monthly_awards FOR SELECT USING (true);
-- Service role writes (ingestion runs server-side with service key)
