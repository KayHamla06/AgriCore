-- ============================================
-- AgriCore — Auth/Profile Sync Backfill
-- Ensures every auth.users account has a
-- matching public.users profile row.
--
-- Handles duplicate-email collisions by:
-- 1) Re-linking orphaned public.users rows
--    (email match + old auth_id no longer exists)
-- 2) Inserting only truly missing rows
-- ============================================

WITH auth_source AS (
  SELECT
    au.id AS auth_id,
    LOWER(COALESCE(au.email, '')) AS email_lc,
    COALESCE(au.email, '') AS email,
    COALESCE(
      NULLIF(au.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(au.email, ''), '@', 1),
      'New User'
    ) AS name,
    CASE
      WHEN (au.raw_user_meta_data->>'role') IN ('farmer', 'government', 'admin', 'supervisor', 'field_agent', 'office_staff')
        THEN (au.raw_user_meta_data->>'role')
      ELSE 'farmer'
    END AS role,
    CASE
      WHEN (au.raw_user_meta_data->>'role') = 'government' THEN 'pending'
      ELSE 'none'
    END AS verification_status
  FROM auth.users au
),
relinked AS (
  UPDATE public.users pu
  SET
    auth_id = src.auth_id,
    email = src.email,
    name = COALESCE(NULLIF(pu.name, ''), src.name),
    role = COALESCE(NULLIF(pu.role, ''), src.role),
    verification_status = COALESCE(NULLIF(pu.verification_status, ''), src.verification_status)
  FROM auth_source src
  WHERE LOWER(pu.email) = src.email_lc
    AND pu.auth_id <> src.auth_id
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au_old WHERE au_old.id = pu.auth_id
    )
  RETURNING pu.auth_id
)
INSERT INTO public.users (auth_id, email, name, role, verification_status)
SELECT
  src.auth_id,
  src.email,
  src.name,
  src.role,
  src.verification_status
FROM auth_source src
LEFT JOIN public.users pu_auth
  ON pu_auth.auth_id = src.auth_id
LEFT JOIN public.users pu_email
  ON LOWER(pu_email.email) = src.email_lc
WHERE pu_auth.id IS NULL
  AND pu_email.id IS NULL;
