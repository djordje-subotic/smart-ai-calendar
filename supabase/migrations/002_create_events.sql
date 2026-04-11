CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  recurrence_rule JSONB,
  reminder_minutes INTEGER[] DEFAULT '{15}',
  source TEXT DEFAULT 'manual',
  external_id TEXT,
  ai_metadata JSONB,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_time ON events(user_id, start_time, end_time);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE USING (auth.uid() = user_id);
