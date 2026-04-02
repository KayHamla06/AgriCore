-- ============================================
-- AgriCore — Tickets Admin RLS Policies
-- Ensures admin users can view/update all tickets
-- and authenticated users can access only own tickets.
-- ============================================

DO $$
BEGIN
  IF to_regclass('public.tickets') IS NULL THEN
    RAISE NOTICE 'Skipping tickets RLS policy migration because public.tickets does not exist. Run migration-tickets.sql first.';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY';

  -- Recreate policies to keep this migration idempotent and aligned with auth_id mapping.
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets';
  EXECUTE 'DROP POLICY IF EXISTS "Users can create own tickets" ON public.tickets';
  EXECUTE 'DROP POLICY IF EXISTS "Admin can view all tickets" ON public.tickets';
  EXECUTE 'DROP POLICY IF EXISTS "Admin can update tickets" ON public.tickets';

  EXECUTE '
    CREATE POLICY "Users can view own tickets"
      ON public.tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id = tickets.user_id
            AND u.auth_id = auth.uid()
        )
      )
  ';

  EXECUTE '
    CREATE POLICY "Users can create own tickets"
      ON public.tickets
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.id = tickets.user_id
            AND u.auth_id = auth.uid()
        )
      )
  ';

  EXECUTE '
    CREATE POLICY "Admin can view all tickets"
      ON public.tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.auth_id = auth.uid()
            AND u.role = ''admin''
        )
      )
  ';

  EXECUTE '
    CREATE POLICY "Admin can update tickets"
      ON public.tickets
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.auth_id = auth.uid()
            AND u.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users u
          WHERE u.auth_id = auth.uid()
            AND u.role = ''admin''
        )
      )
  ';
END $$;
