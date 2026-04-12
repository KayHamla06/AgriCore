-- =============================================
--  DB function to un-confirm a user's email
--  (used after admin.createUser with email_confirm: true)
--  Run this in the Supabase SQL Editor
-- =============================================

CREATE OR REPLACE FUNCTION public.unconfirm_user_email(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NULL
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
