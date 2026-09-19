export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          avatar_path: string | null
          role: 'owner' | 'warden' | 'resident'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          email?: string | null
          avatar_path?: string | null
          role: 'owner' | 'warden' | 'resident'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          avatar_path?: string | null
          role?: 'owner' | 'warden' | 'resident'
          created_at?: string
          updated_at?: string
        }
      }
      hostels: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          phone: string | null
          logo_path: string | null
          city: string | null
          description: string | null
          current_menu_image_url: string | null
          current_menu_updated_at: string | null
          current_menu_updated_by: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          address: string
          phone?: string | null
          logo_path?: string | null
          city?: string | null
          description?: string | null
          current_menu_image_url?: string | null
          current_menu_updated_at?: string | null
          current_menu_updated_by?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          address?: string
          phone?: string | null
          logo_path?: string | null
          city?: string | null
          description?: string | null
          current_menu_image_url?: string | null
          current_menu_updated_at?: string | null
          current_menu_updated_by?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      warden_assignments: {
        Row: {
          id: string
          user_id: string
          hostel_id: string
          is_active: boolean
          permissions: {
            can_view_residents?: boolean
            can_add_residents?: boolean
            can_edit_residents?: boolean
            can_manage_rooms?: boolean
            can_manage_beds?: boolean
            can_record_payments?: boolean
            can_verify_online_payments?: boolean
            can_view_fees?: boolean
            can_manage_complaints?: boolean
            can_manage_menu?: boolean
            can_create_announcements?: boolean
            can_view_expenses?: boolean
            can_manage_expenses?: boolean
            can_view_reports?: boolean
            can_check_in_out?: boolean
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hostel_id: string
          is_active?: boolean
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hostel_id?: string
          is_active?: boolean
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      warden_invitations: {
        Row: {
          id: string
          token: string
          email: string
          full_name: string
          phone: string | null
          hostel_ids: string[]
          permissions: Json
          status: 'pending' | 'accepted' | 'expired' | 'cancelled'
          invited_by: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token?: string
          email: string
          full_name: string
          phone?: string | null
          hostel_ids: string[]
          permissions?: Json
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
          invited_by: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token?: string
          email?: string
          full_name?: string
          phone?: string | null
          hostel_ids?: string[]
          permissions?: Json
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
          invited_by?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      payment_accounts: {
        Row: {
          id: string
          hostel_id: string
          account_type: 'bank' | 'easypaisa' | 'jazzcash'
          bank_name: string | null
          account_title: string
          account_number: string
          iban: string | null
          instructions: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hostel_id: string
          account_type: 'bank' | 'easypaisa' | 'jazzcash'
          bank_name?: string | null
          account_title: string
          account_number: string
          iban?: string | null
          instructions?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string
          account_type?: 'bank' | 'easypaisa' | 'jazzcash'
          bank_name?: string | null
          account_title?: string
          account_number?: string
          iban?: string | null
          instructions?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      online_payment_submissions: {
        Row: {
          id: string
          fee_charge_id: string
          resident_id: string
          hostel_id: string
          payment_account_id: string | null
          amount: number
          payment_method: 'bank_transfer' | 'easypaisa' | 'jazzcash'
          transaction_id: string
          proof_image_path: string | null
          status: 'pending_verification' | 'approved' | 'rejected'
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fee_charge_id: string
          resident_id: string
          hostel_id: string
          payment_account_id?: string | null
          amount: number
          payment_method: 'bank_transfer' | 'easypaisa' | 'jazzcash'
          transaction_id: string
          proof_image_path?: string | null
          status?: 'pending_verification' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fee_charge_id?: string
          resident_id?: string
          hostel_id?: string
          payment_account_id?: string | null
          amount?: number
          payment_method?: 'bank_transfer' | 'easypaisa' | 'jazzcash'
          transaction_id?: string
          proof_image_path?: string | null
          status?: 'pending_verification' | 'approved' | 'rejected'
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          hostel_id: string | null
          title: string
          content: string
          target_audience: 'all' | 'wardens' | 'residents' | 'both'
          is_all_hostels: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hostel_id?: string | null
          title: string
          content: string
          target_audience?: 'all' | 'wardens' | 'residents' | 'both'
          is_all_hostels?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string | null
          title?: string
          content?: string
          target_audience?: 'all' | 'wardens' | 'residents' | 'both'
          is_all_hostels?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      announcement_hostels: {
        Row: {
          announcement_id: string
          hostel_id: string
        }
        Insert: {
          announcement_id: string
          hostel_id: string
        }
        Update: {
          announcement_id?: string
          hostel_id?: string
        }
      }
      expenses: {
        Row: {
          id: string
          hostel_id: string
          category: 'Utilities' | 'Maintenance' | 'Groceries / Food' | 'Staff Salary' | 'Rent' | 'Internet / Cable' | 'Cleaning / Supplies' | 'Other'
          title: string
          amount: number
          expense_date: string
          receipt_proof_path: string | null
          notes: string | null
          recorded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hostel_id: string
          category: 'Utilities' | 'Maintenance' | 'Groceries / Food' | 'Staff Salary' | 'Rent' | 'Internet / Cable' | 'Cleaning / Supplies' | 'Other'
          title: string
          amount: number
          expense_date?: string
          receipt_proof_path?: string | null
          notes?: string | null
          recorded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string
          category?: 'Utilities' | 'Maintenance' | 'Groceries / Food' | 'Staff Salary' | 'Rent' | 'Internet / Cable' | 'Cleaning / Supplies' | 'Other'
          title?: string
          amount?: number
          expense_date?: string
          receipt_proof_path?: string | null
          notes?: string | null
          recorded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          hostel_id: string | null
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          hostel_id?: string | null
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string | null
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          hostel_id: string
          room_number: string
          capacity: number
          status: 'active' | 'maintenance' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hostel_id: string
          room_number: string
          capacity?: number
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string
          room_number?: string
          capacity?: number
          status?: 'active' | 'maintenance' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      beds: {
        Row: {
          id: string
          room_id: string
          bed_number: string
          status: 'available' | 'occupied' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          bed_number: string
          status?: 'available' | 'occupied' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          bed_number?: string
          status?: 'available' | 'occupied' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      residents: {
        Row: {
          id: string
          resident_id: string
          user_id: string | null
          hostel_id: string
          full_name: string
          father_name: string
          cnic: string
          phone: string
          permanent_address: string
          emergency_contact_name: string
          emergency_contact_phone: string
          profile_photo_path: string | null
          admission_date: string
          monthly_fee: number
          security_deposit: number
          fee_due_day: number
          status: 'active' | 'left'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id?: string
          user_id?: string | null
          hostel_id: string
          full_name: string
          father_name: string
          cnic: string
          phone: string
          permanent_address: string
          emergency_contact_name: string
          emergency_contact_phone: string
          profile_photo_path?: string | null
          admission_date?: string
          monthly_fee: number
          security_deposit?: number
          fee_due_day?: number
          status?: 'active' | 'left'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          user_id?: string | null
          hostel_id?: string
          full_name?: string
          father_name?: string
          cnic?: string
          phone?: string
          permanent_address?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          profile_photo_path?: string | null
          admission_date?: string
          monthly_fee?: number
          security_deposit?: number
          fee_due_day?: number
          status?: 'active' | 'left'
          created_at?: string
          updated_at?: string
        }
      }
      resident_assignments: {
        Row: {
          id: string
          resident_id: string
          hostel_id: string
          room_id: string
          bed_id: string
          start_date: string
          end_date: string | null
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          hostel_id: string
          room_id: string
          bed_id: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          hostel_id?: string
          room_id?: string
          bed_id?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          created_at?: string
        }
      }
      resident_documents: {
        Row: {
          id: string
          resident_id: string
          document_type: 'cnic_front' | 'cnic_back'
          storage_path: string
          file_name: string
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          document_type: 'cnic_front' | 'cnic_back'
          storage_path: string
          file_name: string
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          document_type?: 'cnic_front' | 'cnic_back'
          storage_path?: string
          file_name?: string
          mime_type?: string
          created_at?: string
        }
      }
      registration_requests: {
        Row: {
          id: string
          hostel_id: string
          full_name: string
          father_name: string
          cnic: string
          phone: string
          permanent_address: string
          emergency_contact_name: string
          emergency_contact_phone: string
          profile_photo_path: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hostel_id: string
          full_name: string
          father_name: string
          cnic: string
          phone: string
          permanent_address: string
          emergency_contact_name: string
          emergency_contact_phone: string
          profile_photo_path?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string
          full_name?: string
          father_name?: string
          cnic?: string
          phone?: string
          permanent_address?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          profile_photo_path?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
      }
      registration_documents: {
        Row: {
          id: string
          registration_request_id: string
          document_type: 'cnic_front' | 'cnic_back'
          storage_path: string
          file_name: string
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          registration_request_id: string
          document_type: 'cnic_front' | 'cnic_back'
          storage_path: string
          file_name: string
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          registration_request_id?: string
          document_type?: 'cnic_front' | 'cnic_back'
          storage_path?: string
          file_name?: string
          mime_type?: string
          created_at?: string
        }
      }
      fee_charges: {
        Row: {
          id: string
          resident_id: string
          hostel_id: string
          fee_month: string
          amount_due: number
          due_date: string
          amount_paid: number
          status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          hostel_id: string
          fee_month: string
          amount_due: number
          due_date: string
          amount_paid?: number
          status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          hostel_id?: string
          fee_month?: string
          amount_due?: number
          due_date?: string
          amount_paid?: number
          status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          fee_charge_id: string
          resident_id: string
          hostel_id: string
          amount: number
          payment_date: string
          payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'other'
          status: 'paid' | 'voided'
          receipt_number: string
          notes: string | null
          recorded_by: string
          created_at: string
          updated_at: string
          voided_at: string | null
          voided_by: string | null
          void_reason: string | null
        }
        Insert: {
          id?: string
          fee_charge_id: string
          resident_id: string
          hostel_id: string
          amount: number
          payment_date?: string
          payment_method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'other'
          status?: 'paid' | 'voided'
          receipt_number?: string
          notes?: string | null
          recorded_by: string
          created_at?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
          void_reason?: string | null
        }
        Update: {
          id?: string
          fee_charge_id?: string
          resident_id?: string
          hostel_id?: string
          amount?: number
          payment_date?: string
          payment_method?: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'other'
          status?: 'paid' | 'voided'
          receipt_number?: string
          notes?: string | null
          recorded_by?: string
          created_at?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
          void_reason?: string | null
        }
      }
      complaints: {
        Row: {
          id: string
          complaint_code: string
          resident_id: string
          hostel_id: string
          room_id: string | null
          bed_id: string | null
          category: 'Electrical' | 'Plumbing' | 'Room / Furniture' | 'Cleaning' | 'Internet / Wi-Fi' | 'Mess / Food' | 'Security' | 'Other'
          subject: string
          description: string
          priority: 'normal' | 'urgent'
          status: 'submitted' | 'in_progress' | 'resolved'
          photo_path: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          complaint_code?: string
          resident_id: string
          hostel_id: string
          room_id?: string | null
          bed_id?: string | null
          category: 'Electrical' | 'Plumbing' | 'Room / Furniture' | 'Cleaning' | 'Internet / Wi-Fi' | 'Mess / Food' | 'Security' | 'Other'
          subject: string
          description: string
          priority?: 'normal' | 'urgent'
          status?: 'submitted' | 'in_progress' | 'resolved'
          photo_path?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          complaint_code?: string
          resident_id?: string
          hostel_id?: string
          room_id?: string | null
          bed_id?: string | null
          category?: 'Electrical' | 'Plumbing' | 'Room / Furniture' | 'Cleaning' | 'Internet / Wi-Fi' | 'Mess / Food' | 'Security' | 'Other'
          subject?: string
          description?: string
          priority?: 'normal' | 'urgent'
          status?: 'submitted' | 'in_progress' | 'resolved'
          photo_path?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: {
          success: boolean
          user_id: string
          role: string
          message: string
        }
      }
      submit_account_deletion_request: {
        Args: {
          p_full_name: string
          p_email: string
          p_phone: string
          p_role?: string
          p_reason?: string | null
        }
        Returns: {
          success: boolean
          request_code: string
        }
      }
      record_payment: {
        Args: {
          p_fee_charge_id: string
          p_amount: number
          p_payment_method: string
          p_payment_date?: string
          p_notes?: string
        }
        Returns: {
          payment_id: string
          receipt_number: string
          fee_status: string
          amount_paid: number
          remaining_balance: number
        }
      }
      assign_bed: {
        Args: {
          p_resident_id: string
          p_bed_id: string
          p_start_date?: string
        }
        Returns: {
          assignment_id: string
          hostel_id: string
          room_id: string
          bed_id: string
        }
      }
      approve_registration: {
        Args: {
          p_request_id: string
          p_bed_id: string
          p_monthly_fee: number
          p_security_deposit?: number
          p_fee_due_day?: number
          p_admission_date?: string
        }
        Returns: {
          resident_id: string
          readable_resident_id: string
          assignment_id: string
          fee_charge_id: string
        }
      }
      void_payment: {
        Args: {
          p_payment_id: string
          p_reason: string
        }
        Returns: {
          success: boolean
          payment_id: string
          fee_status: string
          amount_paid: number
        }
      }
      generate_monthly_fees: {
        Args: {
          p_hostel_id: string
          p_fee_month: string
        }
        Returns: {
          generated_count: number
          fee_month: string
        }
      }
      verify_online_payment: {
        Args: {
          p_submission_id: string
          p_action: string
          p_rejection_reason?: string | null
        }
        Returns: {
          success: boolean
          status: string
          submission_id: string
          payment_id?: string
          receipt_number?: string
          amount_paid_total?: number
          fee_status?: string
        }
      }
      update_hostel_menu: {
        Args: {
          p_hostel_id: string
          p_image_url: string
        }
        Returns: {
          success: boolean
          hostel_id: string
          current_menu_image_url: string
          updated_at: string
        }
      }
      accept_warden_invitation: {
        Args: {
          p_token: string
        }
        Returns: {
          success: boolean
          message: string
          assigned_hostels_count: number
        }
      }
      get_auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_hostel_owner: {
        Args: {
          p_hostel_id: string
        }
        Returns: boolean
      }
      is_hostel_warden: {
        Args: {
          p_hostel_id: string
        }
        Returns: boolean
      }
      is_hostel_authorized: {
        Args: {
          p_hostel_id: string
        }
        Returns: boolean
      }
      has_warden_permission: {
        Args: {
          p_hostel_id: string
          p_permission: string
        }
        Returns: boolean
      }
      is_resident_user: {
        Args: {
          p_resident_id: string
        }
        Returns: boolean
      }
      link_resident_account: {
        Args: {
          p_identifier: string
        }
        Returns: {
          success: boolean
          resident_id: string
          resident_code: string
          full_name: string
          hostel_id: string
        }
      }
    }
  }
}
