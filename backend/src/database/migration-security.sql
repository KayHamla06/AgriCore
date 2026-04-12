-- ============================================
-- AgriCore — Security Hardening Migration
-- Run AFTER migration.sql and migration-admin.sql
-- ============================================

-- =============================================
--  1. PASSWORD RESET TOKENS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at) WHERE used = false;

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- RLS for password_resets — server-only access (service role)
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- No public access — only service role key can manage reset tokens
-- (No RLS policies = denied by default for anon/authenticated roles)

-- =============================================
--  2. PERFORMANCE INDEXES
-- =============================================

-- Farmer search & filtering
CREATE INDEX IF NOT EXISTS idx_farmers_full_name ON farmers(name);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON farmers(district);
CREATE INDEX IF NOT EXISTS idx_farmers_province ON farmers(province);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);

-- Livestock lookups by farmer
CREATE INDEX IF NOT EXISTS idx_livestock_farmer_id ON livestock(farmer_id);

-- Crop lookups by farmer
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);

-- Soil data lookups by farmer
CREATE INDEX IF NOT EXISTS idx_soil_data_farmer_id ON soil_data(farmer_id);

-- Weather history lookups
CREATE INDEX IF NOT EXISTS idx_weather_history_farmer_id ON weather_history(farmer_id);
CREATE INDEX IF NOT EXISTS idx_weather_history_date ON weather_history(date);

-- Support plans — farmer and status filtering
CREATE INDEX IF NOT EXISTS idx_support_plans_farmer_id ON support_plans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_support_plans_status ON support_plans(status);
CREATE INDEX IF NOT EXISTS idx_support_plans_approval ON support_plans(approval_status);

-- Users — role and email lookup
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role_verification_status ON users(role, verification_status);

-- Enforce case-insensitive uniqueness for email identities.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE email IS NOT NULL
    GROUP BY lower(btrim(email))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create case-insensitive unique email index: duplicate normalized emails exist in users';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique ON users (lower(btrim(email)));

-- Verification lookups for admin review flows
CREATE INDEX IF NOT EXISTS idx_verification_docs_user_status ON verification_documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_status ON verification_requests(user_id, status);

-- Deletion requests — status filtering
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);

-- =============================================
--  3. CLEANUP: AUTO-EXPIRE OLD RESET TOKENS
-- =============================================

-- Optional: create a function to clean up expired tokens
-- Can be called via pg_cron or a cron job
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
