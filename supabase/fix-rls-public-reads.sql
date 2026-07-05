-- Run in Supabase SQL Editor to add public SELECT policies on reference tables.
-- Once applied, you can revert db.ts to use createClient() instead of createServiceClient().

CREATE POLICY "Public read" ON fragrance_accords  FOR SELECT USING (true);
CREATE POLICY "Public read" ON fragrance_notes    FOR SELECT USING (true);
CREATE POLICY "Public read" ON notes              FOR SELECT USING (true);
CREATE POLICY "Public read" ON fragrance_prices   FOR SELECT USING (true);
CREATE POLICY "Public read" ON retailers          FOR SELECT USING (true);
