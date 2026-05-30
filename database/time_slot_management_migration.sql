-- Admin time-slot schedule controls.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS holiday_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  is_closed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_slot_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, time_slot_id)
);

CREATE INDEX IF NOT EXISTS idx_holiday_schedule_date ON holiday_schedule(date);
CREATE INDEX IF NOT EXISTS idx_time_slot_overrides_date ON time_slot_overrides(date);
CREATE INDEX IF NOT EXISTS idx_time_slot_overrides_slot ON time_slot_overrides(time_slot_id);

ALTER TABLE holiday_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view holiday schedule" ON holiday_schedule;
CREATE POLICY "Authenticated users can view holiday schedule"
  ON holiday_schedule
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view time slot overrides" ON time_slot_overrides;
CREATE POLICY "Authenticated users can view time slot overrides"
  ON time_slot_overrides
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage holiday schedule" ON holiday_schedule;
CREATE POLICY "Admins can manage holiday schedule"
  ON holiday_schedule
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage time slot overrides" ON time_slot_overrides;
CREATE POLICY "Admins can manage time slot overrides"
  ON time_slot_overrides
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));