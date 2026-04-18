-- ============================================
-- AgriCore — Notice Board Migration
-- Targeted broadcast system for admin/advisor
-- announcements with audience filtering.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Notices table ──
CREATE TABLE IF NOT EXISTS notices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('admin', 'advisor')),
  expiry_date   TIMESTAMPTZ,          -- NULL = persistent / no expiry
  is_pinned     BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notice targets (audience filters) ──
CREATE TABLE IF NOT EXISTS notice_targets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id     UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  role          TEXT CHECK (role IN ('farmer', 'advisor', 'admin', 'supervisor', 'field_agent', 'office_staff')),
  province      TEXT,
  district      TEXT,
  farming_type  TEXT CHECK (farming_type IN ('crop', 'livestock', 'mixed') OR farming_type IS NULL),
  farmer_scale  TEXT CHECK (farmer_scale IN ('small', 'commercial') OR farmer_scale IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_notice_targets_notice ON notice_targets(notice_id);

-- ── Notice views (analytics) ──
CREATE TABLE IF NOT EXISTS notice_views (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id     UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_views_notice ON notice_views(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_views_user   ON notice_views(user_id);

-- ── RLS ──
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_views ENABLE ROW LEVEL SECURITY;

-- Admin/service can do everything
CREATE POLICY notices_service_all ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY notice_targets_service_all ON notice_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY notice_views_service_all ON notice_views FOR ALL USING (true) WITH CHECK (true);
