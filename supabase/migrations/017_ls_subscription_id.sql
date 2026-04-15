-- Store the Lemon Squeezy subscription ID on each user profile so we can
-- cancel the subscription via the LS API when the user clicks "Cancel" in
-- Settings. Without this, cancelling only flips plan=free locally while LS
-- keeps charging the card — a billing bug.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS profiles_ls_subscription_id_idx
  ON profiles(ls_subscription_id)
  WHERE ls_subscription_id IS NOT NULL;
