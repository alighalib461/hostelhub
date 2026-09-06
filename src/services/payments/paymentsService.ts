import { supabase } from '../supabase/client'
import { PaymentWithDetails, ReceiptData } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const paymentsService = {
  async getPayments(options?: {
    hostelId?: string
    residentId?: string
    status?: 'paid' | 'voided' | 'all'
    month?: string
    search?: string
  }): Promise<PaymentWithDetails[]> {
    let query = supabase
      .from('payments')
      .select(`
        *,
        resident:residents (
          *,
          current_assignment:resident_assignments (
            *,
            room:rooms (*),
            bed:beds (*)
          )
        ),
        hostel:hostels (*),
        fee_charge:fee_charges (*)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.residentId) {
      query = query.eq('resident_id', options.residentId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.month && options.month !== 'all') {
      query = query.gte('payment_date', `${options.month}-01`).lte('payment_date', `${options.month}-31`)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return []

    let result = data.map((p) => {
      const currentAssgn = (p.resident?.current_assignment || []).find((a: { is_current: boolean }) => a.is_current)
      return {
        ...p,
        room_number: currentAssgn?.room?.room_number,
        bed_number: currentAssgn?.bed?.bed_number,
      } as PaymentWithDetails
    })

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim()
      result = result.filter((p) => {
        const resName = p.resident?.full_name?.toLowerCase() || ''
        const receipt = p.receipt_number?.toLowerCase() || ''
        const resId = p.resident?.resident_id?.toLowerCase() || ''
        return resName.includes(term) || receipt.includes(term) || resId.includes(term)
      })
    }

    return result
  },

  async recordPayment(payload: {
    fee_charge_id: string
    amount: number
    payment_method: 'cash' | 'bank_transfer' | 'other'
    payment_date?: string
    notes?: string
  }) {
    const { data, error } = await supabase.rpc('record_payment', {
      p_fee_charge_id: payload.fee_charge_id,
      p_amount: payload.amount,
      p_payment_method: payload.payment_method,
      p_payment_date: payload.payment_date || new Date().toISOString().slice(0, 10),
      p_notes: payload.notes || undefined,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async voidPayment(paymentId: string, reason: string) {
    const { data, error } = await supabase.rpc('void_payment', {
      p_payment_id: paymentId,
      p_reason: reason,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async getReceiptData(paymentId: string): Promise<ReceiptData | null> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        hostel:hostels (*),
        resident:residents (
          *,
          current_assignment:resident_assignments (
            *,
            room:rooms (*),
            bed:beds (*)
          )
        ),
        fee_charge:fee_charges (*)
      `)
      .eq('id', paymentId)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return null

    const currentAssgn = (data.resident?.current_assignment || []).find((a: { is_current: boolean }) => a.is_current)
    const feeDue = Number(data.fee_charge?.amount_due) || Number(data.amount)
    const feePaid = Number(data.fee_charge?.amount_paid) || Number(data.amount)
    const remaining = Math.max(0, feeDue - feePaid)

    return {
      receipt_number: data.receipt_number,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      amount: Number(data.amount),
      status: data.status,
      notes: data.notes,
      voided_at: data.voided_at,
      void_reason: data.void_reason,
      hostel: {
        name: data.hostel?.name || 'HostelHUB',
        address: data.hostel?.address || '',
        phone: data.hostel?.phone,
        logo_path: data.hostel?.logo_path,
      },
      resident: {
        full_name: data.resident?.full_name || 'Resident',
        resident_id: data.resident?.resident_id || '',
        cnic: data.resident?.cnic || '',
        phone: data.resident?.phone || '',
      },
      room_number: currentAssgn?.room?.room_number,
      bed_number: currentAssgn?.bed?.bed_number,
      fee_month: data.fee_charge?.fee_month || new Date().toISOString().slice(0, 7),
      fee_total_due: feeDue,
      fee_total_paid: feePaid,
      fee_remaining_balance: remaining,
    }
  },
}
