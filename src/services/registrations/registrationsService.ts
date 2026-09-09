import { supabase } from '../supabase/client'
import { RegistrationRequestWithDocs } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const registrationsService = {
  async getRegistrationRequests(options?: {
    hostelId?: string
    status?: 'pending' | 'approved' | 'rejected' | 'all'
  }): Promise<RegistrationRequestWithDocs[]> {
    let query = supabase
      .from('registration_requests')
      .select(`
        *,
        hostel:hostels (*),
        documents:registration_documents (*)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as RegistrationRequestWithDocs[]
  },

  async submitRegistration(payload: {
    hostel_id: string
    full_name: string
    father_name: string
    cnic: string
    phone: string
    permanent_address: string
    emergency_contact_name: string
    emergency_contact_phone: string
    profile_photo_path?: string | null
    cnic_front_path?: string | null
    cnic_back_path?: string | null
  }) {
    const { data, error } = await supabase.rpc('submit_registration_request', {
      p_hostel_id: payload.hostel_id,
      p_full_name: payload.full_name,
      p_father_name: payload.father_name,
      p_cnic: payload.cnic,
      p_phone: payload.phone,
      p_permanent_address: payload.permanent_address,
      p_emergency_contact_name: payload.emergency_contact_name,
      p_emergency_contact_phone: payload.emergency_contact_phone,
      p_profile_photo_path: payload.profile_photo_path || null,
      p_cnic_front_path: payload.cnic_front_path || null,
      p_cnic_back_path: payload.cnic_back_path || null,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async approveRegistration(payload: {
    request_id: string
    bed_id: string
    monthly_fee: number
    security_deposit?: number
    fee_due_day?: number
    admission_date?: string
  }) {
    const { data, error } = await supabase.rpc('approve_registration', {
      p_request_id: payload.request_id,
      p_bed_id: payload.bed_id,
      p_monthly_fee: payload.monthly_fee,
      p_security_deposit: payload.security_deposit || 0,
      p_fee_due_day: payload.fee_due_day || 5,
      p_admission_date: payload.admission_date || new Date().toISOString().slice(0, 10),
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async rejectRegistration(requestId: string, reason: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('registration_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },
}
