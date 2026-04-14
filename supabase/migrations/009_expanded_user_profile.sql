-- Expanded user profile for richer AI personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS priorities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ideal_day TEXT;

-- bio: free text about themselves
-- hobbies: ["Guitar", "Cooking", "Gaming", "Hiking"]
-- priorities: ["Family time", "Career growth", "Health"] — ordered by importance
-- constraints: ["Kids pickup at 16:00", "No meetings before 10", "Gym only MWF"]
-- ideal_day: free text describing their perfect day
