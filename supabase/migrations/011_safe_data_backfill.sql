-- ============================================================================
-- Migration 011: Safe Data Migration & Historical Backfill for Multi-Hostel
-- ============================================================================

DO $$
DECLARE
  v_owner RECORD;
  v_default_hostel_id UUID;
BEGIN
  -- For each owner account, ensure they have at least one active default hostel
  FOR v_owner IN SELECT id, full_name FROM public.profiles WHERE role = 'owner'
  LOOP
    -- Check if owner has a hostel
    SELECT id INTO v_default_hostel_id
    FROM public.hostels
    WHERE owner_id = v_owner.id
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no hostel exists, create default hostel
    IF v_default_hostel_id IS NULL THEN
      INSERT INTO public.hostels (
        owner_id,
        name,
        address,
        phone,
        status
      ) VALUES (
        v_owner.id,
        COALESCE(v_owner.full_name || ' Hostel', 'Main Campus Hostel'),
        'Main Hostel Premises',
        NULL,
        'active'
      ) RETURNING id INTO v_default_hostel_id;
    END IF;

    -- Link any orphaned rooms to default hostel
    UPDATE public.rooms
    SET hostel_id = v_default_hostel_id
    WHERE hostel_id IS NULL;

    -- Link any orphaned residents to default hostel
    UPDATE public.residents
    SET hostel_id = v_default_hostel_id
    WHERE hostel_id IS NULL;

    -- Link any orphaned fee charges to the resident's hostel
    UPDATE public.fee_charges fc
    SET hostel_id = r.hostel_id
    FROM public.residents r
    WHERE fc.resident_id = r.id AND (fc.hostel_id IS NULL OR fc.hostel_id <> r.hostel_id);

    -- Link any orphaned payments to the resident's hostel
    UPDATE public.payments p
    SET hostel_id = r.hostel_id
    FROM public.residents r
    WHERE p.resident_id = r.id AND (p.hostel_id IS NULL OR p.hostel_id <> r.hostel_id);

    -- Link any orphaned complaints to the resident's hostel
    UPDATE public.complaints c
    SET hostel_id = r.hostel_id
    FROM public.residents r
    WHERE c.resident_id = r.id AND (c.hostel_id IS NULL OR c.hostel_id <> r.hostel_id);
  END LOOP;
END;
$$;
