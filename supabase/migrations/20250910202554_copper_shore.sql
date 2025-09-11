/*
  # Create posts and related tables for Sanatana Dharma platform

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `content` (text) - post content
      - `spiritual_topic` (text, optional) - spiritual topic category
      - `tags` (text[], optional) - array of tags
      - `likes_count` (integer) - cached likes count
      - `comments_count` (integer) - cached comments count
      - `shares_count` (integer) - cached shares count
      - `is_moderated` (boolean) - whether post has been moderated
      - `moderation_status` (text) - approved, pending, flagged, rejected
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to users)
      - `content` (text) - comment content
      - `created_at` (timestamp)

    - `post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

    - `post_reports`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `reported_by` (uuid, foreign key to users)
      - `reason` (text) - reason for reporting
      - `status` (text) - pending, reviewed, dismissed
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for CRUD operations
    - Ensure users can only modify their own content
*/

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) >= 10 AND length(content) <= 1000),
  spiritual_topic text,
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  is_moderated boolean DEFAULT false,
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('approved', 'pending', 'flagged', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post reports table
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reported_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can read approved posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (moderation_status = 'approved');

CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can read comments on approved posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id 
      AND posts.moderation_status = 'approved'
    )
  );

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Users can read post likes"
  ON post_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON post_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Post reports policies
CREATE POLICY "Users can create reports"
  ON post_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can read their own reports"
  ON post_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for counter updates
CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger for posts updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_spiritual_topic ON posts(spiritual_topic);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);