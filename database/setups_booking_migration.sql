-- Support setup-first bookings and setup/session pricing.

CREATE TABLE IF NOT EXISTS setups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  badge TEXT,
  description TEXT,
  icon TEXT,
  base_price INT NOT NULL,
  max_players INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO setups (name, display_name, badge, description, icon, base_price, max_players, sort_order)
VALUES
  ('ps5', 'PlayStation 5', 'NEXT-GEN', 'DualSense haptics, 4K @ 60fps, ray-traced worlds. Latest titles, always patched, always ready.', 'gamepad-2', 150, 4, 1),
  ('ps4', 'PlayStation 4', 'COUCH CO-OP', 'Classics that never aged - GTA V, God of War, FIFA nights. Two controllers, one couch, zero excuses.', 'gamepad-2', 100, 4, 2),
  ('arcade', 'Vintage Arcade', 'OG VIBES', 'Mortal Kombat, Street Fighter, Tekken on the original cabinet. Coin-op feel without the coins.', 'joystick', 50, 4, 3),
  ('racing', 'Sim Racing Rig', 'FULL SEND', 'Force-feedback wheel, pedals, bucket seat. Forza, Gran Turismo, Assetto Corsa - feel every kerb.', 'gauge', 50, 2, 4)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  base_price = EXCLUDED.base_price,
  max_players = EXCLUDED.max_players,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

ALTER TABLE session_types ADD COLUMN IF NOT EXISTS price_multiplier DECIMAL DEFAULT 1.0;

UPDATE session_types SET price_multiplier = 1.0 WHERE name = 'Solo';
UPDATE session_types SET price_multiplier = 1.5 WHERE name = 'Duo';
UPDATE session_types SET price_multiplier = 2.0 WHERE name = 'Squad';

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS setup_id UUID REFERENCES setups(id);

CREATE INDEX IF NOT EXISTS idx_bookings_setup_id ON bookings(setup_id);

UPDATE bookings
SET setup_id = (SELECT id FROM setups WHERE name = 'ps5')
WHERE setup_id IS NULL;

ALTER TABLE setups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view setups" ON setups;
CREATE POLICY "Anyone can view setups" ON setups FOR SELECT USING (true);
