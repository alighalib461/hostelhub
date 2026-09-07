-- ============================================================================
-- Migration 002: Constraints & Indexes for HostelHub
-- ============================================================================

-- Unique constraint on rooms: Unique room number per hostel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_room_number_per_hostel'
  ) THEN
    ALTER TABLE public.rooms ADD CONSTRAINT unique_room_number_per_hostel UNIQUE (hostel_id, room_number);
  END IF;
END $$;

-- Unique constraint on beds: Unique bed number per room
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_bed_number_per_room'
  ) THEN
    ALTER TABLE public.beds ADD CONSTRAINT unique_bed_number_per_room UNIQUE (room_id, bed_number);
  END IF;
END $$;

-- Unique constraint on fee charges: Unique resident + fee month
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_resident_fee_month'
  ) THEN
    ALTER TABLE public.fee_charges ADD CONSTRAINT unique_resident_fee_month UNIQUE (resident_id, fee_month);
  END IF;
END $$;

-- Partial unique indexes for Resident Assignments to ensure business integrity:
-- 1. Prevent more than one current assignment for the same resident
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_current_resident_assignment 
  ON public.resident_assignments (resident_id) 
  WHERE is_current = true;

-- 2. Prevent more than one current resident assignment for the same bed
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_current_bed_assignment 
  ON public.resident_assignments (bed_id) 
  WHERE is_current = true;

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Hostels
CREATE INDEX IF NOT EXISTS idx_hostels_owner_id ON public.hostels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hostels_status ON public.hostels(status);

-- Rooms
CREATE INDEX IF NOT EXISTS idx_rooms_hostel_id ON public.rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- Beds
CREATE INDEX IF NOT EXISTS idx_beds_room_id ON public.beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);

-- Residents
CREATE INDEX IF NOT EXISTS idx_residents_hostel_id ON public.residents(hostel_id);
CREATE INDEX IF NOT EXISTS idx_residents_cnic ON public.residents(cnic);
CREATE INDEX IF NOT EXISTS idx_residents_phone ON public.residents(phone);
CREATE INDEX IF NOT EXISTS idx_residents_resident_id ON public.residents(resident_id);
CREATE INDEX IF NOT EXISTS idx_residents_status ON public.residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_user_id ON public.residents(user_id);

-- Resident Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_resident_id ON public.resident_assignments(resident_id);
CREATE INDEX IF NOT EXISTS idx_assignments_hostel_id ON public.resident_assignments(hostel_id);
CREATE INDEX IF NOT EXISTS idx_assignments_room_id ON public.resident_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_assignments_bed_id ON public.resident_assignments(bed_id);
CREATE INDEX IF NOT EXISTS idx_assignments_is_current ON public.resident_assignments(is_current);

-- Resident Documents
CREATE INDEX IF NOT EXISTS idx_resident_documents_resident_id ON public.resident_documents(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_documents_type ON public.resident_documents(document_type);

-- Registration Requests
CREATE INDEX IF NOT EXISTS idx_registration_requests_hostel_id ON public.registration_requests(hostel_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_cnic ON public.registration_requests(cnic);
CREATE INDEX IF NOT EXISTS idx_registration_requests_phone ON public.registration_requests(phone);

-- Registration Documents
CREATE INDEX IF NOT EXISTS idx_registration_documents_request_id ON public.registration_documents(registration_request_id);

-- Fee Charges
CREATE INDEX IF NOT EXISTS idx_fee_charges_resident_id ON public.fee_charges(resident_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_hostel_id ON public.fee_charges(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_fee_month ON public.fee_charges(fee_month);
CREATE INDEX IF NOT EXISTS idx_fee_charges_status ON public.fee_charges(status);
CREATE INDEX IF NOT EXISTS idx_fee_charges_due_date ON public.fee_charges(due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_resident_id ON public.payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_payments_hostel_id ON public.payments(hostel_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_charge_id ON public.payments(fee_charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON public.payments(recorded_by);
