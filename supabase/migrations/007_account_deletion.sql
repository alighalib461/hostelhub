-- ============================================================================
-- Migration 007: Account Deletion Support & Secure RPC
-- ============================================================================

-- 1. Make payments recorded_by and voided_by ON DELETE SET NULL for safe user deletion
ALTER TABLE public.payments ALTER COLUMN recorded_by DROP NOT NULL;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_recorded_by_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_voided_by_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create Account Deletion Requests Table for Public Web Requests
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT NOT NULL UNIQUE DEFAULT ('DEL-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'resident', 'other')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Allow public to submit deletion requests
DROP POLICY IF EXISTS "Public can submit account deletion request" ON public.account_deletion_requests;
CREATE POLICY "Public can submit account deletion request" ON public.account_deletion_requests
  FOR INSERT WITH CHECK (true);

-- Disallow public read of deletion requests for privacy
DROP POLICY IF EXISTS "No public read for deletion requests" ON public.account_deletion_requests;
CREATE POLICY "No public read for deletion requests" ON public.account_deletion_requests
  FOR SELECT USING (false);

-- 3. Create Secure In-App Account Deletion Function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_email TEXT;
  v_hostel_ids UUID[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to delete account';
  END IF;

  -- Fetch user profile role and email
  SELECT role, email INTO v_role, v_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role = 'owner' THEN
    -- Collect owner hostel IDs
    SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::UUID[]) INTO v_hostel_ids
    FROM public.hostels
    WHERE owner_id = v_user_id;

    IF v_hostel_ids IS NOT NULL AND array_length(v_hostel_ids, 1) > 0 THEN
      -- 1. Delete payments belonging to owner hostels
      DELETE FROM public.payments WHERE hostel_id = ANY(v_hostel_ids);
      -- 2. Delete fee charges belonging to owner hostels
      DELETE FROM public.fee_charges WHERE hostel_id = ANY(v_hostel_ids);
      -- 3. Delete resident assignments for owner hostels
      DELETE FROM public.resident_assignments WHERE hostel_id = ANY(v_hostel_ids);
      -- 4. Delete resident documents for residents in owner hostels
      DELETE FROM public.resident_documents WHERE resident_id IN (
        SELECT id FROM public.residents WHERE hostel_id = ANY(v_hostel_ids)
      );
      -- 5. Delete residents in owner hostels
      DELETE FROM public.residents WHERE hostel_id = ANY(v_hostel_ids);
      -- 6. Delete registration documents for owner hostels
      DELETE FROM public.registration_documents WHERE registration_request_id IN (
        SELECT id FROM public.registration_requests WHERE hostel_id = ANY(v_hostel_ids)
      );
      -- 7. Delete registration requests for owner hostels
      DELETE FROM public.registration_requests WHERE hostel_id = ANY(v_hostel_ids);
      -- 8. Delete beds & rooms for owner hostels
      DELETE FROM public.beds WHERE room_id IN (
        SELECT id FROM public.rooms WHERE hostel_id = ANY(v_hostel_ids)
      );
      DELETE FROM public.rooms WHERE hostel_id = ANY(v_hostel_ids);
      -- 9. Delete hostels
      DELETE FROM public.hostels WHERE id = ANY(v_hostel_ids);
    END IF;

    -- Clear any remaining payments recorded_by / voided_by references
    UPDATE public.payments SET recorded_by = NULL WHERE recorded_by = v_user_id;
    UPDATE public.payments SET voided_by = NULL WHERE voided_by = v_user_id;

  ELSIF v_role = 'resident' THEN
    -- For resident: unlink user account from resident record
    UPDATE public.residents
    SET user_id = NULL
    WHERE user_id = v_user_id;
  END IF;

  -- Delete profile record
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'role', v_role,
    'message', 'Account and associated data deleted permanently'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- 4. Create Function for Public Web Deletion Requests
CREATE OR REPLACE FUNCTION public.submit_account_deletion_request(
    p_full_name text,
    p_email text,
    p_phone text,
    p_role text DEFAULT 'resident',
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code text;
BEGIN
    v_code := 'REQ-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    INSERT INTO public.account_deletion_requests (
        request_code,
        full_name,
        email,
        phone,
        role,
        reason
    ) VALUES (
        v_code,
        trim(p_full_name),
        lower(trim(p_email)),
        trim(p_phone),
        p_role,
        trim(p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_code', v_code
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_account_deletion_request TO anon, authenticated;

