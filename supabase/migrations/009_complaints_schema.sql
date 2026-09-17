-- ============================================================================
-- Migration 009: Complaint & Maintenance System for HostelHub
-- ============================================================================

-- 1. Create sequence for human-readable complaint code (CMP-000001)
CREATE SEQUENCE IF NOT EXISTS complaint_id_seq START WITH 1 INCREMENT BY 1;

-- Helper function to generate safe complaint code
CREATE OR REPLACE FUNCTION generate_complaint_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'CMP-' || LPAD(nextval('complaint_id_seq')::TEXT, 6, '0');
END;
$$;

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_code TEXT NOT NULL UNIQUE DEFAULT generate_complaint_id(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_id UUID NULL REFERENCES public.rooms(id) ON DELETE SET NULL,
  bed_id UUID NULL REFERENCES public.beds(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'Electrical',
      'Plumbing',
      'Room / Furniture',
      'Cleaning',
      'Internet / Wi-Fi',
      'Mess / Food',
      'Security',
      'Other'
    )
  ),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_progress', 'resolved')),
  photo_path TEXT NULL,
  resolution_note TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast query filtering
CREATE INDEX IF NOT EXISTS idx_complaints_hostel_id ON public.complaints(hostel_id);
CREATE INDEX IF NOT EXISTS idx_complaints_resident_id ON public.complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);

-- 4. Trigger for updated_at
CREATE OR REPLACE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Owner RLS Policy: Owners can manage complaints for hostels they own
DROP POLICY IF EXISTS "Owners can manage complaints for their hostels" ON public.complaints;
CREATE POLICY "Owners can manage complaints for their hostels" ON public.complaints
  FOR ALL TO authenticated
  USING (public.is_hostel_owner(hostel_id))
  WITH CHECK (public.is_hostel_owner(hostel_id));

-- Resident SELECT Policy: Residents can view only their own complaints
DROP POLICY IF EXISTS "Residents can view own complaints" ON public.complaints;
CREATE POLICY "Residents can view own complaints" ON public.complaints
  FOR SELECT TO authenticated
  USING (public.is_resident_user(resident_id));

-- Resident INSERT Policy: Residents can create complaints for themselves
DROP POLICY IF EXISTS "Residents can insert own complaints" ON public.complaints;
CREATE POLICY "Residents can insert own complaints" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_resident_user(resident_id)
    AND status = 'submitted'
  );
