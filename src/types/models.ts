import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Hostel = Database['public']['Tables']['hostels']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Bed = Database['public']['Tables']['beds']['Row']
export type Resident = Database['public']['Tables']['residents']['Row']
export type ResidentAssignment = Database['public']['Tables']['resident_assignments']['Row']
export type ResidentDocument = Database['public']['Tables']['resident_documents']['Row']
export type RegistrationRequest = Database['public']['Tables']['registration_requests']['Row']
export type RegistrationDocument = Database['public']['Tables']['registration_documents']['Row']
export type FeeCharge = Database['public']['Tables']['fee_charges']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Extended Domain Models for UI
export interface HostelWithStats extends Hostel {
  rooms_count?: number
  total_beds?: number
  occupied_beds?: number
  available_beds?: number
  active_residents_count?: number
  monthly_collection?: number
}

export interface BedWithResident extends Bed {
  current_assignment?: (ResidentAssignment & {
    resident?: Resident
  }) | null
}

export interface RoomWithBeds extends Room {
  beds: BedWithResident[]
  occupied_count: number
  available_count: number
}

export interface ResidentWithDetails extends Resident {
  hostel?: Hostel
  current_assignment?: (ResidentAssignment & {
    room?: Room
    bed?: Bed
  }) | null
  documents?: ResidentDocument[]
  fee_charges?: FeeCharge[]
  payments?: Payment[]
  current_month_balance?: number
  total_outstanding?: number
}

export interface FeeChargeWithDetails extends FeeCharge {
  resident?: Resident & {
    current_assignment?: (ResidentAssignment & {
      room?: Room
      bed?: Bed
    }) | null
  }
  hostel?: Hostel
  payments?: Payment[]
  remaining_amount: number
}

export interface PaymentWithDetails extends Payment {
  resident?: Resident
  hostel?: Hostel
  fee_charge?: FeeCharge
  room_number?: string
  bed_number?: string
}

export interface RegistrationRequestWithDocs extends RegistrationRequest {
  hostel?: Hostel
  documents: RegistrationDocument[]
}

export interface ReceiptData {
  receipt_number: string
  payment_date: string
  payment_method: string
  amount: number
  status: 'paid' | 'voided'
  notes?: string | null
  voided_at?: string | null
  void_reason?: string | null
  hostel: {
    name: string
    address: string
    phone?: string | null
    logo_path?: string | null
  }
  resident: {
    full_name: string
    resident_id: string
    cnic: string
    phone: string
  }
  room_number?: string
  bed_number?: string
  fee_month: string
  fee_total_due: number
  fee_total_paid: number
  fee_remaining_balance: number
}

export interface DashboardMetrics {
  total_residents: number
  total_hostels: number
  month_collection: number
  pending_overdue_amount: number
  total_beds: number
  occupied_beds: number
  available_beds: number
  occupancy_rate: number
  attention_items: {
    overdue_fees_count: number
    pending_registrations_count: number
    available_beds_count: number
  }
  recent_admissions: ResidentWithDetails[]
  recent_payments: PaymentWithDetails[]
  hostel_comparisons: {
    id: string
    name: string
    residents_count: number
    occupancy_rate: number
    collection_amount: number
    total_beds: number
    occupied_beds: number
  }[]
}
