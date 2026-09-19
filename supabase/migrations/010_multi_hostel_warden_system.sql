-- ============================================================================
-- Migration 010: Multi-Hostel Architecture, Warden System & Online Payments
-- ============================================================================

-- 1. UPDATE PROFILES ROLE CHECK TO INCLUDE 'warden'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'warden', 'resident'));

-- 2. EXTEND HOSTELS TABLE WITH CITY, DESCRIPTION, AND SINGLE CURRENT MENU IMAGE
ALTER TABLE public.hostels 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS current_menu_image_url TEXT,
  ADD COLUMN IF NOT EXISTS current_menu_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_menu_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. WARDEN ASSIGNMENTS TABLE (Links Warden to 1 or more Hostels with explicit permissions)
CREATE TABLE IF NOT EXISTS public.warden_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '{
    "can_view_residents": true,
    "can_add_residents": true,
    "can_edit_residents": true,
    "can_manage_rooms": true,
    "can_manage_beds": true,
    "can_record_payments": true,
    "can_verify_online_payments": true,
    "can_view_fees": true,
    "can_manage_complaints": true,
    "can_manage_menu": true,
    "can_create_announcements": true,
    "can_view_expenses": true,
    "can_manage_expenses": false,
    "can_view_reports": true,
    "can_check_in_out": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hostel_id)
);

CREATE INDEX IF NOT EXISTS idx_warden_assignments_user ON public.warden_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_warden_assignments_hostel ON public.warden_assignments(hostel_id);

CREATE OR REPLACE TRIGGER trg_warden_assignments_updated_at
  BEFORE UPDATE ON public.warden_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. WARDEN INVITATIONS TABLE (Secure invite-only onboarding; NO public warden signup)
CREATE TABLE IF NOT EXISTS public.warden_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  hostel_ids UUID[] NOT NULL DEFAULT '{}',
  permissions JSONB NOT NULL DEFAULT '{
    "can_view_residents": true,
    "can_add_residents": true,
    "can_edit_residents": true,
    "can_manage_rooms": true,
    "can_manage_beds": true,
    "can_record_payments": true,
    "can_verify_online_payments": true,
    "can_view_fees": true,
    "can_manage_complaints": true,
    "can_manage_menu": true,
    "can_create_announcements": true,
    "can_view_expenses": true,
    "can_manage_expenses": false,
    "can_view_reports": true,
    "can_check_in_out": true
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warden_invitations_token ON public.warden_invitations(token);
CREATE INDEX IF NOT EXISTS idx_warden_invitations_email ON public.warden_invitations(email);

CREATE OR REPLACE TRIGGER trg_warden_invitations_updated_at
  BEFORE UPDATE ON public.warden_invitations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. HOSTEL PAYMENT ACCOUNTS TABLE (Configured per hostel: Bank / Easypaisa / JazzCash)
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'easypaisa', 'jazzcash')),
  bank_name TEXT,
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_hostel ON public.payment_accounts(hostel_id);

CREATE OR REPLACE TRIGGER trg_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. ONLINE PAYMENT SUBMISSIONS TABLE (Manual Bank/Easypaisa/JazzCash with Pending Verification)
CREATE TABLE IF NOT EXISTS public.online_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_charge_id UUID NOT NULL REFERENCES public.fee_charges(id) ON DELETE RESTRICT,
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE RESTRICT,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE RESTRICT,
  payment_account_id UUID REFERENCES public.payment_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'easypaisa', 'jazzcash')),
  transaction_id TEXT NOT NULL,
  proof_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_online_payments_hostel ON public.online_payment_submissions(hostel_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_resident ON public.online_payment_submissions(resident_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_status ON public.online_payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_online_payments_fee ON public.online_payment_submissions(fee_charge_id);

CREATE OR REPLACE TRIGGER trg_online_payment_submissions_updated_at
  BEFORE UPDATE ON public.online_payment_submissions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 7. ANNOUNCEMENTS & ANNOUNCEMENT TARGETS TABLES
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'both' CHECK (target_audience IN ('all', 'wardens', 'residents', 'both')),
  is_all_hostels BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_hostel ON public.announcements(hostel_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

CREATE OR REPLACE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE IF NOT EXISTS public.announcement_hostels (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, hostel_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_hostels_hostel ON public.announcement_hostels(hostel_id);

-- 8. EXPENSES TABLE (Categorized hostel operational expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN ('Utilities', 'Maintenance', 'Groceries / Food', 'Staff Salary', 'Rent', 'Internet / Cable', 'Cleaning / Supplies', 'Other')
  ),
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_proof_path TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_hostel ON public.expenses(hostel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

CREATE OR REPLACE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_hostel ON public.audit_logs(hostel_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS FOR WARDEN & MULTI-HOSTEL SECURITY
-- ============================================================================

-- Function: Check if user is active warden for given hostel
CREATE OR REPLACE FUNCTION public.is_hostel_warden(p_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.warden_assignments
    WHERE hostel_id = p_hostel_id 
      AND user_id = auth.uid() 
      AND is_active = true
  );
$$;

-- Function: Check if user has explicit permission for given hostel
CREATE OR REPLACE FUNCTION public.has_warden_permission(p_hostel_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms JSONB;
BEGIN
  -- If user is owner, they have all permissions
  IF public.is_hostel_owner(p_hostel_id) THEN
    RETURN true;
  END IF;

  -- Fetch permissions for warden
  SELECT permissions INTO v_perms
  FROM public.warden_assignments
  WHERE hostel_id = p_hostel_id 
    AND user_id = auth.uid() 
    AND is_active = true;

  IF NOT FOUND OR v_perms IS NULL THEN
    RETURN false;
  END IF;

  RETURN COALESCE((v_perms->>p_permission)::BOOLEAN, false);
END;
$$;

-- Function: Check if user is authorized (Owner OR Active Warden)
CREATE OR REPLACE FUNCTION public.is_hostel_authorized(p_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_hostel_owner(p_hostel_id) OR public.is_hostel_warden(p_hostel_id);
$$;

-- ============================================================================
-- BUSINESS RPCs: ONLINE PAYMENT VERIFICATION, MENU UPDATE, WARDEN INVITES
-- ============================================================================

-- RPC: Verify Online Payment (Approve or Reject)
CREATE OR REPLACE FUNCTION public.verify_online_payment(
  p_submission_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_sub RECORD;
  v_fee RECORD;
  v_payment_id UUID;
  v_receipt_no TEXT;
  v_new_amount_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: % (must be approve or reject)', p_action;
  END IF;

  -- Lock submission record
  SELECT * INTO v_sub
  FROM public.online_payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment submission not found';
  END IF;

  IF v_sub.status <> 'pending_verification' THEN
    RAISE EXCEPTION 'Payment submission is already processed (status: %)', v_sub.status;
  END IF;

  -- Verify authorization (Owner OR Warden with can_verify_online_payments permission)
  IF NOT (public.is_hostel_owner(v_sub.hostel_id) OR public.has_warden_permission(v_sub.hostel_id, 'can_verify_online_payments')) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to verify payments for this hostel';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.online_payment_submissions
    SET 
      status = 'rejected',
      rejection_reason = p_rejection_reason,
      reviewed_by = v_caller_id,
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_submission_id;

    -- Audit Log
    INSERT INTO public.audit_logs (hostel_id, actor_id, action, entity_type, entity_id, details)
    VALUES (v_sub.hostel_id, v_caller_id, 'REJECT_ONLINE_PAYMENT', 'online_payment_submission', p_submission_id::text, jsonb_build_object('reason', p_rejection_reason, 'amount', v_sub.amount));

    RETURN jsonb_build_object(
      'success', true,
      'status', 'rejected',
      'submission_id', p_submission_id
    );
  END IF;

  -- APPROVE FLOW
  -- Lock and fetch fee charge
  SELECT * INTO v_fee
  FROM public.fee_charges
  WHERE id = v_sub.fee_charge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated fee charge record not found';
  END IF;

  -- Compute new amounts
  v_new_amount_paid := v_fee.amount_paid + v_sub.amount;
  IF v_new_amount_paid >= v_fee.amount_due THEN
    v_new_status := 'paid';
  ELSIF v_new_amount_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Generate unique receipt number
  v_receipt_no := generate_receipt_number();

  -- Insert official payment record into payments table
  INSERT INTO public.payments (
    fee_charge_id,
    resident_id,
    hostel_id,
    amount,
    payment_date,
    payment_method,
    status,
    receipt_number,
    notes,
    recorded_by
  ) VALUES (
    v_fee.id,
    v_fee.resident_id,
    v_fee.hostel_id,
    v_sub.amount,
    CURRENT_DATE,
    v_sub.payment_method,
    'paid',
    v_receipt_no,
    'Online Payment Verified (Tx: ' || v_sub.transaction_id || ')',
    v_caller_id
  ) RETURNING id INTO v_payment_id;

  -- Update fee charge
  UPDATE public.fee_charges
  SET 
    amount_paid = v_new_amount_paid,
    status = v_new_status,
    updated_at = now()
  WHERE id = v_fee.id;

  -- Update submission status to approved and link payment_id
  UPDATE public.online_payment_submissions
  SET 
    status = 'approved',
    payment_id = v_payment_id,
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_submission_id;

  -- Audit Log
  INSERT INTO public.audit_logs (hostel_id, actor_id, action, entity_type, entity_id, details)
  VALUES (v_sub.hostel_id, v_caller_id, 'APPROVE_ONLINE_PAYMENT', 'online_payment_submission', p_submission_id::text, jsonb_build_object('payment_id', v_payment_id, 'receipt_number', v_receipt_no, 'amount', v_sub.amount));

  RETURN jsonb_build_object(
    'success', true,
    'status', 'approved',
    'submission_id', p_submission_id,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_no,
    'amount_paid_total', v_new_amount_paid,
    'fee_status', v_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_online_payment(UUID, TEXT, TEXT) TO authenticated;

-- RPC: Update Hostel Menu Image (Single Image per Hostel)
CREATE OR REPLACE FUNCTION public.update_hostel_menu(
  p_hostel_id UUID,
  p_image_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check permission: Owner or Warden with can_manage_menu
  IF NOT (public.is_hostel_owner(p_hostel_id) OR public.has_warden_permission(p_hostel_id, 'can_manage_menu')) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to manage the menu for this hostel';
  END IF;

  UPDATE public.hostels
  SET 
    current_menu_image_url = p_image_url,
    current_menu_updated_at = now(),
    current_menu_updated_by = v_caller_id,
    updated_at = now()
  WHERE id = p_hostel_id;

  -- Audit Log
  INSERT INTO public.audit_logs (hostel_id, actor_id, action, entity_type, entity_id, details)
  VALUES (p_hostel_id, v_caller_id, 'UPDATE_HOSTEL_MENU', 'hostel', p_hostel_id::text, jsonb_build_object('image_url', p_image_url));

  RETURN jsonb_build_object(
    'success', true,
    'hostel_id', p_hostel_id,
    'current_menu_image_url', p_image_url,
    'updated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_hostel_menu(UUID, TEXT) TO authenticated;

-- RPC: Accept Warden Invitation (Links user profile and creates assignments)
CREATE OR REPLACE FUNCTION public.accept_warden_invitation(
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_inv RECORD;
  v_hostel_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Find valid invitation
  SELECT * INTO v_inv
  FROM public.warden_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Update caller's profile role to warden
  UPDATE public.profiles
  SET 
    role = 'warden',
    full_name = COALESCE(v_inv.full_name, profiles.full_name),
    phone = COALESCE(v_inv.phone, profiles.phone),
    updated_at = now()
  WHERE id = v_caller_id;

  -- Create assignments for each hostel in hostel_ids
  FOREACH v_hostel_id IN ARRAY v_inv.hostel_ids
  LOOP
    INSERT INTO public.warden_assignments (
      user_id,
      hostel_id,
      is_active,
      permissions
    ) VALUES (
      v_caller_id,
      v_hostel_id,
      true,
      v_inv.permissions
    )
    ON CONFLICT (user_id, hostel_id) DO UPDATE SET
      is_active = true,
      permissions = EXCLUDED.permissions,
      updated_at = now();
  END LOOP;

  -- Mark invitation accepted
  UPDATE public.warden_invitations
  SET 
    status = 'accepted',
    updated_at = now()
  WHERE id = v_inv.id;

  -- Audit Log
  INSERT INTO public.audit_logs (hostel_id, actor_id, action, entity_type, entity_id, details)
  VALUES (v_inv.hostel_ids[1], v_caller_id, 'ACCEPT_WARDEN_INVITATION', 'warden_invitation', v_inv.id::text, jsonb_build_object('hostel_ids', v_inv.hostel_ids));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Warden invitation accepted successfully',
    'assigned_hostels_count', array_length(v_inv.hostel_ids, 1)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_warden_invitation(TEXT) TO authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW & UPDATED TABLES
-- ============================================================================

-- 1. WARDEN ASSIGNMENTS RLS
ALTER TABLE public.warden_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage warden assignments" ON public.warden_assignments;
CREATE POLICY "Owners manage warden assignments" ON public.warden_assignments
  FOR ALL TO authenticated
  USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Wardens view own assignments" ON public.warden_assignments;
CREATE POLICY "Wardens view own assignments" ON public.warden_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. WARDEN INVITATIONS RLS
ALTER TABLE public.warden_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage invitations" ON public.warden_invitations;
CREATE POLICY "Owners manage invitations" ON public.warden_invitations
  FOR ALL TO authenticated
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

DROP POLICY IF EXISTS "Anyone can view pending invite by token" ON public.warden_invitations;
CREATE POLICY "Anyone can view pending invite by token" ON public.warden_invitations
  FOR SELECT TO authenticated, anon
  USING (status = 'pending' AND expires_at > now());

-- 3. PAYMENT ACCOUNTS RLS
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage payment accounts" ON public.payment_accounts;
CREATE POLICY "Owners manage payment accounts" ON public.payment_accounts
  FOR ALL TO authenticated
  USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Wardens and residents view active payment accounts" ON public.payment_accounts;
CREATE POLICY "Wardens and residents view active payment accounts" ON public.payment_accounts
  FOR SELECT TO authenticated
  USING (
    is_active = true AND (
      public.is_hostel_authorized(hostel_id)
      OR EXISTS (
        SELECT 1 FROM public.residents
        WHERE residents.hostel_id = payment_accounts.hostel_id AND residents.user_id = auth.uid()
      )
    )
  );

-- 4. ONLINE PAYMENT SUBMISSIONS RLS
ALTER TABLE public.online_payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized staff manage online payments" ON public.online_payment_submissions;
CREATE POLICY "Authorized staff manage online payments" ON public.online_payment_submissions
  FOR ALL TO authenticated
  USING (public.is_hostel_authorized(hostel_id))
  WITH CHECK (public.is_hostel_authorized(hostel_id));

DROP POLICY IF EXISTS "Residents insert own online payments" ON public.online_payment_submissions;
CREATE POLICY "Residents insert own online payments" ON public.online_payment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_resident_user(resident_id) AND status = 'pending_verification'
  );

DROP POLICY IF EXISTS "Residents view own online payments" ON public.online_payment_submissions;
CREATE POLICY "Residents view own online payments" ON public.online_payment_submissions
  FOR SELECT TO authenticated
  USING (public.is_resident_user(resident_id));

-- 5. ANNOUNCEMENTS RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_hostels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized staff manage announcements" ON public.announcements;
CREATE POLICY "Authorized staff manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR (hostel_id IS NOT NULL AND public.is_hostel_authorized(hostel_id))
  )
  WITH CHECK (
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users view relevant announcements" ON public.announcements;
CREATE POLICY "Users view relevant announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    -- If created by user
    created_by = auth.uid()
    -- If owner of targeted hostel(s)
    OR (hostel_id IS NOT NULL AND public.is_hostel_owner(hostel_id))
    -- If warden assigned to targeted hostel(s) and audience allows
    OR (
      target_audience IN ('all', 'wardens', 'both') AND (
        is_all_hostels = true
        OR (hostel_id IS NOT NULL AND public.is_hostel_warden(hostel_id))
        OR EXISTS (
          SELECT 1 FROM public.announcement_hostels ah
          WHERE ah.announcement_id = announcements.id AND public.is_hostel_warden(ah.hostel_id)
        )
      )
    )
    -- If resident in targeted hostel(s) and audience allows
    OR (
      target_audience IN ('all', 'residents', 'both') AND (
        is_all_hostels = true
        OR EXISTS (
          SELECT 1 FROM public.residents r
          WHERE r.user_id = auth.uid() AND (
            r.hostel_id = announcements.hostel_id
            OR EXISTS (
              SELECT 1 FROM public.announcement_hostels ah
              WHERE ah.announcement_id = announcements.id AND ah.hostel_id = r.hostel_id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Announcement hostels link policy" ON public.announcement_hostels;
CREATE POLICY "Announcement hostels link policy" ON public.announcement_hostels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_hostels.announcement_id AND (a.created_by = auth.uid() OR public.is_hostel_authorized(announcement_hostels.hostel_id))
    )
  );

-- 6. EXPENSES RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized staff manage expenses" ON public.expenses;
CREATE POLICY "Authorized staff manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (
    public.is_hostel_owner(hostel_id)
    OR (public.is_hostel_warden(hostel_id) AND public.has_warden_permission(hostel_id, 'can_view_expenses'))
  )
  WITH CHECK (
    public.is_hostel_owner(hostel_id)
    OR (public.is_hostel_warden(hostel_id) AND public.has_warden_permission(hostel_id, 'can_manage_expenses'))
  );

-- 7. AUDIT LOGS RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view audit logs" ON public.audit_logs;
CREATE POLICY "Owners view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    hostel_id IS NULL OR public.is_hostel_owner(hostel_id)
  );

-- 8. UPDATE EXISTING TABLES RLS TO INCLUDE WARDEN ACCESS
-- Residents table: Wardens can view and manage residents for their assigned hostel
DROP POLICY IF EXISTS "Staff can manage residents in their hostels" ON public.residents;
CREATE POLICY "Staff can manage residents in their hostels" ON public.residents
  FOR ALL TO authenticated
  USING (public.is_hostel_authorized(hostel_id))
  WITH CHECK (public.is_hostel_authorized(hostel_id));

-- Rooms table: Wardens can manage rooms in their assigned hostel
DROP POLICY IF EXISTS "Staff can manage rooms in their hostels" ON public.rooms;
CREATE POLICY "Staff can manage rooms in their hostels" ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_hostel_authorized(hostel_id))
  WITH CHECK (public.is_hostel_authorized(hostel_id));

-- Beds table: Wardens can manage beds in their assigned hostel
DROP POLICY IF EXISTS "Staff can manage beds in their hostels" ON public.beds;
CREATE POLICY "Staff can manage beds in their hostels" ON public.beds
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = beds.room_id AND public.is_hostel_authorized(r.hostel_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = beds.room_id AND public.is_hostel_authorized(r.hostel_id)
    )
  );

-- Fee charges table: Wardens can view/manage fees in their assigned hostel
DROP POLICY IF EXISTS "Staff can manage fee charges" ON public.fee_charges;
CREATE POLICY "Staff can manage fee charges" ON public.fee_charges
  FOR ALL TO authenticated
  USING (public.is_hostel_authorized(hostel_id))
  WITH CHECK (public.is_hostel_authorized(hostel_id));

-- Payments table: Wardens can view and insert payments in their assigned hostel
DROP POLICY IF EXISTS "Staff can view payments" ON public.payments;
CREATE POLICY "Staff can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_hostel_authorized(hostel_id));

DROP POLICY IF EXISTS "Staff can insert payments" ON public.payments;
CREATE POLICY "Staff can insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_hostel_authorized(hostel_id) AND recorded_by = auth.uid()
  );

-- Complaints table: Wardens can manage complaints in their assigned hostel
DROP POLICY IF EXISTS "Staff can manage complaints for their hostels" ON public.complaints;
CREATE POLICY "Staff can manage complaints for their hostels" ON public.complaints
  FOR ALL TO authenticated
  USING (public.is_hostel_authorized(hostel_id))
  WITH CHECK (public.is_hostel_authorized(hostel_id));

-- Hostels table: Wardens can view assigned hostels
DROP POLICY IF EXISTS "Wardens can view assigned hostels" ON public.hostels;
CREATE POLICY "Wardens can view assigned hostels" ON public.hostels
  FOR SELECT TO authenticated
  USING (public.is_hostel_warden(id));
