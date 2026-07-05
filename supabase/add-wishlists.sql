-- Run in Supabase SQL Editor

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fragrance_id  uuid REFERENCES fragrances(id) ON DELETE CASCADE NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, fragrance_id)
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own ratings (for profile page)
CREATE POLICY "Users read own ratings" ON ratings
  FOR SELECT USING (auth.uid() = user_id);
