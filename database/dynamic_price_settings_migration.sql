-- ============================================
-- DYNAMIC PRICE SETTINGS - DATABASE MIGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS price_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_id UUID REFERENCES setups(id) ON DELETE CASCADE,
  session_type_id UUID REFERENCES session_types(id) ON DELETE CASCADE,
  base_price INT NOT NULL,
  current_price INT NOT NULL,
  is_sale BOOLEAN DEFAULT false,
  sale_price INT,
  sale_start_date DATE,
  sale_end_date DATE,
  discount_percentage INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setup_id, session_type_id)
);

CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO price_settings (setup_id, session_type_id, base_price, current_price)
SELECT
  s.id AS setup_id,
  st.id AS session_type_id,
  CASE
    WHEN s.name = 'ps5' AND st.name = 'Solo' THEN 150
    WHEN s.name = 'ps5' AND st.name = 'Duo' THEN 250
    WHEN s.name = 'ps5' AND st.name = 'Squad' THEN 350
    WHEN s.name = 'ps4' AND st.name = 'Solo' THEN 100
    WHEN s.name = 'ps4' AND st.name = 'Duo' THEN 180
    WHEN s.name = 'ps4' AND st.name = 'Squad' THEN 250
    WHEN s.name = 'arcade' AND st.name = 'Solo' THEN 50
    WHEN s.name = 'arcade' AND st.name = 'Duo' THEN 80
    WHEN s.name = 'arcade' AND st.name = 'Squad' THEN 120
    WHEN s.name = 'racing' AND st.name = 'Solo' THEN 50
    WHEN s.name = 'racing' AND st.name = 'Duo' THEN 80
    WHEN s.name = 'racing' AND st.name = 'Squad' THEN 150
    ELSE COALESCE(ROUND(s.base_price * COALESCE(st.price_multiplier, 1.0))::INT, 0)
  END AS base_price,
  CASE
    WHEN s.name = 'ps5' AND st.name = 'Solo' THEN 150
    WHEN s.name = 'ps5' AND st.name = 'Duo' THEN 250
    WHEN s.name = 'ps5' AND st.name = 'Squad' THEN 350
    WHEN s.name = 'ps4' AND st.name = 'Solo' THEN 100
    WHEN s.name = 'ps4' AND st.name = 'Duo' THEN 180
    WHEN s.name = 'ps4' AND st.name = 'Squad' THEN 250
    WHEN s.name = 'arcade' AND st.name = 'Solo' THEN 50
    WHEN s.name = 'arcade' AND st.name = 'Duo' THEN 80
    WHEN s.name = 'arcade' AND st.name = 'Squad' THEN 120
    WHEN s.name = 'racing' AND st.name = 'Solo' THEN 50
    WHEN s.name = 'racing' AND st.name = 'Duo' THEN 80
    WHEN s.name = 'racing' AND st.name = 'Squad' THEN 150
    ELSE COALESCE(ROUND(s.base_price * COALESCE(st.price_multiplier, 1.0))::INT, 0)
  END AS current_price
FROM setups s
CROSS JOIN session_types st
WHERE s.name IN ('ps5', 'ps4', 'arcade', 'racing')
  AND st.name IN ('Solo', 'Duo', 'Squad')
ON CONFLICT (setup_id, session_type_id)
DO UPDATE SET
  base_price = EXCLUDED.base_price,
  current_price = EXCLUDED.current_price,
  updated_at = NOW();

INSERT INTO global_settings (key, value)
VALUES
  ('h_coins', '{"coins_per_solo":10,"coins_per_duo":15,"coins_per_squad":25,"coins_for_free_session":100}'::jsonb),
  ('sale_settings', '{"enabled":false,"discount_type":"percentage","discount_value":0,"start_date":null,"end_date":null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE price_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view price_settings" ON price_settings;
CREATE POLICY "Anyone can view price_settings"
ON price_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can view global_settings" ON global_settings;
CREATE POLICY "Anyone can view global_settings"
ON global_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update price_settings" ON price_settings;
CREATE POLICY "Admins can update price_settings"
ON price_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update global_settings" ON global_settings;
CREATE POLICY "Admins can update global_settings"
ON global_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
