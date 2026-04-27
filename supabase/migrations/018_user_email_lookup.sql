-- Friend lookup by email + booking host email.
--
-- Two pieces:
--   1. profiles.email column, populated by the new-user trigger and
--      backfilled for existing rows from auth.users.
--   2. find_user_by_email() RPC — SECURITY DEFINER so any signed-in user
--      can resolve an email → user_id without needing direct access to
--      auth.users.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update the new-user trigger to also store the email so booking flow + AI
-- can read it without joining auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Look up a user_id by email. SECURITY DEFINER lets the function read
-- auth.users even though RLS would normally block. Returns NULL when no
-- match, never the calling user's own id.
CREATE OR REPLACE FUNCTION public.find_user_by_email(target_email TEXT)
RETURNS UUID AS $$
DECLARE
  found_id UUID;
BEGIN
  IF target_email IS NULL OR length(trim(target_email)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT id INTO found_id
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email))
  LIMIT 1;

  RETURN found_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;
