-- =============================================
--  MIGRATION: Rename 'government' role to 'advisor'
--  Run this in the Supabase SQL Editor
-- =============================================

-- 1. Update existing users with role = 'government' to 'advisor'
UPDATE users SET role = 'advisor' WHERE role = 'government';

-- 2. Update support_plans created_by_role
UPDATE support_plans SET created_by_role = 'advisor' WHERE created_by_role = 'government';

-- 3. Drop and re-create the CHECK constraint on users.role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('farmer', 'advisor', 'admin', 'supervisor', 'field_agent', 'office_staff'));

-- 4. Drop and re-create the CHECK constraint on support_plans.created_by_role
ALTER TABLE support_plans DROP CONSTRAINT IF EXISTS support_plans_created_by_role_check;
ALTER TABLE support_plans ADD CONSTRAINT support_plans_created_by_role_check
  CHECK (created_by_role IN ('farmer', 'advisor'));

-- 5. Update any RLS policies that reference 'government'
-- (Re-create the governance policy if it exists)
DROP POLICY IF EXISTS "Government users can view all farmers" ON farmers;
CREATE POLICY "Advisor users can view all farmers"
  ON farmers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND users.role IN ('advisor', 'admin', 'supervisor')
    )
  );

-- 6. Update the auth sync trigger function if it references 'government'
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
