/*
  # Fix post visibility policies

  - Allow public (anon) to read approved posts
  - Allow authenticated users to read their own posts regardless of moderation
  - Broaden comments read policy to public for comments on approved posts
*/

-- Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop old/select policies if they exist
DROP POLICY IF EXISTS "Users can read approved posts" ON posts;
DROP POLICY IF EXISTS "Public can read approved posts" ON posts;
DROP POLICY IF EXISTS "Users can read own posts" ON posts;

-- Public can read approved posts
CREATE POLICY "Public can read approved posts"
  ON posts
  FOR SELECT
  TO public
  USING (moderation_status = 'approved');

-- Users can read their own posts (any status)
CREATE POLICY "Users can read own posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments read policy: allow public to read comments that belong to approved posts
DROP POLICY IF EXISTS "Users can read comments on approved posts" ON comments;
DROP POLICY IF EXISTS "Public can read comments on approved posts" ON comments;
CREATE POLICY "Public can read comments on approved posts"
  ON comments
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.moderation_status = 'approved'
    )
  );

-- Users table public profile read access (needed for joins on public feeds)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access to basic profile" ON users;
CREATE POLICY "Public read access to basic profile"
  ON users
  FOR SELECT
  TO public
  USING (true);
