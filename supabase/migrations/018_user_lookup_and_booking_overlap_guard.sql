-- Two fixes bundled into one migration so they can ship together:
--
-- 1. `find_user_by_email` RPC is referenced from web (src/actions/social.ts,
--    app/(dashboard)/friends/page.tsx) and mobile (mobile/app/(tabs)/friends.tsx)
--    but was never created. Without it, "add friend by email" silently returns
--    "User not found" for every existing user. We need a SECURITY DEFINER
--    function because the lookup must read auth.users (locked down by RLS to
--    each user's own row).
--
-- 2. /api/share/[slug]/book guards against double-booking with a SELECT then
--    INSERT, which is racy: two concurrent requests can both pass the check
--    and both insert. Add a Postgres EXCLUDE constraint so the database
--    rejects overlapping confirmed bookings atomically.

-- ----------------------------------------------------------------------
-- 1. Email -> user id lookup
-- ----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.find_user_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

-- Legacy alias — older code path in src/actions/social.ts still calls this name.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.find_user_by_email(email_input);
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- ----------------------------------------------------------------------
-- 2. Atomic guard against overlapping confirmed bookings
-- ----------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE share_link_bookings
  DROP CONSTRAINT IF EXISTS share_link_bookings_no_overlap;

ALTER TABLE share_link_bookings
  ADD CONSTRAINT share_link_bookings_no_overlap
  EXCLUDE USING gist (
    host_user_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status = 'confirmed');
