-- Voice mode persistence
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
