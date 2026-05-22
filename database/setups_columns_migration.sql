-- ============================================
-- SETUPS TABLE: Add missing columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add updated_at column if it doesn't exist
ALTER TABLE setups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add is_active column if it doesn't exist (should already be there)
ALTER TABLE setups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add maintenance_reason column if it doesn't exist
ALTER TABLE setups ADD COLUMN IF NOT EXISTS maintenance_reason TEXT;

-- Verify
SELECT id, name, is_active, updated_at, maintenance_reason FROM setups ORDER BY sort_order;
