import { supabase } from '../supabase/client'
import { FeeChargeWithDetails } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const feesService = {
  async getFeeCharges(options?: {
    hostelId?: string
    feeMonth?: string
    status?: 'all' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
    search?: string
  }): Promise<FeeChargeWithDetails[]> {
    let query = supabase
      .from('fee_charges')
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
        payments (*)
      `)
      .order('due_date', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.feeMonth && options.feeMonth !== 'all') {
      query = query.eq('fee_month', options.feeMonth)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return []

    let result = data.map((charge) => {
      const remaining = Math.max(0, Number(charge.amount_due) - Number(charge.amount_paid))
      return {
        ...charge,
        remaining_amount: remaining,
      } as FeeChargeWithDetails
    })

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim()
      result = result.filter((item) => {
        const resName = item.resident?.full_name?.toLowerCase() || ''
        const resId = item.resident?.resident_id?.toLowerCase() || ''
        const cnic = item.resident?.cnic?.toLowerCase() || ''
        const phone = item.resident?.phone?.toLowerCase() || ''
        return resName.includes(term) || resId.includes(term) || cnic.includes(term) || phone.includes(term)
      })
    }

    return result
  },

  async generateMonthlyFees(hostelId: string, feeMonth: string): Promise<{ generated_count: number; fee_month: string }> {
    const { data, error } = await supabase.rpc('generate_monthly_fees', {
      p_hostel_id: hostelId,
      p_fee_month: feeMonth,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data as { generated_count: number; fee_month: string }
  },

  async getFeeSummary(hostelId?: string, feeMonth?: string) {
    let query = supabase.from('fee_charges').select('amount_due, amount_paid, status, due_date')

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }
    if (feeMonth && feeMonth !== 'all') {
      query = query.eq('fee_month', feeMonth)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))

    const today = new Date().toISOString().slice(0, 10)
    let expected = 0
    let collected = 0
    let pending = 0
    let overdue = 0

    ;(data || []).forEach((c) => {
      const due = Number(c.amount_due) || 0
      const paid = Number(c.amount_paid) || 0
      const remaining = Math.max(0, due - paid)

      expected += due
      collected += paid

      if (remaining > 0) {
        if (c.due_date < today) {
          overdue += remaining
        } else {
          pending += remaining
        }
      }
    })

    return {
      expected,
      collected,
      pending,
      overdue,
      total_outstanding: pending + overdue,
    }
  },
}
