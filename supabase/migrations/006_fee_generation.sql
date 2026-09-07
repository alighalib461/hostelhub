-- ============================================================================
-- Migration 006: Monthly Fee Generation Automation Foundation
-- ============================================================================

-- Helper function to calculate due date for a given billing month and due day
CREATE OR REPLACE FUNCTION public.calculate_fee_due_date(
  p_fee_month VARCHAR,
  p_due_day INT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_first_day DATE;
  v_days_in_month INT;
  v_clamped_day INT;
BEGIN
  v_first_day := TO_DATE(p_fee_month || '-01', 'YYYY-MM-DD');
  -- Determine last day of the month
  v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_first_day) + INTERVAL '1 month - 1 day'));
  v_clamped_day := LEAST(GREATEST(p_due_day, 1), v_days_in_month);
  
  RETURN (DATE_TRUNC('month', v_first_day) + ((v_clamped_day - 1) || ' days')::INTERVAL)::DATE;
END;
$$;

-- Monthly fee generation function for a hostel or all owner's hostels
CREATE OR REPLACE FUNCTION public.generate_monthly_fees(
  p_hostel_id UUID,
  p_fee_month VARCHAR(7) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_resident RECORD;
  v_created_count INT := 0;
  v_skipped_count INT := 0;
  v_total_billed NUMERIC(12,2) := 0.00;
  v_due_date DATE;
  v_fee_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to generate monthly fees';
  END IF;

  -- Validate fee_month format (YYYY-MM)
  IF p_fee_month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Invalid fee month format: %. Expected YYYY-MM', p_fee_month;
  END IF;

  -- Verify hostel ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.hostels 
    WHERE id = p_hostel_id AND owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not own hostel %', p_hostel_id;
  END IF;

  -- Loop through all active residents in this hostel
  FOR v_resident IN 
    SELECT r.id, r.hostel_id, r.monthly_fee, r.fee_due_day, r.admission_date, r.full_name
    FROM public.residents r
    WHERE r.hostel_id = p_hostel_id
      AND r.status = 'active'
      AND r.admission_date <= (TO_DATE(p_fee_month || '-01', 'YYYY-MM-DD') + INTERVAL '1 month - 1 day')::DATE
  LOOP
    -- Check if fee already exists for this resident and month
    IF EXISTS (
      SELECT 1 FROM public.fee_charges 
      WHERE resident_id = v_resident.id AND fee_month = p_fee_month
    ) THEN
      v_skipped_count := v_skipped_count + 1;
    ELSE
      v_due_date := calculate_fee_due_date(p_fee_month, v_resident.fee_due_day);

      INSERT INTO public.fee_charges (
        resident_id,
        hostel_id,
        fee_month,
        amount_due,
        due_date,
        amount_paid,
        status
      ) VALUES (
        v_resident.id,
        v_resident.hostel_id,
        p_fee_month,
        v_resident.monthly_fee,
        v_due_date,
        0.00,
        CASE WHEN v_due_date < CURRENT_DATE THEN 'overdue' ELSE 'pending' END
      )
      ON CONFLICT (resident_id, fee_month) DO NOTHING
      RETURNING id INTO v_fee_id;

      IF v_fee_id IS NOT NULL THEN
        v_created_count := v_created_count + 1;
        v_total_billed := v_total_billed + v_resident.monthly_fee;
      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'hostel_id', p_hostel_id,
    'fee_month', p_fee_month,
    'charges_created', v_created_count,
    'charges_skipped', v_skipped_count,
    'total_amount_billed', v_total_billed
  );
END;
$$;
