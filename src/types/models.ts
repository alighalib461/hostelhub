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
export type Complaint = Database['public']['Tables']['complaints']['Row']
export type WardenAssignment = Database['public']['Tables']['warden_assignments']['Row']
export type WardenInvitation = Database['public']['Tables']['warden_invitations']['Row']
export type PaymentAccount = Database['public']['Tables']['payment_accounts']['Row']
export type OnlinePaymentSubmission = Database['public']['Tables']['online_payment_submissions']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementHostel = Database['public']['Tables']['announcement_hostels']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export type UserRole = 'owner' | 'warden' | 'resident'

export interface WardenPermissions {
  can_view_residents: boolean
  can_add_residents: boolean
  can_edit_residents: boolean
  can_manage_rooms: boolean
  can_manage_beds: boolean
  can_record_payments: boolean
  can_verify_online_payments: boolean
  can_view_fees: boolean
  can_manage_complaints: boolean
  can_manage_menu: boolean
  can_create_announcements: boolean
  can_view_expenses: boolean
  can_manage_expenses: boolean
  can_view_reports: boolean
  can_check_in_out: boolean
}

export const DEFAULT_WARDEN_PERMISSIONS: WardenPermissions = {
  can_view_residents: true,
  can_add_residents: true,
  can_edit_residents: true,
  can_manage_rooms: true,
  can_manage_beds: true,
  can_record_payments: true,
  can_verify_online_payments: true,
  can_view_fees: true,
  can_manage_complaints: true,
  can_manage_menu: true,
  can_create_announcements: true,
  can_view_expenses: true,
  can_manage_expenses: false,
  can_view_reports: true,
  can_check_in_out: true,
}

export interface WardenWithDetails extends WardenAssignment {
  profile?: Profile
  hostel?: Hostel
}

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Room / Furniture'
  | 'Cleaning'
  | 'Internet / Wi-Fi'
  | 'Mess / Food'
  | 'Security'
  | 'Other'

export type ComplaintPriority = 'normal' | 'urgent'
export type ComplaintStatus = 'submitted' | 'in_progress' | 'resolved'

export interface ComplaintWithDetails extends Complaint {
  resident?: Resident
  hostel?: Hostel
  room?: Room | null
  bed?: Bed | null
  resolver?: Profile | null
}

export interface CreateComplaintPayload {
  resident_id: string
  hostel_id: string
  room_id?: string | null
  bed_id?: string | null
  category: ComplaintCategory
  subject: string
  description: string
  priority?: ComplaintPriority
  photo_path?: string | null
}

// Extended Domain Models for UI
export interface HostelWithStats extends Hostel {
  rooms_count?: number
  total_beds?: number
  occupied_beds?: number
  available_beds?: number
  active_residents_count?: number
  monthly_collection?: number
  wardens_count?: number
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

export interface OnlinePaymentSubmissionWithDetails extends OnlinePaymentSubmission {
  resident?: Resident
  hostel?: Hostel
  fee_charge?: FeeCharge
  payment_account?: PaymentAccount | null
  reviewer?: Profile | null
}

export interface AnnouncementWithDetails extends Announcement {
  hostel?: Hostel | null
  creator?: Profile
  target_hostels?: Hostel[]
}

export interface ExpenseWithDetails extends Expense {
  hostel?: Hostel
  recorded_by_profile?: Profile
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
    pending_verifications_count: number
    unresolved_complaints_count: number
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
