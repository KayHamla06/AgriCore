-- ============================================
-- AgriCore — Admin User Management Migration
-- Login activity tracking, profile permissions,
-- and admin edit capabilities.
-- ============================================

-- 1. LOGIN ACTIVITY TABLE
-- Tracks every login with IP, user agent, and geolocation
CREATE TABLE IF NOT EXISTS login_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  login_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_activity_user ON login_activity(user_id);
CREATE INDEX idx_login_activity_time ON login_activity(login_at DESC);

-- 2. PROFILE EDIT PERMISSIONS
-- Admin can grant/revoke users' ability to edit specific profile fields
CREATE TABLE IF NOT EXISTS profile_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_edit_profile BOOLEAN DEFAULT TRUE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id)
);

-- 3. ADMIN PROFILE EDITS AUDIT LOG
-- Tracks every time an admin edits a user's profile
CREATE TABLE IF NOT EXISTS admin_profile_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fields_changed JSONB NOT NULL,
  previous_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  reason TEXT,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_edits_target ON admin_profile_edits(target_user_id);
CREATE INDEX idx_admin_edits_admin ON admin_profile_edits(admin_id);

-- Enable RLS
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile_edits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role bypasses these)
DROP POLICY IF EXISTS "Users can view own login activity" ON login_activity;
CREATE POLICY "Users can view own login activity"
  ON login_activity FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can view own permissions" ON profile_permissions;
CREATE POLICY "Users can view own permissions"
  ON profile_permissions FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));
