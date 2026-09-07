-- ============================================================================
-- Migration 004: Storage Buckets & Storage RLS Policies for HostelHub
-- ============================================================================

-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resident-documents', 'resident-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('resident-photos', 'resident-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('hostel-assets', 'hostel-assets', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('receipts', 'receipts', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- 1. RESIDENT DOCUMENTS (Private: Only Hostel Owner and Resident can access)
DROP POLICY IF EXISTS "Owners manage resident-documents" ON storage.objects;
CREATE POLICY "Owners manage resident-documents" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'resident-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'resident-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h
        WHERE h.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Residents view own resident-documents" ON storage.objects;
CREATE POLICY "Residents view own resident-documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resident-documents' AND (
      EXISTS (
        SELECT 1 FROM public.residents r
        JOIN public.resident_documents rd ON rd.resident_id = r.id
        WHERE r.user_id = auth.uid() AND rd.storage_path = name
      )
      OR EXISTS (
        SELECT 1 FROM public.residents r
        WHERE r.user_id = auth.uid() AND (storage.foldername(name))[2] = r.id::text
      )
    )
  );

-- 2. RESIDENT PHOTOS
DROP POLICY IF EXISTS "Owners manage resident-photos" ON storage.objects;
CREATE POLICY "Owners manage resident-photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'resident-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'resident-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Residents view own resident-photos" ON storage.objects;
CREATE POLICY "Residents view own resident-photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resident-photos' AND (
      EXISTS (
        SELECT 1 FROM public.residents r
        WHERE r.user_id = auth.uid() AND (storage.foldername(name))[2] = r.id::text
      )
      OR EXISTS (
        SELECT 1 FROM public.residents r
        WHERE r.user_id = auth.uid() AND r.profile_photo_path = name
      )
    )
  );

-- 3. HOSTEL ASSETS (Logos, hostel pictures)
DROP POLICY IF EXISTS "Owners manage hostel-assets" ON storage.objects;
CREATE POLICY "Owners manage hostel-assets" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'hostel-assets' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'hostel-assets' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users view hostel-assets" ON storage.objects;
CREATE POLICY "Authenticated users view hostel-assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'hostel-assets');

-- 4. RECEIPTS
DROP POLICY IF EXISTS "Owners manage receipts" ON storage.objects;
CREATE POLICY "Owners manage receipts" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'receipts' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.hostels h WHERE h.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Residents view own receipts" ON storage.objects;
CREATE POLICY "Residents view own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      EXISTS (
        SELECT 1 FROM public.payments p
        JOIN public.residents r ON p.resident_id = r.id
        WHERE r.user_id = auth.uid() AND (
          name LIKE '%' || p.receipt_number || '%'
        )
      )
    )
  );
