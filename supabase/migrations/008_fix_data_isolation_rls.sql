-- ============================================================================
-- Migration 008: Multi-User Data Isolation & RLS Security Hardening
-- ============================================================================

-- 1. FIX HOSTELS TABLE RLS
-- Drop the insecure blanket public SELECT policy that was leaking hostels to all users
DROP POLICY IF EXISTS "Public can view active hostels for registration" ON public.hostels;

-- Ensure Owners can only manage (SELECT, INSERT, UPDATE, DELETE) their own hostels
DROP POLICY IF EXISTS "Owners can manage their hostels" ON public.hostels;
CREATE POLICY "Owners can manage their hostels" ON public.hostels
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Ensure Residents can only view the specific hostel they reside in
DROP POLICY IF EXISTS "Residents can view their hostel" ON public.hostels;
CREATE POLICY "Residents can view their hostel" ON public.hostels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.residents 
      WHERE residents.hostel_id = hostels.id AND residents.user_id = auth.uid()
    )
  );

-- 2. FIX REGISTRATION REQUESTS TABLE RLS
-- Drop the insecure blanket SELECT policy that was leaking applicant personal data
DROP POLICY IF EXISTS "Applicants can view their registration requests" ON public.registration_requests;

-- Ensure only the hostel owner can view and manage registration requests for their hostel
DROP POLICY IF EXISTS "Owners can manage registration requests for their hostels" ON public.registration_requests;
CREATE POLICY "Owners can manage registration requests for their hostels" ON public.registration_requests
  FOR ALL TO authenticated
  USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

-- Ensure anyone (authenticated or anon) can submit a pending registration request
DROP POLICY IF EXISTS "Anyone can submit a registration request" ON public.registration_requests;
CREATE POLICY "Anyone can submit a registration request" ON public.registration_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

-- 3. FIX REGISTRATION DOCUMENTS TABLE RLS
DROP POLICY IF EXISTS "Owners can view registration documents" ON public.registration_documents;
CREATE POLICY "Owners can view registration documents" ON public.registration_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registration_requests req
      JOIN public.hostels h ON req.hostel_id = h.id
      WHERE req.id = registration_documents.registration_request_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registration_requests req
      JOIN public.hostels h ON req.hostel_id = h.id
      WHERE req.id = registration_documents.registration_request_id AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can upload registration documents for pending request" ON public.registration_documents;
CREATE POLICY "Anyone can upload registration documents for pending request" ON public.registration_documents
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registration_requests
      WHERE registration_requests.id = registration_documents.registration_request_id AND registration_requests.status = 'pending'
    )
  );

-- 4. PUBLIC SECURE RPCS
-- Public Hostel Info RPC: Allows public applicant / QR registration to fetch safe hostel info without table-wide SELECT
CREATE OR REPLACE FUNCTION public.get_public_hostel_info(p_hostel_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hostel RECORD;
BEGIN
  SELECT id, name, address, phone, logo_path, status
  INTO v_hostel
  FROM public.hostels
  WHERE id = p_hostel_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_hostel.id,
    'name', v_hostel.name,
    'address', v_hostel.address,
    'phone', v_hostel.phone,
    'logo_path', v_hostel.logo_path,
    'status', v_hostel.status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_hostel_info(UUID) TO anon, authenticated, service_role;

-- Submit Registration Request RPC: Atomically creates registration request and associated documents
CREATE OR REPLACE FUNCTION public.submit_registration_request(
  p_hostel_id UUID,
  p_full_name TEXT,
  p_father_name TEXT,
  p_cnic TEXT,
  p_phone TEXT,
  p_permanent_address TEXT,
  p_emergency_contact_name TEXT,
  p_emergency_contact_phone TEXT,
  p_profile_photo_path TEXT DEFAULT NULL,
  p_cnic_front_path TEXT DEFAULT NULL,
  p_cnic_back_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hostel RECORD;
  v_req_id UUID;
BEGIN
  -- Verify the hostel exists and is active
  SELECT id, name INTO v_hostel
  FROM public.hostels
  WHERE id = p_hostel_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target hostel not found or inactive';
  END IF;

  -- Insert registration request
  INSERT INTO public.registration_requests (
    hostel_id,
    full_name,
    father_name,
    cnic,
    phone,
    permanent_address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo_path,
    status
  ) VALUES (
    p_hostel_id,
    trim(p_full_name),
    trim(p_father_name),
    replace(trim(p_cnic), '-', ''),
    trim(p_phone),
    trim(p_permanent_address),
    trim(p_emergency_contact_name),
    trim(p_emergency_contact_phone),
    p_profile_photo_path,
    'pending'
  ) RETURNING id INTO v_req_id;

  -- Attach CNIC front document if provided
  IF p_cnic_front_path IS NOT NULL AND p_cnic_front_path <> '' THEN
    INSERT INTO public.registration_documents (
      registration_request_id,
      document_type,
      storage_path,
      file_name,
      mime_type
    ) VALUES (
      v_req_id,
      'cnic_front',
      p_cnic_front_path,
      'cnic-front.jpg',
      'image/jpeg'
    );
  END IF;

  -- Attach CNIC back document if provided
  IF p_cnic_back_path IS NOT NULL AND p_cnic_back_path <> '' THEN
    INSERT INTO public.registration_documents (
      registration_request_id,
      document_type,
      storage_path,
      file_name,
      mime_type
    ) VALUES (
      v_req_id,
      'cnic_back',
      p_cnic_back_path,
      'cnic-back.jpg',
      'image/jpeg'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req_id,
    'hostel_id', p_hostel_id,
    'message', 'Registration application submitted successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_registration_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. HARDEN STORAGE RLS POLICIES
-- Replace generic "EXISTS (SELECT 1 FROM hostels WHERE owner_id = auth.uid())" with strict object ownership

-- A. Resident Documents
DROP POLICY IF EXISTS "Owners manage resident-documents" ON storage.objects;
CREATE POLICY "Owners manage resident-documents" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'resident-documents' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.resident_documents rd
        JOIN public.residents r ON rd.resident_id = r.id
        JOIN public.hostels h ON r.hostel_id = h.id
        WHERE rd.storage_path = storage.objects.name AND h.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.registration_documents reqd
        JOIN public.registration_requests req ON reqd.registration_request_id = req.id
        JOIN public.hostels h ON req.hostel_id = h.id
        WHERE reqd.storage_path = storage.objects.name AND h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'resident-documents' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Public can upload registration documents" ON storage.objects;
CREATE POLICY "Public can upload registration documents" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (bucket_id = 'resident-documents' OR bucket_id = 'resident-photos')
    AND (storage.foldername(name))[1] = 'requests'
  );

-- B. Resident Photos
DROP POLICY IF EXISTS "Owners manage resident-photos" ON storage.objects;
CREATE POLICY "Owners manage resident-photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'resident-photos' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.residents r
        JOIN public.hostels h ON r.hostel_id = h.id
        WHERE r.profile_photo_path = storage.objects.name AND h.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.registration_requests req
        JOIN public.hostels h ON req.hostel_id = h.id
        WHERE req.profile_photo_path = storage.objects.name AND h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'resident-photos' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  );

-- C. Hostel Assets (Logos & branding)
DROP POLICY IF EXISTS "Owners manage hostel-assets" ON storage.objects;
CREATE POLICY "Owners manage hostel-assets" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'hostel-assets' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.logo_path = storage.objects.name AND h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'hostel-assets' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  );

-- D. Receipts
DROP POLICY IF EXISTS "Owners manage receipts" ON storage.objects;
CREATE POLICY "Owners manage receipts" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.payments p
        JOIN public.hostels h ON p.hostel_id = h.id
        WHERE storage.objects.name LIKE '%' || p.receipt_number || '%' AND h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'receipts' AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  );
