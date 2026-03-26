-- =============================================
--  AgriCore — Profile & Address Migration
--  Adds profile_image_url and structured address
--  fields to the users table for all user types.
-- =============================================

-- Add profile image URL to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add structured address fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suburb TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS town TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add constraint: postal_code must be numeric if provided
ALTER TABLE users ADD CONSTRAINT users_postal_code_numeric
  CHECK (postal_code IS NULL OR postal_code ~ '^\d+$');

-- Update RLS policy so users can update their own profile fields
-- (The existing policy from migration.sql allows users to update their own row,
--  so these new columns are already covered.)
