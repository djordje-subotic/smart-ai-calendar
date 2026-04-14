-- On-demand AI credit purchases
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;

-- Purchase history
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  package_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON credit_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON credit_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
