-- Look up a user's profile id by their auth email.
--
-- The friend-add UI on web and mobile takes an email and needs to resolve
-- it to a profile id to create a `friends` row. RLS prevents querying
-- auth.users directly from the client, so we expose this as a SECURITY
-- DEFINER function that returns only the id (no email enumeration of other
-- attributes). It still leaks "user exists / does not exist" to authed
-- callers — same trust model as Slack/Notion's invite-by-email — which the
-- product accepts. Anonymous callers cannot invoke it (REVOKE from anon).
--
-- Without this migration, both `web/src/actions/social.ts` and
-- `mobile/app/(tabs)/friends.tsx` fail with "function find_user_by_email
-- does not exist", breaking the friend system entirely.

CREATE OR REPLACE FUNCTION public.find_user_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF target_email IS NULL OR length(trim(target_email)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT id INTO target_id
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email))
  LIMIT 1;

  RETURN target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;
