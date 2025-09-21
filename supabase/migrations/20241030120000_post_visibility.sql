-- Ensure everyone sees approved posts while authors see their own pending content
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Reset select policies so we don't accumulate duplicates when rerunning locally
DROP POLICY IF EXISTS "Public can read approved posts" ON posts;
DROP POLICY IF EXISTS "Users can read approved posts" ON posts;
DROP POLICY IF EXISTS "Users can read own posts" ON posts;

-- Anonymous + authenticated users should see approved content in feeds
CREATE POLICY "Public can read approved posts"
  ON posts
  FOR SELECT
  TO public
  USING (moderation_status = 'approved');

-- Signed-in authors must see their own posts regardless of moderation state
CREATE POLICY "Users can read own posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
