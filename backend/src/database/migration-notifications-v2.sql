-- =============================================
--  NOTIFICATIONS — Expand type CHECK constraint
--  Run after migration-workspace.sql if the
--  notifications table already exists.
-- =============================================

-- Drop the old CHECK constraint and add the expanded one
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'task_assigned', 'task_completed', 'visit_shared',
  'message_received', 'note_shared', 'system',
  'verification_request', 'verification_approved', 'verification_rejected',
  'data_pending', 'data_approved', 'data_rejected',
  'ticket_created', 'ticket_updated', 'ticket_resolved',
  'deletion_approved', 'deletion_rejected'
));
