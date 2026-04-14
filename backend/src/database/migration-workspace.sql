-- ============================================
-- AgriCore — Workspace System Migration
-- Run AFTER migration.sql, migration-admin.sql,
-- and migration-security.sql
-- ============================================

-- =============================================
--  1. EXTEND USER ROLES
-- =============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer', 'advisor', 'admin', 'supervisor', 'field_agent', 'office_staff'));

-- =============================================
--  2. DEPARTMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add department_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- =============================================
--  3. TASKS (Job Assignments)
-- =============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can see tasks assigned to them or by them
DROP POLICY IF EXISTS tasks_select ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT USING (
  auth.uid() IN (
    SELECT auth_id FROM users WHERE id = tasks.assigned_to
    UNION
    SELECT auth_id FROM users WHERE id = tasks.assigned_by
  )
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- =============================================
--  4. PERSONAL TODOS
-- =============================================

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due ON todos(due_date) WHERE completed = false;

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Todos are strictly private
DROP POLICY IF EXISTS todos_owner ON todos;
CREATE POLICY todos_owner ON todos FOR ALL USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = todos.user_id)
);

-- =============================================
--  5. NOTES
-- =============================================

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Owner + shared recipients can view
DROP POLICY IF EXISTS notes_select ON notes;
CREATE POLICY notes_select ON notes FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = notes.user_id)
  OR (is_shared = true AND (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(shared_with))
);

-- Only owner can modify
DROP POLICY IF EXISTS notes_modify ON notes;
CREATE POLICY notes_modify ON notes FOR ALL USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = notes.user_id)
);

-- =============================================
--  6. FIELD VISITS
-- =============================================

CREATE TABLE IF NOT EXISTS field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_name TEXT,
  notes TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_visits_agent ON field_visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_date ON field_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_field_visits_farmer ON field_visits(farmer_id);

ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS field_visits_select ON field_visits;
CREATE POLICY field_visits_select ON field_visits FOR SELECT USING (
  auth.uid() = (SELECT auth_id FROM users WHERE id = field_visits.agent_id)
  OR (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(shared_with)
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- =============================================
--  7. CHAT ROOMS & MESSAGES
-- =============================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_members (
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_department ON chat_rooms(department_id);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Members can access their rooms
DROP POLICY IF EXISTS chat_rooms_member ON chat_rooms;
CREATE POLICY chat_rooms_member ON chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.room_id = chat_rooms.id AND u.auth_id = auth.uid()
  )
);

DROP POLICY IF EXISTS chat_messages_member ON chat_messages;
CREATE POLICY chat_messages_member ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.room_id = chat_messages.room_id AND u.auth_id = auth.uid()
  )
);

-- =============================================
--  8. NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'task_assigned', 'task_completed', 'visit_shared',
    'message_received', 'note_shared', 'system',
    'verification_request', 'verification_approved', 'verification_rejected',
    'data_submission', 'data_pending', 'data_approved', 'data_rejected',
    'ticket_created', 'ticket_updated', 'ticket_resolved',
    'deletion_approved', 'deletion_rejected',
    'plan_update'
  )),
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

-- =============================================
--  9. ACTIVITY LOG (Audit Trail)
-- =============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read activity logs
DROP POLICY IF EXISTS activity_logs_admin ON activity_logs;
CREATE POLICY activity_logs_admin ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- =============================================
--  10. SEED DEFAULT DEPARTMENTS
-- =============================================

INSERT INTO departments (name, description) VALUES
  ('Crop Production', 'Manages crop cultivation programs across all provinces'),
  ('Livestock Services', 'Animal husbandry, veterinary, and livestock programs'),
  ('Extension Services', 'Field agent outreach and farmer support'),
  ('Land Reform', 'Land redistribution and tenure reform programs'),
  ('Agricultural Economics', 'Market analysis, pricing, and trade')
ON CONFLICT (name) DO NOTHING;
