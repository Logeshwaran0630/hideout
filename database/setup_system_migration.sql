-- ============================================
-- HIDEOUT BOOKING SYSTEM REVAMP
-- Setup-First Booking Flow Migration
-- ============================================

-- ============================================
-- STEP 1: Create setups table
-- ============================================

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

-- Insert setups with the new pricing matrix
INSERT INTO setups (name, display_name, badge, description, base_price, max_players, sort_order) VALUES
('ps5', 'PlayStation 5', 'NEXT-GEN', 'DualSense haptics, 4K @ 60fps, ray-traced worlds. Latest titles, always patched, always ready.', 150, 4, 1),
('ps4', 'PlayStation 4', 'COUCH CO-OP', 'Classics that never aged - GTA V, God of War, FIFA nights. Two controllers, one couch, zero excuses.', 100, 4, 2),
('arcade', 'Vintage Arcade', 'OG VIBES', 'Mortal Kombat, Street Fighter, Tekken on the original cabinet. Coin-op feel without the coins.', 50, 4, 3),
('racing', 'Sim Racing Rig', 'FULL SEND', 'Force-feedback wheel, pedals, bucket seat. Forza, Gran Turismo, Assetto Corsa - feel every kerb.', 100, 1, 4),
('pc', 'PC Gaming', 'ULTIMATE RIG', 'High-performance gaming PC with RTX graphics, 240Hz monitor, mechanical keyboard, and precision mouse. Play Valorant, CS2, League of Legends, and more.', 150, 4, 5)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  max_players = EXCLUDED.max_players,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- STEP 2: Update session_types with multipliers
-- ============================================

-- Add multiplier column if it doesn't exist
ALTER TABLE session_types ADD COLUMN IF NOT EXISTS price_multiplier DECIMAL DEFAULT 1.0;

-- Update multipliers for all session types
UPDATE session_types SET price_multiplier = 1.0 WHERE name = 'Solo';
UPDATE session_types SET price_multiplier = 1.5 WHERE name = 'Duo';
UPDATE session_types SET price_multiplier = 2.0 WHERE name = 'Squad';

-- ============================================
-- STEP 3: Update bookings table
-- ============================================

-- Add setup_id column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS setup_id UUID REFERENCES setups(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_setup_id ON bookings(setup_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date_setup ON bookings(booking_date, setup_id);

-- ============================================
-- STEP 4: Enable RLS on setups table
-- ============================================

ALTER TABLE setups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view setups
DROP POLICY IF EXISTS "Anyone can view setups" ON setups;
CREATE POLICY "Anyone can view setups" ON setups FOR SELECT USING (true);

-- Optionally allow admins to update setups (if you have an admin role)
-- CREATE POLICY "Admins can update setups" ON setups FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
-- );

-- ============================================
-- STEP 5: Migration - Set default setup for existing bookings
-- ============================================

-- Update existing bookings to have PS5 as the default setup if they don't have one
UPDATE bookings 
SET setup_id = (SELECT id FROM setups WHERE name = 'ps5' LIMIT 1)
WHERE setup_id IS NULL;

-- ============================================
-- STEP 6: Verify the migration
-- ============================================

-- Check setups were created
SELECT COUNT(*) as setup_count FROM setups WHERE is_active = true;

-- Check bookings were updated
SELECT COUNT(*) as bookings_with_setup FROM bookings WHERE setup_id IS NOT NULL;

-- Sample query to verify the pricing matrix
SELECT 
  s.name,
  s.display_name,
  s.base_price,
  st.name as session_type,
  st.price_multiplier,
  ROUND(s.base_price * CAST(st.price_multiplier as DECIMAL)) as calculated_price
FROM setups s
CROSS JOIN session_types st
WHERE s.is_active = true
ORDER BY s.sort_order, st.sort_order;
