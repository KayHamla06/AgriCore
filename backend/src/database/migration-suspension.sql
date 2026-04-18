-- ============================================
-- AgriCore — Account Suspension Migration
-- Adds suspension fields to users table
-- and creates suspension_logs audit table.
-- ============================================

-- 1. Add suspension columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_suspended    boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at    timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by    uuid      REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Index for fast lookup of suspended users
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended) WHERE is_suspended = true;

-- 2. Suspension audit log
CREATE TABLE IF NOT EXISTS suspension_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id    uuid NOT NULL REFERENCES users(id),
  action      text NOT NULL CHECK (action IN ('suspend', 'unsuspend')),
  reason      text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspension_logs_user ON suspension_logs(user_id);

-- 3. RLS
ALTER TABLE suspension_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on suspension_logs"
  ON suspension_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. File tracking table
CREATE TABLE IF NOT EXISTS files (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_type   text NOT NULL CHECK (file_type IN ('image', 'pdf', 'document')),
  category    text NOT NULL CHECK (category IN ('profile', 'id', 'farm', 'visit', 'other')),
  file_name   text,
  file_url    text NOT NULL,
  file_size   bigint,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on files"
  ON files FOR ALL
  USING (true)
  WITH CHECK (true);
