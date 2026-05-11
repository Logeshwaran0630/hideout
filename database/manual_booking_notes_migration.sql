-- Add notes column to bookings table for manual booking feature
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
