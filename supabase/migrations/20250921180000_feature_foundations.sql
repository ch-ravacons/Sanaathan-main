/*
  Feature Foundations Migration (fixed for Supabase)
  - Extend events with richer metadata and attendance tracking
  - Create user reading history for personalized feed
  - Add devotion practice catalog and enrich practice logs
  - Add post media linkage for uploads (RLS fixed)
  - Provide topic metrics materialized view for trending topics
*/

-- 0) Extensions / helpers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Ensure a generic updated_at trigger function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS trigger AS $body$
      BEGIN
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
    $fn$;
  END IF;
END$$;

-- ==========================
-- Events enhancements
-- ==========================
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tags     text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacity integer;

-- optional: non-negative capacity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_capacity_nonneg'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_capacity_nonneg CHECK (capacity IS NULL OR capacity >= 0);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'interested', -- going | interested | not_going
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their event attendance" ON event_attendees;
CREATE POLICY "Users manage their event attendance"
  ON event_attendees
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS event_attendees_updated_at ON event_attendees;
CREATE TRIGGER event_attendees_updated_at
  BEFORE UPDATE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id  ON event_attendees(user_id);

-- ==========================
-- Daily reading history
-- ==========================
CREATE TABLE IF NOT EXISTS user_reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
  reading_id uuid NOT NULL REFERENCES daily_readings(id)  ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  source text,
  UNIQUE(user_id, reading_id)
);

ALTER TABLE user_reading_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their reading history" ON user_reading_history;
CREATE POLICY "Users manage their reading history"
  ON user_reading_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_reading_history_user
  ON user_reading_history(user_id, completed_at DESC);

-- ==========================
-- Devotion catalog and logs
-- ==========================
CREATE TABLE IF NOT EXISTS devotion_practices (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  base_points integer NOT NULL DEFAULT 10,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS devotion_practices_updated_at ON devotion_practices;
CREATE TRIGGER devotion_practices_updated_at
  BEFORE UPDATE ON devotion_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO devotion_practices (id, name, description, category, base_points, icon)
VALUES
  ('practice-1', 'Japa Meditation', '108 mantra repetitions', 'meditation', 20, NULL),
  ('practice-2', 'Scripture Reading', 'Read for at least 15 minutes', 'study', 15, NULL),
  ('practice-3', 'Seva', 'Offer service to the temple/community', 'service', 25, NULL),
  ('practice-4', 'Kirtan', 'Lead or participate in a kirtan session', 'devotion', 30, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  base_points = EXCLUDED.base_points,
  icon = EXCLUDED.icon,
  updated_at = now();

ALTER TABLE practice_logs
  ADD COLUMN IF NOT EXISTS intensity       text,
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS points_awarded  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_id     text;

-- Backfill practice_id and points safely
UPDATE practice_logs
SET practice_id    = COALESCE(practice_id, COALESCE(practice, 'devotion')),
    points_awarded = CASE WHEN points_awarded IS NULL OR points_awarded = 0 THEN 10 ELSE points_awarded END
WHERE practice_id IS NULL OR points_awarded IS NULL;

-- Enforce FK to catalog after backfill (deferrable for bulk safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'practice_logs_practice_id_fkey'
  ) THEN
    ALTER TABLE practice_logs
      ADD CONSTRAINT practice_logs_practice_id_fkey
      FOREIGN KEY (practice_id) REFERENCES devotion_practices(id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_practice_logs_practice_id ON practice_logs(practice_id);

-- ==========================
-- Post media linkage (RLS fixed)
-- ==========================
CREATE TABLE IF NOT EXISTS post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  uuid NOT NULL REFERENCES posts(id)          ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_uploads(id)  ON DELETE CASCADE,
  media_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, media_id)
);

ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

-- INSERT policy
DROP POLICY IF EXISTS "Users insert media for own posts" ON post_media;
CREATE POLICY "Users insert media for own posts"
  ON post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_media.post_id
      AND posts.user_id = auth.uid()
  ));

-- UPDATE policy
DROP POLICY IF EXISTS "Users update media for own posts" ON post_media;
CREATE POLICY "Users update media for own posts"
  ON post_media
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_media.post_id
      AND posts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_media.post_id
      AND posts.user_id = auth.uid()
  ));

-- DELETE policy
DROP POLICY IF EXISTS "Users delete media for own posts" ON post_media;
CREATE POLICY "Users delete media for own posts"
  ON post_media
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_media.post_id
      AND posts.user_id = auth.uid()
  ));

-- Public SELECT policy (optional)
DROP POLICY IF EXISTS "Public read post media" ON post_media;
CREATE POLICY "Public read post media"
  ON post_media
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id  ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_media_id ON post_media(media_id);

-- ==========================
-- Trending topics support
-- ==========================
DROP MATERIALIZED VIEW IF EXISTS topic_metrics;
CREATE MATERIALIZED VIEW topic_metrics AS
SELECT
  tag AS topic,
  COUNT(*)::integer AS post_count,
  COALESCE(SUM(CASE WHEN posts.created_at >= now() - interval '1 day' THEN 1 ELSE 0 END), 0)::integer AS velocity_score
FROM (
  SELECT id, created_at, UNNEST(tags) AS tag
  FROM posts
  WHERE array_length(tags, 1) > 0
    AND (deleted_at IS NULL)  -- remove if you don't have deleted_at
) posts
GROUP BY tag;

-- For CONCURRENTLY refreshes, require a UNIQUE index on the MV
DROP INDEX IF EXISTS idx_topic_metrics_topic;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'ux_topic_metrics_topic'
  ) THEN
    CREATE UNIQUE INDEX ux_topic_metrics_topic ON topic_metrics(topic);
  END IF;
END$$;

-- Refresh helper (valid for CONCURRENTLY)
CREATE OR REPLACE FUNCTION refresh_topic_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY topic_metrics;
END;
$$ LANGUAGE plpgsql;

-- ==========================
-- Media upload metadata tweaks
-- ==========================
ALTER TABLE media_uploads
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS storage_bucket    text,
  ADD COLUMN IF NOT EXISTS metadata          jsonb DEFAULT '{}'::jsonb;

-- ==========================
-- User preferences convenience
-- ==========================
CREATE TABLE IF NOT EXISTS user_spiritual_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  streak integer DEFAULT 0,
  level integer DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_spiritual_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own spiritual stats" ON user_spiritual_stats;
CREATE POLICY "Users manage own spiritual stats"
  ON user_spiritual_stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_spiritual_stats_updated_at ON user_spiritual_stats;
CREATE TRIGGER user_spiritual_stats_updated_at
  BEFORE UPDATE ON user_spiritual_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
