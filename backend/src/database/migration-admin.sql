-- ============================================
-- AgriCore — Admin & Deletion Requests Migration
-- Run this AFTER the main migration.sql
-- ============================================

-- 1. Update users role CHECK to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('farmer', 'government', 'admin'));

-- =============================================
--  DELETION REQUESTS TABLE
--  Stores user requests to delete their account.
--  Admin must approve before actual deletion.
-- =============================================
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);

-- =============================================
--  RLS POLICIES for deletion_requests
-- =============================================
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
DROP POLICY IF EXISTS "Users can view own deletion requests" ON deletion_requests;
CREATE POLICY "Users can view own deletion requests"
    ON deletion_requests FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_id FROM users WHERE id = deletion_requests.user_id
    ));

-- Users can create their own deletion requests
DROP POLICY IF EXISTS "Users can create own deletion requests" ON deletion_requests;
CREATE POLICY "Users can create own deletion requests"
    ON deletion_requests FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT auth_id FROM users WHERE id = deletion_requests.user_id
    ));

-- Admins can view all deletion requests
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON deletion_requests;
CREATE POLICY "Admins can view all deletion requests"
    ON deletion_requests FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_id FROM users WHERE role = 'admin'
    ));

-- Admins can update deletion requests (approve/reject)
DROP POLICY IF EXISTS "Admins can update deletion requests" ON deletion_requests;
CREATE POLICY "Admins can update deletion requests"
    ON deletion_requests FOR UPDATE
    USING (auth.uid() IN (
        SELECT auth_id FROM users WHERE role = 'admin'
    ));
