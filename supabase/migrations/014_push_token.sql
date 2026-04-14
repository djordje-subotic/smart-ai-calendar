-- Push notification token for mobile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
