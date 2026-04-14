-- Profile personalization: avatar, birthday, display name, location, motivation style, motto
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_preset TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motivation_style TEXT DEFAULT 'friendly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motto TEXT;

-- avatar_url: custom uploaded image URL (Supabase Storage)
-- avatar_preset: preset avatar ID (e.g. "astronaut", "ninja", "crown")
-- motivation_style: 'strict' | 'friendly' | 'professional' | 'hype'
-- motto: personal mantra shown on profile
