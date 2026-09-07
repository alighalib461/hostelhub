-- ============================================================================
-- Migration 003: Row Level Security (RLS) Policies for HostelHub
-- ============================================================================

-- Helper functions for RLS performance and clean policy definitions

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_hostel_owner(p_hostel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hostels 
    WHERE id = p_hostel_id AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_resident_user(p_resident_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.residents 
    WHERE id = p_resident_id AND user_id = auth.uid()
  );
$$;

-- Enable RLS on all 11 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR EXISTS (
      -- Owners can view profiles of residents in their hostels
      SELECT 1 FROM public.residents r
      JOIN public.hostels h ON r.hostel_id = h.id
      WHERE r.user_id = profiles.id AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================================
-- 2. HOSTELS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage their hostels" ON public.hostels;
CREATE POLICY "Owners can manage their hostels" ON public.hostels
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Residents can view their hostel" ON public.hostels;
CREATE POLICY "Residents can view their hostel" ON public.hostels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.residents 
      WHERE hostel_id = hostels.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view active hostels for registration" ON public.hostels;
CREATE POLICY "Public can view active hostels for registration" ON public.hostels
  FOR SELECT USING (status = 'active');

-- ============================================================================
-- 3. ROOMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage rooms in their hostels" ON public.rooms;
CREATE POLICY "Owners can manage rooms in their hostels" ON public.rooms
  FOR ALL USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Residents can view rooms in their hostel" ON public.rooms;
CREATE POLICY "Residents can view rooms in their hostel" ON public.rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.residents 
      WHERE hostel_id = rooms.hostel_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. BEDS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage beds in their hostels" ON public.beds;
CREATE POLICY "Owners can manage beds in their hostels" ON public.beds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      JOIN public.hostels h ON r.hostel_id = h.id
      WHERE r.id = beds.room_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      JOIN public.hostels h ON r.hostel_id = h.id
      WHERE r.id = beds.room_id AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Residents can view beds in their hostel" ON public.beds;
CREATE POLICY "Residents can view beds in their hostel" ON public.beds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      JOIN public.residents res ON r.hostel_id = res.hostel_id
      WHERE r.id = beds.room_id AND res.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. RESIDENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage residents in their hostels" ON public.residents;
CREATE POLICY "Owners can manage residents in their hostels" ON public.residents
  FOR ALL USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Residents can view own record" ON public.residents;
CREATE POLICY "Residents can view own record" ON public.residents
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Residents can update own record" ON public.residents;
CREATE POLICY "Residents can update own record" ON public.residents
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. RESIDENT ASSIGNMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage assignments in their hostels" ON public.resident_assignments;
CREATE POLICY "Owners can manage assignments in their hostels" ON public.resident_assignments
  FOR ALL USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Residents can view own assignments" ON public.resident_assignments;
CREATE POLICY "Residents can view own assignments" ON public.resident_assignments
  FOR SELECT USING (public.is_resident_user(resident_id));

-- ============================================================================
-- 7. RESIDENT DOCUMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage resident documents" ON public.resident_documents;
CREATE POLICY "Owners can manage resident documents" ON public.resident_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.residents r
      JOIN public.hostels h ON r.hostel_id = h.id
      WHERE r.id = resident_documents.resident_id AND h.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.residents r
      JOIN public.hostels h ON r.hostel_id = h.id
      WHERE r.id = resident_documents.resident_id AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Residents can view and upload own documents" ON public.resident_documents;
CREATE POLICY "Residents can view and upload own documents" ON public.resident_documents
  FOR SELECT USING (public.is_resident_user(resident_id));

CREATE POLICY "Residents can insert own documents" ON public.resident_documents
  FOR INSERT WITH CHECK (public.is_resident_user(resident_id));

-- ============================================================================
-- 8. REGISTRATION REQUESTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage registration requests for their hostels" ON public.registration_requests;
CREATE POLICY "Owners can manage registration requests for their hostels" ON public.registration_requests
  FOR ALL USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Anyone can submit a registration request" ON public.registration_requests;
CREATE POLICY "Anyone can submit a registration request" ON public.registration_requests
  FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Applicants can view their registration requests" ON public.registration_requests;
CREATE POLICY "Applicants can view their registration requests" ON public.registration_requests
  FOR SELECT USING (true);

-- ============================================================================
-- 9. REGISTRATION DOCUMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can view registration documents" ON public.registration_documents;
CREATE POLICY "Owners can view registration documents" ON public.registration_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.registration_requests req
      JOIN public.hostels h ON req.hostel_id = h.id
      WHERE req.id = registration_documents.registration_request_id AND h.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can upload registration documents for pending request" ON public.registration_documents;
CREATE POLICY "Anyone can upload registration documents for pending request" ON public.registration_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registration_requests
      WHERE id = registration_documents.registration_request_id AND status = 'pending'
    )
  );

-- ============================================================================
-- 10. FEE CHARGES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can manage fee charges" ON public.fee_charges;
CREATE POLICY "Owners can manage fee charges" ON public.fee_charges
  FOR ALL USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Residents can view own fee charges" ON public.fee_charges;
CREATE POLICY "Residents can view own fee charges" ON public.fee_charges
  FOR SELECT USING (public.is_resident_user(resident_id));

-- ============================================================================
-- 11. PAYMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Owners can view and insert payments" ON public.payments;
CREATE POLICY "Owners can view payments" ON public.payments
  FOR SELECT USING (public.is_hostel_owner(hostel_id));

CREATE POLICY "Owners can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.is_hostel_owner(hostel_id) AND recorded_by = auth.uid()
  );

CREATE POLICY "Owners can update payments for voiding" ON public.payments
  FOR UPDATE USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

DROP POLICY IF EXISTS "Residents can view own payments" ON public.payments;
CREATE POLICY "Residents can view own payments" ON public.payments
  FOR SELECT USING (public.is_resident_user(resident_id));

-- Prevent hard deletion of payments to maintain financial audit integrity
-- (No DELETE policy created for payments, disallowing DELETE for all roles)
