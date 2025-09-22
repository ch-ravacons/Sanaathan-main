-- AI Knowledge and Moderation Foundations
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read knowledge" ON knowledge_nodes;
CREATE POLICY "Authenticated read knowledge"
  ON knowledge_nodes
  FOR SELECT
  TO authenticated
  USING (true);

DROP INDEX IF EXISTS idx_knowledge_nodes_summary_search;
CREATE INDEX idx_knowledge_nodes_summary_search
  ON knowledge_nodes
  USING GIN (to_tsvector('english', summary));

CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_id uuid REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL,
  score numeric,
  labels text[] DEFAULT '{}',
  reasoning text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_moderation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view moderation events" ON ai_moderation_events;
CREATE POLICY "Users view moderation events"
  ON ai_moderation_events
  FOR SELECT
  TO authenticated
  USING (true);
