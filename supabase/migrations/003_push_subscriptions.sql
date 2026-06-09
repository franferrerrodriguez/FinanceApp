-- Push notification subscriptions (Web Push / PWA)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  subscription TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_subscription" ON push_subscriptions;
CREATE POLICY "own_subscription" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
