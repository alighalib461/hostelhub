export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beds: {
        Row: {
          bed_number: string
          created_at: string
          id: string
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          id?: string
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          id?: string
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_charges: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string
          fee_month: string
          hostel_id: string
          id: string
          resident_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          created_at?: string
          due_date: string
          fee_month: string
          hostel_id: string
          id?: string
          resident_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string
          fee_month?: string
          hostel_id?: string
          id?: string
          resident_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_charges_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_charges_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          address: string
          created_at: string
          id: string
          logo_path: string | null
          name: string
          owner_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          logo_path?: string | null
          name: string
          owner_id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          logo_path?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          fee_charge_id: string
          hostel_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          recorded_by: string
          resident_id: string
          status: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee_charge_id: string
          hostel_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_number?: string
          recorded_by: string
          resident_id: string
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee_charge_id?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          recorded_by?: string
          resident_id?: string
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_charge_id_fkey"
            columns: ["fee_charge_id"]
            isOneToOne: false
            referencedRelation: "fee_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          id: string
          mime_type: string
          registration_request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          id?: string
          mime_type: string
          registration_request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          registration_request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_documents_registration_request_id_fkey"
            columns: ["registration_request_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          cnic: string
          created_at: string
          emergency_contact_name: string
          emergency_contact_phone: string
          father_name: string
          full_name: string
          hostel_id: string
          id: string
          permanent_address: string
          phone: string
          profile_photo_path: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          cnic: string
          created_at?: string
          emergency_contact_name: string
          emergency_contact_phone: string
          father_name: string
          full_name: string
          hostel_id: string
          id?: string
          permanent_address: string
          phone: string
          profile_photo_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          cnic?: string
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          father_name?: string
          full_name?: string
          hostel_id?: string
          id?: string
          permanent_address?: string
          phone?: string
          profile_photo_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_assignments: {
        Row: {
          bed_id: string
          created_at: string
          end_date: string | null
          hostel_id: string
          id: string
          is_current: boolean
          resident_id: string
          room_id: string
          start_date: string
        }
        Insert: {
          bed_id: string
          created_at?: string
          end_date?: string | null
          hostel_id: string
          id?: string
          is_current?: boolean
          resident_id: string
          room_id: string
          start_date?: string
        }
        Update: {
          bed_id?: string
          created_at?: string
          end_date?: string | null
          hostel_id?: string
          id?: string
          is_current?: boolean
          resident_id?: string
          room_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_assignments_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_assignments_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_assignments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          id: string
          mime_type: string
          resident_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          id?: string
          mime_type: string
          resident_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          resident_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_documents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          admission_date: string
          cnic: string
          created_at: string
          emergency_contact_name: string
          emergency_contact_phone: string
          father_name: string
          fee_due_day: number
          full_name: string
          hostel_id: string
          id: string
          monthly_fee: number
          permanent_address: string
          phone: string
          profile_photo_path: string | null
          resident_id: string
          security_deposit: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_date?: string
          cnic: string
          created_at?: string
          emergency_contact_name: string
          emergency_contact_phone: string
          father_name: string
          fee_due_day?: number
          full_name: string
          hostel_id: string
          id?: string
          monthly_fee: number
          permanent_address: string
          phone: string
          profile_photo_path?: string | null
          resident_id?: string
          security_deposit?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_date?: string
          cnic?: string
          created_at?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          father_name?: string
          fee_due_day?: number
          full_name?: string
          hostel_id?: string
          id?: string
          monthly_fee?: number
          permanent_address?: string
          phone?: string
          profile_photo_path?: string | null
          resident_id?: string
          security_deposit?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          hostel_id: string
          id: string
          room_number: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          hostel_id: string
          id?: string
          room_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          hostel_id?: string
          id?: string
          room_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_registration: {
        Args: {
          p_bed_id: string
          p_fee_due_day?: number
          p_monthly_fee: number
          p_request_id: string
          p_security_deposit?: number
          p_start_date?: string
        }
        Returns: Json
      }
      assign_bed: {
        Args: { p_bed_id: string; p_resident_id: string; p_start_date?: string }
        Returns: Json
      }
      calculate_fee_due_date: {
        Args: { p_due_day: number; p_fee_month: string }
        Returns: string
      }
      generate_monthly_fees: {
        Args: { p_fee_month?: string; p_hostel_id: string }
        Returns: Json
      }
      generate_receipt_number: { Args: never; Returns: string }
      generate_resident_id: { Args: never; Returns: string }
      get_auth_role: { Args: never; Returns: string }
      is_hostel_owner: { Args: { p_hostel_id: string }; Returns: boolean }
      is_resident_user: { Args: { p_resident_id: string }; Returns: boolean }
      record_payment: {
        Args: {
          p_amount: number
          p_fee_charge_id: string
          p_notes?: string
          p_payment_method: string
        }
        Returns: Json
      }
      void_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
