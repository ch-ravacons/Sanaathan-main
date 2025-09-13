/*
  # Dynamic Quick Actions backing tables

  - daily_readings: public-readable rotating daily content
  - events: public-readable upcoming events
  - practice_logs: per-user daily practice tracking for streaks
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Daily readings (public read)
CREATE TABLE IF NOT EXISTS daily_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,              -- e.g., "Bhagavad Gita"
  reference text,                   -- e.g., "Chapter 4"
  content text,                     -- optional passage or link
  reading_date date NOT NULL,       -- date it applies to
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_readings_date ON daily_readings(reading_date DESC);

ALTER TABLE daily_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read daily readings" ON daily_readings;
CREATE POLICY "Public read daily readings"
  ON daily_readings
  FOR SELECT
  TO public
  USING (true);

-- Events (public read)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time ASC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events"
  ON events
  FOR SELECT
  TO public
  USING (true);

-- Practice logs (per-user)
CREATE TABLE IF NOT EXISTS practice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practice text DEFAULT 'devotion',
  practiced_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, practiced_on)
);

CREATE INDEX IF NOT EXISTS idx_practice_logs_user_date ON practice_logs(user_id, practiced_on DESC);

ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own practice logs" ON practice_logs;
CREATE POLICY "Users manage own practice logs"
  ON practice_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

