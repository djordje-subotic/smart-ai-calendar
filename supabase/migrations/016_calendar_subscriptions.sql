-- External calendar subscriptions (iCloud, Outlook, public ICS feeds).
-- Works via ICS URL — users share their public calendar link and Krowna
-- keeps a read-only mirror in sync.

CREATE TABLE IF NOT EXISTS calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  ics_url TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  provider TEXT DEFAULT 'ics', -- 'apple' | 'outlook' | 'ics'
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  event_count INTEGER DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_subscriptions_user_id_idx ON calendar_subscriptions(user_id);

-- Make sure events table can be tagged with a subscription so we can
-- delete/update swept events on resync.
ALTER TABLE events ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES calendar_subscriptions(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_uid TEXT;
CREATE INDEX IF NOT EXISTS events_subscription_id_idx ON events(subscription_id);
CREATE UNIQUE INDEX IF NOT EXISTS events_subscription_external_uid_idx
  ON events(subscription_id, external_uid)
  WHERE subscription_id IS NOT NULL AND external_uid IS NOT NULL;

ALTER TABLE calendar_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_subscriptions_owner ON calendar_subscriptions;
CREATE POLICY calendar_subscriptions_owner ON calendar_subscriptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
