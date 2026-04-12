-- =============================================
--  AgriCore — Auth User Sync Trigger
--  Auto-creates a public.users row when a new
--  Supabase Auth user is created. This acts as a
--  safety net alongside the app-level signup logic.
--  Run AFTER migration.sql and migration-workspace.sql.
-- =============================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if no row already exists (app code usually creates it first)
  INSERT INTO public.users (auth_id, email, name, role, verification_status)
  VALUES (
    NEW.id,
    COALESCE(LOWER(TRIM(NEW.email)), ''),
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), 'New User'),
    COALESCE(
      CASE
        WHEN NEW.raw_user_meta_data->>'role' IN ('farmer','government','admin','supervisor','field_agent','office_staff')
        THEN NEW.raw_user_meta_data->>'role'
        ELSE NULL
      END,
      'farmer'
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'government' THEN 'pending'
      ELSE 'none'
    END
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
