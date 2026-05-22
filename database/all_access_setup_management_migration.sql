-- ============================================
-- SETUP MANAGEMENT + ALL-ACCESS PRICES
-- ============================================

-- Ensure is_active exists
ALTER TABLE setups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Optional maintenance reason
ALTER TABLE setups ADD COLUMN IF NOT EXISTS maintenance_reason TEXT;

-- Create all_access_settings
CREATE TABLE IF NOT EXISTS all_access_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_minutes INT NOT NULL,
  price INT NOT NULL,
  h_coins_earned INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duration_minutes)
);

INSERT INTO all_access_settings (duration_minutes, price, h_coins_earned) VALUES
(30, 200, 10),
(60, 379, 15)
ON CONFLICT (duration_minutes) DO UPDATE SET
  price = EXCLUDED.price,
  h_coins_earned = EXCLUDED.h_coins_earned;

-- Enable RLS and policies
ALTER TABLE all_access_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view all_access_settings" ON all_access_settings;
CREATE POLICY "Anyone can view all_access_settings" ON all_access_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update all_access_settings" ON all_access_settings;
CREATE POLICY "Admins can update all_access_settings" ON all_access_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
