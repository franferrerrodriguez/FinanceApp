-- FinanciaApp — initial schema + RLS
-- Run in Supabase SQL Editor (new or empty project)

-- Profile (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  age        INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial parameters + client JSON extensions
CREATE TABLE IF NOT EXISTS user_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  monthly_net_salary          NUMERIC(12,2),
  other_monthly_income        NUMERIC(12,2) DEFAULT 0,
  mortgage_rent               NUMERIC(10,2) DEFAULT 0,
  utilities                   NUMERIC(10,2) DEFAULT 0,
  insurance                   NUMERIC(10,2) DEFAULT 0,
  subscriptions               NUMERIC(10,2) DEFAULT 0,
  other_fixed_expenses        NUMERIC(10,2) DEFAULT 0,
  index_fund_nominal_return     NUMERIC(5,4) DEFAULT 0.0600,
  index_fund_real_return        NUMERIC(5,4) DEFAULT 0.0400,
  use_real_return               BOOLEAN DEFAULT TRUE,
  expected_inflation            NUMERIC(5,4) DEFAULT 0.0200,
  pension_plan_return           NUMERIC(5,4) DEFAULT 0.0350,
  savings_account_return        NUMERIC(5,4) DEFAULT 0.0250,
  annual_salary_increase        NUMERIC(5,4) DEFAULT 0,
  projection_years              INTEGER DEFAULT 20,
  monthly_investment_amount     NUMERIC(10,2) DEFAULT 0,
  app_data                      JSONB DEFAULT '{}'::jsonb,
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  provider    TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liabilities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  monthly_payment  NUMERIC(10,2) DEFAULT 0,
  interest_rate    NUMERIC(5,4),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id      UUID REFERENCES assets(id) ON DELETE CASCADE,
  liability_id  UUID REFERENCES liabilities(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  value         NUMERIC(14,2) NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, snapshot_date),
  UNIQUE(liability_id, snapshot_date)
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_settings_own" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets_own" ON assets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "liabilities_own" ON liabilities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_snapshots_own" ON monthly_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
