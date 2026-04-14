-- =============================================
--  NOTIFICATIONS — Create table if needed and
--  set the correct type CHECK constraint.
--  Safe to run at any time.
-- =============================================

-- Create the table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_owner ON notifications;
CREATE POLICY notifications_owner ON notifications FOR ALL USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = notifications.user_id)
);

-- Drop the old CHECK constraint and add the expanded one
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'task_assigned', 'task_completed', 'visit_shared',
  'message_received', 'note_shared', 'system',
  'verification_request', 'verification_approved', 'verification_rejected',
  'data_submission', 'data_pending', 'data_approved', 'data_rejected',
  'ticket_created', 'ticket_updated', 'ticket_resolved',
  'deletion_approved', 'deletion_rejected',
  'plan_update'
));
