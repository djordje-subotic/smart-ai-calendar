-- Public availability / calendar sharing links
-- A user can create a slug-based public page that shows their free slots
-- for the next N days so others can request time without logging in.

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Book time with me',
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 15 AND 240),
  days_ahead INTEGER NOT NULL DEFAULT 14 CHECK (days_ahead BETWEEN 1 AND 60),
  -- Window of hours where slots may appear. 24h clock.
  earliest_hour SMALLINT NOT NULL DEFAULT 9 CHECK (earliest_hour BETWEEN 0 AND 23),
  latest_hour SMALLINT NOT NULL DEFAULT 18 CHECK (latest_hour BETWEEN 1 AND 24),
  -- Exclude weekends by default.
  include_weekends BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT share_links_hour_range CHECK (latest_hour > earliest_hour)
);

CREATE INDEX IF NOT EXISTS share_links_user_id_idx ON share_links(user_id);
CREATE INDEX IF NOT EXISTS share_links_slug_idx ON share_links(slug);

-- Bookings made through a share link
CREATE TABLE IF NOT EXISTS share_link_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS share_link_bookings_host_idx ON share_link_bookings(host_user_id);
CREATE INDEX IF NOT EXISTS share_link_bookings_start_idx ON share_link_bookings(start_time);

-- RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_bookings ENABLE ROW LEVEL SECURITY;

-- Owners can read/write their own share links
DROP POLICY IF EXISTS share_links_owner ON share_links;
CREATE POLICY share_links_owner ON share_links
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Public (anon) can read enabled share links — needed for the public booking page
DROP POLICY IF EXISTS share_links_public_read ON share_links;
CREATE POLICY share_links_public_read ON share_links
  FOR SELECT USING (enabled = TRUE);

-- Hosts can manage their bookings
DROP POLICY IF EXISTS share_link_bookings_host ON share_link_bookings;
CREATE POLICY share_link_bookings_host ON share_link_bookings
  FOR ALL USING (host_user_id = auth.uid()) WITH CHECK (host_user_id = auth.uid());

-- Anyone can create a booking (the API validates the share link exists)
DROP POLICY IF EXISTS share_link_bookings_public_insert ON share_link_bookings;
CREATE POLICY share_link_bookings_public_insert ON share_link_bookings
  FOR INSERT WITH CHECK (TRUE);
