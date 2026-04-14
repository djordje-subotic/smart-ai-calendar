-- Add meeting URL field to events for video call links
ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_url TEXT;
