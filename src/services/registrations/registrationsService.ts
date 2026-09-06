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
    const { data: request, error } = await supabase
      .from('registration_requests')
      .insert({
        hostel_id: payload.hostel_id,
        full_name: payload.full_name,
        father_name: payload.father_name,
        cnic: payload.cnic,
        phone: payload.phone,
        permanent_address: payload.permanent_address,
        emergency_contact_name: payload.emergency_contact_name,
        emergency_contact_phone: payload.emergency_contact_phone,
        profile_photo_path: payload.profile_photo_path || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))

    // Attach documents
    if (payload.cnic_front_path && request) {
      await supabase.from('registration_documents').insert({
        registration_request_id: request.id,
        document_type: 'cnic_front',
        storage_path: payload.cnic_front_path,
        file_name: 'cnic-front.jpg',
        mime_type: 'image/jpeg',
      })
    }
    if (payload.cnic_back_path && request) {
      await supabase.from('registration_documents').insert({
        registration_request_id: request.id,
        document_type: 'cnic_back',
        storage_path: payload.cnic_back_path,
        file_name: 'cnic-back.jpg',
        mime_type: 'image/jpeg',
      })
    }

    return request
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
