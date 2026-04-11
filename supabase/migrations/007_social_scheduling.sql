-- Friends system
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',  -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own friendships" ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friend requests" ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships they're part of" ON friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete own friend requests" ON friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Event invites with negotiation
CREATE TABLE event_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',  -- pending, accepted, declined, negotiating
  proposed_title TEXT NOT NULL,
  proposed_start TIMESTAMPTZ NOT NULL,
  proposed_end TIMESTAMPTZ NOT NULL,
  proposed_location TEXT,
  -- Counter-proposal fields
  counter_start TIMESTAMPTZ,
  counter_end TIMESTAMPTZ,
  counter_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own invites" ON event_invites FOR SELECT
  USING (auth.uid() = organizer_id OR auth.uid() = invitee_id);
CREATE POLICY "Users can create invites" ON event_invites FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Users can update invites they're part of" ON event_invites FOR UPDATE
  USING (auth.uid() = organizer_id OR auth.uid() = invitee_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- friend_request, event_invite, counter_proposal, invite_accepted, invite_declined
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own notifications" ON notifications FOR ALL
  USING (auth.uid() = user_id);
