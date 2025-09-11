/*
  # Fix Posts Table Policies

  This migration safely handles existing policies and ensures all required tables and policies are properly set up.

  1. Tables
    - Safely create posts, comments, post_likes, and post_reports tables if they don't exist
    - Add any missing columns to existing tables

  2. Security
    - Drop and recreate policies to avoid conflicts
    - Enable RLS on all tables
    - Add comprehensive policies for all operations

  3. Functions & Triggers
    - Create helper functions for updating counts
    - Add triggers for automatic count updates
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create posts table if not exists
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create comments table if not exists
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- Create post_likes table if not exists
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_reports table if not exists
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_user_id') THEN
    CREATE INDEX idx_posts_user_id ON posts(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_created_at') THEN
    CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_moderation_status') THEN
    CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_spiritual_topic') THEN
    CREATE INDEX idx_posts_spiritual_topic ON posts(spiritual_topic);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_post_id') THEN
    CREATE INDEX idx_comments_post_id ON comments(post_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_post_likes_post_id') THEN
    CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_post_likes_user_id') THEN
    CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read approved posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Users can read comments on approved posts" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

DROP POLICY IF EXISTS "Users can read post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON post_likes;

DROP POLICY IF EXISTS "Users can read their own reports" ON post_reports;
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;

-- Create new policies for posts
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

-- Create policies for comments
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

-- Create policies for post_likes
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

-- Create policies for post_reports
CREATE POLICY "Users can read their own reports"
  ON post_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

CREATE POLICY "Users can create reports"
  ON post_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Functions for updating counts
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

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_likes_count_trigger ON post_likes;
DROP TRIGGER IF EXISTS update_comments_count_trigger ON comments;

-- Create triggers
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();