-- Complete slot booking flow setup for Supabase.
-- Run this entire file in the Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO time_slots (label, start_time, end_time, sort_order) VALUES
  ('11:00 AM - 12:00 PM', '11:00:00', '12:00:00', 1),
  ('12:00 PM - 1:00 PM', '12:00:00', '13:00:00', 2),
  ('1:00 PM - 2:00 PM', '13:00:00', '14:00:00', 3),
  ('2:00 PM - 3:00 PM', '14:00:00', '15:00:00', 4),
  ('3:00 PM - 4:00 PM', '15:00:00', '16:00:00', 5),
  ('4:00 PM - 5:00 PM', '16:00:00', '17:00:00', 6),
  ('5:00 PM - 6:00 PM', '17:00:00', '18:00:00', 7),
  ('6:00 PM - 7:00 PM', '18:00:00', '19:00:00', 8),
  ('7:00 PM - 8:00 PM', '19:00:00', '20:00:00', 9),
  ('8:00 PM - 9:00 PM', '20:00:00', '21:00:00', 10),
  ('9:00 PM - 10:00 PM', '21:00:00', '22:00:00', 11),
  ('10:00 PM - 11:00 PM', '22:00:00', '23:00:00', 12)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_players INT NOT NULL,
  price_per_hour INT NOT NULL,
  description TEXT,
  h_coins_earned INT DEFAULT 10,
  sort_order INT DEFAULT 0
);

INSERT INTO session_types (name, max_players, price_per_hour, description, h_coins_earned, sort_order) VALUES
  ('Solo', 1, 199, 'One player, any console, headset included', 10, 1),
  ('Duo', 2, 349, 'Two players, same or split consoles, 2 headsets', 15, 2),
  ('Squad', 4, 599, 'Up to 4 players, all consoles, bonus H Coins', 25, 3)
ON CONFLICT DO NOTHING;

INSERT INTO session_types (name, max_players, price_per_hour, description, h_coins_earned, sort_order)
SELECT 'Free Session', 1, 0, 'Redeemed with 100 H Coins - 1 hour free play', 0, 4
WHERE NOT EXISTS (
  SELECT 1 FROM session_types WHERE name = 'Free Session'
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id) NOT NULL,
  session_type_id UUID REFERENCES session_types(id) NOT NULL,
  booking_date DATE NOT NULL,
  player_count INT NOT NULL,
  total_price INT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(time_slot_id, booking_date)
);

CREATE SEQUENCE IF NOT EXISTS booking_code_seq START 1024;

CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := 'HBK-' || LPAD(nextval('booking_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_code ON bookings;
CREATE TRIGGER set_booking_code
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_code();

CREATE TABLE IF NOT EXISTS h_coin_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  type TEXT CHECK (type IN ('earn', 'redeem')) NOT NULL,
  reference_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION award_h_coins_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  coins_earned INT;
  session_price INT;
BEGIN
  SELECT h_coins_earned, price_per_hour INTO coins_earned, session_price
  FROM session_types
  WHERE id = NEW.session_type_id;

  IF COALESCE(session_price, 0) = 0 OR COALESCE(coins_earned, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO h_coin_ledger (user_id, amount, type, reference_id, description)
  VALUES (
    NEW.user_id,
    COALESCE(coins_earned, 0),
    'earn',
    NEW.id,
    'Booking completed: ' || NEW.booking_code
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS award_coins_on_booking ON bookings;
CREATE TRIGGER award_coins_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_h_coins_on_booking();

CREATE OR REPLACE FUNCTION check_sufficient_coins()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INT;
BEGIN
  IF NEW.type = 'redeem' THEN
    SELECT COALESCE(SUM(amount), 0) INTO current_balance
    FROM h_coin_ledger
    WHERE user_id = NEW.user_id;

    IF current_balance + NEW.amount < 0 THEN
      RAISE EXCEPTION 'Insufficient H Coins. Current balance: %, Required: %',
        current_balance,
        ABS(NEW.amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_coins_before_insert ON h_coin_ledger;
CREATE TRIGGER check_coins_before_insert
  BEFORE INSERT ON h_coin_ledger
  FOR EACH ROW
  EXECUTE FUNCTION check_sufficient_coins();

CREATE INDEX IF NOT EXISTS idx_h_coin_ledger_user_id ON h_coin_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_h_coin_ledger_created_at ON h_coin_ledger(created_at);

CREATE OR REPLACE FUNCTION redeem_free_session(
  p_booking_date DATE,
  p_time_slot_id UUID
)
RETURNS TABLE (
  id UUID,
  booking_code TEXT,
  booking_date DATE,
  total_price INT,
  time_slot_id UUID,
  session_type_id UUID
) AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_balance INT;
  free_session_id UUID;
  new_booking_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_booking_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Free sessions must be booked at least 24 hours in advance';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(current_user_id::TEXT));

  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM h_coin_ledger
  WHERE user_id = current_user_id;

  IF current_balance < 100 THEN
    RAISE EXCEPTION 'Insufficient H Coins. Current balance: %, Required: 100', current_balance;
  END IF;

  SELECT st.id INTO free_session_id
  FROM session_types st
  WHERE st.name = 'Free Session'
  ORDER BY st.sort_order, st.created_at
  LIMIT 1;

  IF free_session_id IS NULL THEN
    RAISE EXCEPTION 'Free session type not found';
  END IF;

  INSERT INTO bookings (
    user_id,
    time_slot_id,
    session_type_id,
    booking_date,
    player_count,
    total_price,
    status
  )
  VALUES (
    current_user_id,
    p_time_slot_id,
    free_session_id,
    p_booking_date,
    1,
    0,
    'confirmed'
  )
  RETURNING bookings.id INTO new_booking_id;

  INSERT INTO h_coin_ledger (user_id, amount, type, reference_id, description)
  SELECT current_user_id, -100, 'redeem', b.id, 'Redeemed 100 coins for free session: ' || b.booking_code
  FROM bookings b
  WHERE b.id = new_booking_id;

  RETURN QUERY
  SELECT b.id, b.booking_code, b.booking_date, b.total_price, b.time_slot_id, b.session_type_id
  FROM bookings b
  WHERE b.id = new_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_redemptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  amount INT,
  created_at TIMESTAMPTZ,
  booking_code TEXT,
  booking_date DATE,
  time_slot_label TEXT
) AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.amount,
    l.created_at,
    b.booking_code,
    b.booking_date,
    ts.label AS time_slot_label
  FROM h_coin_ledger l
  LEFT JOIN bookings b ON l.reference_id = b.id
  LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
  WHERE l.user_id = p_user_id
    AND l.type = 'redeem'
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE h_coin_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view time_slots" ON time_slots;
DROP POLICY IF EXISTS "Anyone can view session_types" ON session_types;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can view confirmed booking availability" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own ledger" ON h_coin_ledger;

CREATE POLICY "Anyone can view time_slots" ON time_slots
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view session_types" ON session_types
  FOR SELECT USING (true);

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view confirmed booking availability" ON bookings
  FOR SELECT TO authenticated USING (status = 'confirmed');

CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ledger" ON h_coin_ledger
  FOR SELECT USING (auth.uid() = user_id);
