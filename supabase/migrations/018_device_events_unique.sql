-- Device calendar sync (mobile Apple / Android) upserts events by
-- (user_id, external_uid) for rows with source = 'device'. The previous
-- index only covered (subscription_id, external_uid) for ICS subscriptions,
-- so device-sync upserts failed for lack of a unique constraint.

CREATE UNIQUE INDEX IF NOT EXISTS events_user_device_external_uid_idx
  ON events(user_id, external_uid)
  WHERE source = 'device' AND external_uid IS NOT NULL;
