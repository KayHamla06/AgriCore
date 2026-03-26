-- =============================================
--  AgriCore — Governance, Verification & Approval Migration
--  Adds verification system, data approval pipeline,
--  verification documents, and audit logging.
-- =============================================

-- =============================================
--  1. VERIFICATION STATUS ON USERS
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- =============================================
--  2. VERIFICATION DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'id_document', 'farm_registration', 'farm_details',
        'proof_of_employment', 'employee_verification'
    )),
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    review_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_verification_docs_user ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_status ON verification_documents(status);

-- RLS for verification_documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY verdocs_own_read ON verification_documents
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY verdocs_own_insert ON verification_documents
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- =============================================
--  3. DATA APPROVAL STATUS ON DATA TABLES
-- =============================================
ALTER TABLE livestock ADD COLUMN IF NOT EXISTS data_status TEXT DEFAULT 'approved'
  CHECK (data_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE crops ADD COLUMN IF NOT EXISTS data_status TEXT DEFAULT 'approved'
  CHECK (data_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE soil_data ADD COLUMN IF NOT EXISTS data_status TEXT DEFAULT 'approved'
  CHECK (data_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE support_plans ADD COLUMN IF NOT EXISTS data_status TEXT DEFAULT 'approved'
  CHECK (data_status IN ('pending', 'approved', 'rejected'));

-- =============================================
--  4. DATA CHANGE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS data_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('livestock', 'crops', 'soil_data', 'support_plans', 'farmer_profile')),
    resource_id UUID,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_changes_user ON data_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_changes_status ON data_change_requests(status);

-- RLS for data_change_requests
ALTER TABLE data_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY datareq_read ON data_change_requests
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'government'))
    );

CREATE POLICY datareq_insert ON data_change_requests
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- =============================================
--  5. AUDIT LOGS TABLE (enhanced)
-- =============================================
-- Already have activity_logs from migration-workspace.sql
-- Add additional index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
