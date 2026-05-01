-- Look up a user's id from their email so the friends UI can resolve
-- "add friend by email" without exposing the auth.users table to the client.
--
-- Both the web (src/actions/social.ts) and mobile (mobile/app/(tabs)/friends.tsx)
-- friends-add flow call this RPC. Without it, every friend request fails with
-- "User not found" even when the user exists.

CREATE OR REPLACE FUNCTION public.find_user_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;
