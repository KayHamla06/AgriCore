-- ============================================
-- AgriCore — Support, Compliance & Performance
-- Migration: Tickets + Enhanced Deletion
-- ============================================

-- 1. Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature_request', 'general_inquiry')),
  urgency TEXT NOT NULL DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  attachment_url TEXT,
  attachment_path TEXT,
  admin_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add deletion_reason column to deletion_requests for structured reasons
-- (Only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deletion_requests' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE deletion_requests ADD COLUMN deletion_reason TEXT;
  END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- 4. RLS for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid()::UUID = user_id);

CREATE POLICY "Users can create own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid()::UUID = user_id);

-- Admin policies (service role bypasses RLS)
