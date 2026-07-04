-- Migration: add Wikiparfum enrichment columns
-- Run this in the Supabase SQL editor before running scrape-wikiparfum.ts

-- New columns on fragrances
ALTER TABLE fragrances
  ADD COLUMN IF NOT EXISTS perfumer         text,
  ADD COLUMN IF NOT EXISTS fw_classification text,
  ADD COLUMN IF NOT EXISTS concepts         text[],
  ADD COLUMN IF NOT EXISTS wikiparfum_slug  text,
  ADD COLUMN IF NOT EXISTS origin           text;

CREATE INDEX IF NOT EXISTS idx_fragrances_wikiparfum ON fragrances(wikiparfum_slug);

-- Allow position to be null for Wikiparfum-sourced notes (no top/heart/base data)
ALTER TABLE fragrance_notes ALTER COLUMN position DROP NOT NULL;
ALTER TABLE fragrance_notes DROP CONSTRAINT IF EXISTS fragrance_notes_position_check;
ALTER TABLE fragrance_notes ADD CONSTRAINT fragrance_notes_position_check
  CHECK (position IS NULL OR position IN ('top', 'heart', 'base'));
