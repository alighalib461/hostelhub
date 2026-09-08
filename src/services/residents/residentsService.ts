import { supabase } from '../supabase/client'
import { ResidentWithDetails, Resident } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const residentsService = {
  async getResidents(options?: {
    hostelId?: string
    search?: string
    status?: 'active' | 'left' | 'all'
    roomId?: string
  }): Promise<ResidentWithDetails[]> {
    let query = supabase
      .from('residents')
      .select(`
        *,
        hostel:hostels (*),
        current_assignment:resident_assignments (
          *,
          room:rooms (*),
          bed:beds (*)
        ),
        fee_charges (*)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    // Database-level search across full_name, resident_id, cnic, phone
    if (options?.search && options.search.trim()) {
      const term = options.search.trim()
      query = query.or(`full_name.ilike.%${term}%,resident_id.ilike.%${term}%,cnic.ilike.%${term}%,phone.ilike.%${term}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return []

    return data.map((res) => {
      // Find active current assignment
      const currentAssgn = (res.current_assignment || []).find((a: { is_current: boolean }) => a.is_current)
      
      // Calculate current month balance and total outstanding
      const currentMonth = new Date().toISOString().slice(0, 7)
      const currentMonthFee = (res.fee_charges || []).find((f: { fee_month: string }) => f.fee_month === currentMonth)
      const currentMonthBalance = currentMonthFee ? (currentMonthFee.amount_due - currentMonthFee.amount_paid) : 0

      const totalOutstanding = (res.fee_charges || []).reduce((acc: number, f: { amount_due: number; amount_paid: number; status: string }) => {
        if (f.status !== 'paid' && f.status !== 'cancelled') {
          return acc + (Number(f.amount_due) - Number(f.amount_paid))
        }
        return acc
      }, 0)

      return {
        ...res,
        current_assignment: currentAssgn || null,
        current_month_balance: currentMonthBalance,
        total_outstanding: totalOutstanding,
      } as ResidentWithDetails
    })
  },

  async getResidentById(id: string): Promise<ResidentWithDetails | null> {
    const { data, error } = await supabase
      .from('residents')
      .select(`
        *,
        hostel:hostels (*),
        current_assignment:resident_assignments (
          *,
          room:rooms (*),
          bed:beds (*)
        ),
        documents:resident_documents (*),
        fee_charges (*),
        payments (*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return null

    const currentAssgn = (data.current_assignment || []).find((a: { is_current: boolean }) => a.is_current)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentMonthFee = (data.fee_charges || []).find((f: { fee_month: string }) => f.fee_month === currentMonth)
    const currentMonthBalance = currentMonthFee ? (currentMonthFee.amount_due - currentMonthFee.amount_paid) : 0

    const totalOutstanding = (data.fee_charges || []).reduce((acc: number, f: { amount_due: number; amount_paid: number; status: string }) => {
      if (f.status !== 'paid' && f.status !== 'cancelled') {
        return acc + (Number(f.amount_due) - Number(f.amount_paid))
      }
      return acc
    }, 0)

    return {
      ...data,
      current_assignment: currentAssgn || null,
      current_month_balance: currentMonthBalance,
      total_outstanding: totalOutstanding,
    } as ResidentWithDetails
  },

  async createResident(payload: {
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
    security_deposit: number
    fee_due_day?: number
    bed_id?: string
    initial_fee_month?: string
    initial_fee_amount?: number
    cnic_front_path?: string | null
    cnic_back_path?: string | null
  }): Promise<Resident> {
    const admissionDate = payload.admission_date || new Date().toISOString().slice(0, 10)
    const feeDueDay = payload.fee_due_day || 5

    // 1. Insert Resident record
    const { data: resident, error: resError } = await supabase
      .from('residents')
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
        admission_date: admissionDate,
        monthly_fee: payload.monthly_fee,
        security_deposit: payload.security_deposit,
        fee_due_day: feeDueDay,
        status: 'active',
      })
      .select()
      .single()

    if (resError) throw new Error(formatErrorMessage(resError))

    // 2. Assign Bed if selected
    if (payload.bed_id && resident) {
      try {
        await supabase.rpc('assign_bed', {
          p_resident_id: resident.id,
          p_bed_id: payload.bed_id,
          p_start_date: admissionDate,
        })
      } catch (err) {
        console.warn('Bed assignment warning:', err)
      }
    }

    // 3. Attach documents if provided
    if (payload.cnic_front_path && resident) {
      await supabase.from('resident_documents').insert({
        resident_id: resident.id,
        document_type: 'cnic_front',
        storage_path: payload.cnic_front_path,
        file_name: 'cnic-front.jpg',
        mime_type: 'image/jpeg',
      })
    }
    if (payload.cnic_back_path && resident) {
      await supabase.from('resident_documents').insert({
        resident_id: resident.id,
        document_type: 'cnic_back',
        storage_path: payload.cnic_back_path,
        file_name: 'cnic-back.jpg',
        mime_type: 'image/jpeg',
      })
    }

    // 4. Create Initial Month Fee Charge
    const feeMonth = payload.initial_fee_month || admissionDate.slice(0, 7)
    const feeAmount = payload.initial_fee_amount !== undefined ? payload.initial_fee_amount : payload.monthly_fee

    if (feeAmount > 0 && resident) {
      const year = parseInt(feeMonth.split('-')[0], 10)
      const month = parseInt(feeMonth.split('-')[1], 10)
      const dueDayStr = String(Math.min(feeDueDay, 28)).padStart(2, '0')
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${dueDayStr}`

      await supabase.from('fee_charges').insert({
        resident_id: resident.id,
        hostel_id: payload.hostel_id,
        fee_month: feeMonth,
        amount_due: feeAmount,
        due_date: dueDate,
        amount_paid: 0,
        status: 'pending',
      })
    }

    return resident
  },

  async updateResident(id: string, updates: Partial<Resident>): Promise<Resident> {
    const { data, error } = await supabase
      .from('residents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async linkResidentAccount(identifier: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in to link an account')

    const cleanId = identifier.trim()

    // 1. Try DB RPC first
    try {
      const { data, error } = await supabase.rpc('link_resident_account', {
        p_identifier: cleanId,
      })
      if (!error && data) {
        return data
      }
    } catch {
      // Continue to direct fallback
    }

    // 2. Resilient Direct Query Fallback
    const { data: matched, error: findError } = await supabase
      .from('residents')
      .select('id, resident_id, full_name, hostel_id, user_id')
      .or(`resident_id.eq.${cleanId},cnic.eq.${cleanId},phone.eq.${cleanId}`)
      .maybeSingle()

    if (findError || !matched) {
      throw new Error(`No resident record found for "${cleanId}". Please check your Resident ID, CNIC, or Phone.`)
    }

    if (matched.user_id && matched.user_id !== user.id) {
      throw new Error('This resident record is already linked with another user account.')
    }

    const { error: updateError } = await supabase
      .from('residents')
      .update({ user_id: user.id })
      .eq('id', matched.id)

    if (updateError) {
      throw new Error(formatErrorMessage(updateError))
    }

    return {
      success: true,
      resident_id: matched.id,
      resident_code: matched.resident_id,
      full_name: matched.full_name,
      hostel_id: matched.hostel_id,
    }
  },

  async getResidentForCurrentUser(): Promise<ResidentWithDetails | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Find resident linked by user_id
    let { data, error } = await supabase
      .from('residents')
      .select(`
        *,
        hostel:hostels (*),
        current_assignment:resident_assignments (
          *,
          room:rooms (*),
          bed:beds (*)
        ),
        documents:resident_documents (*),
        fee_charges (*),
        payments (*)
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    // 2. If not found, attempt auto-linking if profile has a registered phone number or email
    if (!data) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, email')
          .eq('id', user.id)
          .maybeSingle()

        const phone = profile?.phone?.trim()
        if (phone) {
          try {
            await this.linkResidentAccount(phone)
            const { data: refetched } = await supabase
              .from('residents')
              .select(`
                *,
                hostel:hostels (*),
                current_assignment:resident_assignments (
                  *,
                  room:rooms (*),
                  bed:beds (*)
                ),
                documents:resident_documents (*),
                fee_charges (*),
                payments (*)
              `)
              .eq('user_id', user.id)
              .maybeSingle()

            if (refetched) {
              data = refetched
            }
          } catch {
            // Ignore auto-link error
          }
        }
      } catch {
        // Ignore automatic link failure, user can link manually via UI
      }
    }

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return null

    const currentAssgn = (data.current_assignment || []).find((a: { is_current: boolean }) => a.is_current)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentMonthFee = (data.fee_charges || []).find((f: { fee_month: string }) => f.fee_month === currentMonth)
    const currentMonthBalance = currentMonthFee ? (currentMonthFee.amount_due - currentMonthFee.amount_paid) : 0

    return {
      ...data,
      current_assignment: currentAssgn || null,
      current_month_balance: currentMonthBalance,
    } as ResidentWithDetails
  },
}
