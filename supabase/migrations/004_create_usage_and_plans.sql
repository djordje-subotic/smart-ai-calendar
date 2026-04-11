-- Plans and usage tracking for Vela
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS energy_profile JSONB DEFAULT '{"chronotype": "balanced", "peak_hours": [9,10,11], "low_hours": [14,15]}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS focus_blocks JSONB DEFAULT '[]';

-- Usage log for tracking AI calls
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON ai_usage_log FOR ALL USING (auth.uid() = user_id);

-- Focus time blocks table
CREATE TABLE IF NOT EXISTS focus_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Focus Time',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  days INTEGER[] DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE focus_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own focus blocks" ON focus_blocks FOR ALL USING (auth.uid() = user_id);
