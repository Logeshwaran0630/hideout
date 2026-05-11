-- Google Calendar Single Source of Truth Implementation
-- Run this migration in Supabase SQL Editor

-- Step 1: Add calendar_event_id column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Step 2: Make calendar_event_id unique to prevent duplicate references
ALTER TABLE bookings ADD CONSTRAINT unique_calendar_event_id UNIQUE (calendar_event_id);

-- Step 3: Create index for faster lookups by calendar_event_id
CREATE INDEX IF NOT EXISTS idx_bookings_calendar_event_id ON bookings(calendar_event_id);

-- Step 4: Create index for bookings by date and status (improves query performance)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(booking_date, status);

-- Add helpful comment
COMMENT ON COLUMN bookings.calendar_event_id IS 'Google Calendar event ID - PRIMARY SOURCE OF TRUTH for slot availability';

-- Verify migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'calendar_event_id';
