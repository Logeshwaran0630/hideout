-- ============================================
-- PAYMENT TRACKING SYSTEM
-- ============================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS collected_by TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_paid_at ON bookings(paid_at);

-- Optional backfill if you already consider completed bookings as paid.
-- UPDATE bookings
-- SET payment_status = 'paid'
-- WHERE status = 'completed' AND payment_status IS NULL;
