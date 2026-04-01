-- ============================================
-- AgriCore — Verification System v2 Migration
-- Adds verification_requests table and ensures
-- users.verification_status column exists.
-- ============================================

-- Ensure verification_status column exists on users table
-- with 'none' as the default for non-government users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE users
      ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'none'
        CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));
  ELSE
    -- Update check constraint to include 'none'
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_verification_status_check;
    ALTER TABLE users ADD CONSTRAINT users_verification_status_check
      CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));
    -- Set default for new rows
    ALTER TABLE users ALTER COLUMN verification_status SET DEFAULT 'none';
  END IF;
END $$;

-- Create verification_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- RLS for verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own verification requests
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view and update all verification requests (via service role key)
