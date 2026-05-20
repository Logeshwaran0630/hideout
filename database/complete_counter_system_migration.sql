-- ============================================
-- COMPLETE COUNTER SYSTEM - DATABASE MIGRATION
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'pending' CHECK (check_in_status IN ('pending', 'arrived', 'no_show'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_walkin BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_from TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS setup_id UUID REFERENCES setups(id);

DO $$
BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_time_slot_id_booking_date_key;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_date_time_slot_setup_key;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

ALTER TABLE bookings ADD CONSTRAINT bookings_booking_date_time_slot_setup_key UNIQUE (booking_date, time_slot_id, setup_id);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  preferred_setup TEXT,
  party_size INT DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'completed', 'cancelled')),
  notified_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS setup_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_id UUID REFERENCES setups(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'occupied')),
  current_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  occupied_since TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_setup_status_setup_id_unique ON setup_status(setup_id);

INSERT INTO setup_status (setup_id, status)
SELECT id, 'available'
FROM setups
ON CONFLICT (setup_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bookings_check_in_status ON bookings(check_in_status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone ON bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_waitlist_status_added_at ON waitlist(status, added_at);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view waitlist" ON waitlist;
CREATE POLICY "Anyone can view waitlist" ON waitlist FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify waitlist" ON waitlist;
CREATE POLICY "Admins can modify waitlist" ON waitlist FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

DROP POLICY IF EXISTS "Anyone can view setup_status" ON setup_status;
CREATE POLICY "Anyone can view setup_status" ON setup_status FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify setup_status" ON setup_status;
CREATE POLICY "Admins can modify setup_status" ON setup_status FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
