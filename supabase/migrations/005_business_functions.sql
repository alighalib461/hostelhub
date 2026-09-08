-- ============================================================================
-- Migration 005: Business RPC Functions for HostelHub
-- ============================================================================

-- 1. RECORD PAYMENT
CREATE OR REPLACE FUNCTION public.record_payment(
  p_fee_charge_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_notes TEXT DEFAULT NULL,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  v_fee RECORD;
  v_hostel RECORD;
  v_remaining NUMERIC;
  v_new_amount_paid NUMERIC;
  v_new_status TEXT;
  v_payment_id UUID;
  v_receipt_no TEXT;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record payments';
  END IF;

  -- Validate payment amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('cash', 'bank_transfer', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  -- Lock and fetch fee charge
  SELECT * INTO v_fee 
  FROM public.fee_charges 
  WHERE id = p_fee_charge_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee charge record not found';
  END IF;

  -- Verify caller owns the hostel
  SELECT * INTO v_hostel 
  FROM public.hostels 
  WHERE id = v_fee.hostel_id AND owner_id = v_caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: You do not have ownership of this hostel';
  END IF;

  -- Calculate remaining balance
  v_remaining := v_fee.amount_due - v_fee.amount_paid;

  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Fee charge is already fully paid';
  END IF;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment amount (Rs %) exceeds remaining balance (Rs %)', p_amount, v_remaining;
  END IF;

  -- Compute new amounts and fee status
  v_new_amount_paid := v_fee.amount_paid + p_amount;
  IF v_new_amount_paid >= v_fee.amount_due THEN
    v_new_status := 'paid';
  ELSIF v_new_amount_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Generate receipt number
  v_receipt_no := generate_receipt_number();

  -- Insert payment record
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
    p_amount,
    COALESCE(p_payment_date, CURRENT_DATE),
    p_payment_method,
    'paid',
    v_receipt_no,
    p_notes,
    v_caller_id
  ) RETURNING id INTO v_payment_id;

  -- Update fee charge
  UPDATE public.fee_charges 
  SET 
    amount_paid = v_new_amount_paid,
    status = v_new_status,
    updated_at = now()
  WHERE id = v_fee.id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_no,
    'fee_charge_id', v_fee.id,
    'amount_paid_total', v_new_amount_paid,
    'remaining_amount', v_fee.amount_due - v_new_amount_paid,
    'fee_status', v_new_status
  );
END;
\$\$;

-- 2. ASSIGN BED
CREATE OR REPLACE FUNCTION public.assign_bed(
  p_resident_id UUID,
  p_bed_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  v_caller_id UUID;
  v_resident RECORD;
  v_bed RECORD;
  v_prev_assignment RECORD;
  v_assignment_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to assign beds';
  END IF;

  -- Lock and fetch resident
  SELECT * INTO v_resident 
  FROM public.residents 
  WHERE id = p_resident_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resident record not found';
  END IF;

  -- Verify owner owns the resident's hostel
  IF NOT EXISTS (
    SELECT 1 FROM public.hostels 
    WHERE id = v_resident.hostel_id AND owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this hostel';
  END IF;

  -- Lock and fetch bed and its room
  SELECT b.*, r.hostel_id, r.room_number, r.capacity 
  INTO v_bed
  FROM public.beds b
  JOIN public.rooms r ON b.room_id = r.id
  WHERE b.id = p_bed_id
  FOR UPDATE OF b;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bed record not found';
  END IF;

  IF v_bed.hostel_id <> v_resident.hostel_id THEN
    RAISE EXCEPTION 'Bed does not belong to the same hostel as the resident';
  END IF;

  -- Check if bed is already occupied by someone else
  IF EXISTS (
    SELECT 1 FROM public.resident_assignments 
    WHERE bed_id = p_bed_id AND is_current = true AND resident_id <> p_resident_id
  ) THEN
    RAISE EXCEPTION 'Bed is already occupied by another resident';
  END IF;

  -- Close existing current assignment for this resident if exists
  SELECT * INTO v_prev_assignment 
  FROM public.resident_assignments 
  WHERE resident_id = p_resident_id AND is_current = true;

  IF FOUND THEN
    UPDATE public.resident_assignments 
    SET is_current = false, end_date = p_start_date 
    WHERE id = v_prev_assignment.id;

    UPDATE public.beds 
    SET status = 'available', updated_at = now() 
    WHERE id = v_prev_assignment.bed_id;
  END IF;

  -- Create new current assignment
  INSERT INTO public.resident_assignments (
    resident_id,
    hostel_id,
    room_id,
    bed_id,
    start_date,
    is_current
  ) VALUES (
    p_resident_id,
    v_resident.hostel_id,
    v_bed.room_id,
    p_bed_id,
    p_start_date,
    true
  ) RETURNING id INTO v_assignment_id;

  -- Mark new bed as occupied
  UPDATE public.beds 
  SET status = 'occupied', updated_at = now() 
  WHERE id = p_bed_id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'resident_id', p_resident_id,
    'bed_id', p_bed_id,
    'start_date', p_start_date
  );
END;
\$\$;

-- 3. APPROVE REGISTRATION
CREATE OR REPLACE FUNCTION public.approve_registration(
  p_request_id UUID,
  p_bed_id UUID,
  p_monthly_fee NUMERIC,
  p_security_deposit NUMERIC DEFAULT 0,
  p_fee_due_day INT DEFAULT 5,
  p_admission_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  v_caller_id UUID;
  v_req RECORD;
  v_bed RECORD;
  v_resident_id UUID;
  v_resident_code TEXT;
  v_assignment_id UUID;
  v_fee_month VARCHAR(7);
  v_due_date DATE;
  v_fee_id UUID;
  v_start_date DATE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to approve registration';
  END IF;

  v_start_date := COALESCE(p_admission_date, CURRENT_DATE);

  -- Lock and fetch registration request
  SELECT * INTO v_req 
  FROM public.registration_requests 
  WHERE id = p_request_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Registration request has already been processed (status: %)', v_req.status;
  END IF;

  -- Verify caller owns the hostel
  IF NOT EXISTS (
    SELECT 1 FROM public.hostels 
    WHERE id = v_req.hostel_id AND owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this hostel';
  END IF;

  -- Validate Bed
  SELECT b.*, r.hostel_id 
  INTO v_bed
  FROM public.beds b
  JOIN public.rooms r ON b.room_id = r.id
  WHERE b.id = p_bed_id
  FOR UPDATE OF b;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected bed not found';
  END IF;

  IF v_bed.hostel_id <> v_req.hostel_id THEN
    RAISE EXCEPTION 'Bed does not belong to the requested hostel';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.resident_assignments 
    WHERE bed_id = p_bed_id AND is_current = true
  ) THEN
    RAISE EXCEPTION 'Bed is already occupied';
  END IF;

  -- Generate Resident Code
  v_resident_code := generate_resident_id();

  -- Create Resident
  INSERT INTO public.residents (
    resident_id,
    hostel_id,
    full_name,
    father_name,
    cnic,
    phone,
    permanent_address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo_path,
    admission_date,
    monthly_fee,
    security_deposit,
    fee_due_day,
    status
  ) VALUES (
    v_resident_code,
    v_req.hostel_id,
    v_req.full_name,
    v_req.father_name,
    v_req.cnic,
    v_req.phone,
    v_req.permanent_address,
    v_req.emergency_contact_name,
    v_req.emergency_contact_phone,
    v_req.profile_photo_path,
    v_start_date,
    p_monthly_fee,
    COALESCE(p_security_deposit, 0),
    COALESCE(p_fee_due_day, 5),
    'active'
  ) RETURNING id INTO v_resident_id;

  -- Copy registration documents to resident documents
  INSERT INTO public.resident_documents (
    resident_id,
    document_type,
    storage_path,
    file_name,
    mime_type
  )
  SELECT 
    v_resident_id,
    document_type,
    storage_path,
    file_name,
    mime_type
  FROM public.registration_documents 
  WHERE registration_request_id = p_request_id;

  -- Create Bed Assignment
  INSERT INTO public.resident_assignments (
    resident_id,
    hostel_id,
    room_id,
    bed_id,
    start_date,
    is_current
  ) VALUES (
    v_resident_id,
    v_req.hostel_id,
    v_bed.room_id,
    p_bed_id,
    v_start_date,
    true
  ) RETURNING id INTO v_assignment_id;

  -- Mark Bed Occupied
  UPDATE public.beds 
  SET status = 'occupied', updated_at = now() 
  WHERE id = p_bed_id;

  -- Calculate Initial Fee Charge
  v_fee_month := TO_CHAR(v_start_date, 'YYYY-MM');
  -- Due date calculation based on fee_due_day
  v_due_date := (DATE_TRUNC('month', v_start_date) + ((LEAST(p_fee_due_day, 28) - 1) || ' days')::INTERVAL)::DATE;
  IF v_due_date < v_start_date THEN
    v_due_date := v_start_date;
  END IF;

  -- Insert initial fee charge
  INSERT INTO public.fee_charges (
    resident_id,
    hostel_id,
    fee_month,
    amount_due,
    due_date,
    amount_paid,
    status
  ) VALUES (
    v_resident_id,
    v_req.hostel_id,
    v_fee_month,
    p_monthly_fee,
    v_due_date,
    0.00,
    'pending'
  ) ON CONFLICT (resident_id, fee_month) DO NOTHING
  RETURNING id INTO v_fee_id;

  -- Update Registration Request status
  UPDATE public.registration_requests 
  SET 
    status = 'approved',
    reviewed_by = v_caller_id,
    reviewed_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'resident_id', v_resident_id,
    'resident_code', v_resident_code,
    'assignment_id', v_assignment_id,
    'fee_charge_id', v_fee_id
  );
END;
\$\$;

-- 4. VOID PAYMENT
CREATE OR REPLACE FUNCTION public.void_payment(
  p_payment_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  v_caller_id UUID;
  v_payment RECORD;
  v_fee RECORD;
  v_new_amount_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to void payment';
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'A reason must be provided to void a payment';
  END IF;

  -- Lock and fetch payment
  SELECT * INTO v_payment 
  FROM public.payments 
  WHERE id = p_payment_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found';
  END IF;

  IF v_payment.status = 'voided' THEN
    RAISE EXCEPTION 'Payment % has already been voided', v_payment.receipt_number;
  END IF;

  -- Verify owner owns the hostel
  IF NOT EXISTS (
    SELECT 1 FROM public.hostels 
    WHERE id = v_payment.hostel_id AND owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this hostel';
  END IF;

  -- Lock and fetch fee charge
  SELECT * INTO v_fee 
  FROM public.fee_charges 
  WHERE id = v_payment.fee_charge_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated fee charge not found';
  END IF;

  -- Recalculate amount paid
  v_new_amount_paid := GREATEST(0, v_fee.amount_paid - v_payment.amount);
  
  -- Recalculate fee status
  IF v_new_amount_paid >= v_fee.amount_due THEN
    v_new_status := 'paid';
  ELSIF v_new_amount_paid > 0 THEN
    v_new_status := 'partial';
  ELSIF v_fee.due_date < CURRENT_DATE THEN
    v_new_status := 'overdue';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Mark payment as voided
  UPDATE public.payments 
  SET 
    status = 'voided',
    voided_at = now(),
    voided_by = v_caller_id,
    void_reason = p_reason,
    updated_at = now()
  WHERE id = p_payment_id;

  -- Update fee charge
  UPDATE public.fee_charges 
  SET 
    amount_paid = v_new_amount_paid,
    status = v_new_status,
    updated_at = now()
  WHERE id = v_fee.id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'receipt_number', v_payment.receipt_number,
    'fee_charge_id', v_fee.id,
    'amount_paid_total', v_new_amount_paid,
    'remaining_amount', v_fee.amount_due - v_new_amount_paid,
    'fee_status', v_new_status
  );
END;
$$;

-- 5. LINK RESIDENT ACCOUNT
CREATE OR REPLACE FUNCTION public.link_resident_account(
  p_identifier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_clean_id TEXT;
  v_resident RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to link resident account';
  END IF;

  v_clean_id := TRIM(p_identifier);
  IF v_clean_id = '' THEN
    RAISE EXCEPTION 'Resident identifier (Resident ID, CNIC, or Phone) is required';
  END IF;

  -- Search resident record by resident_id, cnic, or phone
  SELECT id, resident_id, full_name, hostel_id, user_id
  INTO v_resident
  FROM public.residents
  WHERE resident_id ILIKE v_clean_id
     OR cnic = v_clean_id
     OR phone = v_clean_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hostel resident record found matching identifier "%"', v_clean_id;
  END IF;

  IF v_resident.user_id IS NOT NULL AND v_resident.user_id <> v_caller_id THEN
    RAISE EXCEPTION 'This resident record is already linked with another account';
  END IF;

  -- Link caller's user_id to the resident record
  UPDATE public.residents
  SET user_id = v_caller_id, updated_at = now()
  WHERE id = v_resident.id;

  RETURN jsonb_build_object(
    'success', true,
    'resident_id', v_resident.id,
    'resident_code', v_resident.resident_id,
    'full_name', v_resident.full_name,
    'hostel_id', v_resident.hostel_id
  );
END;
$$;

