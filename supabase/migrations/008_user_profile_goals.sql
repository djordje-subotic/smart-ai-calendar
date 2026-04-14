-- User profile goals and onboarding data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_habits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{"days": ["MO","TU","WE","TH","FR"], "start": "09:00", "end": "17:00"}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- goals example: ["Stay fit", "Learn programming", "Read more books"]
-- daily_habits example: ["Morning workout", "Meditation", "Reading before bed"]
-- work_schedule: {days: ["MO","TU",...], start: "09:00", end: "17:00"}
-- preferences: {language: "sr", wake_time: "07:00", sleep_time: "23:00", lunch_time: "13:00", focus_preference: "morning"}
