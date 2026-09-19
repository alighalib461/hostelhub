import { supabase } from '../supabase/client'
import {
  OnlinePaymentSubmission,
  OnlinePaymentSubmissionWithDetails,
} from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const onlinePaymentsService = {
  async getSubmissions(options?: {
    hostelId?: string
    status?: 'pending_verification' | 'approved' | 'rejected' | 'all'
    residentId?: string
  }): Promise<OnlinePaymentSubmissionWithDetails[]> {
    let query = supabase
      .from('online_payment_submissions')
      .select(`
        *,
        resident:residents (
          id,
          full_name,
          resident_id,
          phone,
          cnic
        ),
        hostel:hostels (
          id,
          name,
          address
        ),
        fee_charge:fee_charges (
          id,
          fee_month,
          amount_due,
          amount_paid
        ),
        payment_account:payment_accounts (*)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.residentId) {
      query = query.eq('resident_id', options.residentId)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as OnlinePaymentSubmissionWithDetails[]
  },

  async submitOnlinePayment(payload: {
    fee_charge_id: string
    resident_id: string
    hostel_id: string
    payment_account_id?: string | null
    amount: number
    payment_method: 'bank_transfer' | 'easypaisa' | 'jazzcash'
    transaction_id: string
    proof_image_path?: string | null
  }): Promise<OnlinePaymentSubmission> {
    if (!payload.transaction_id.trim()) {
      throw new Error('Transaction / Reference ID is required')
    }
    if (!payload.amount || payload.amount <= 0) {
      throw new Error('Payment amount must be greater than zero')
    }

    const { data, error } = await supabase
      .from('online_payment_submissions')
      .insert({
        fee_charge_id: payload.fee_charge_id,
        resident_id: payload.resident_id,
        hostel_id: payload.hostel_id,
        payment_account_id: payload.payment_account_id || null,
        amount: payload.amount,
        payment_method: payload.payment_method,
        transaction_id: payload.transaction_id.trim(),
        proof_image_path: payload.proof_image_path || null,
        status: 'pending_verification',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data as OnlinePaymentSubmission
  },

  async approveSubmission(submissionId: string) {
    const { data, error } = await supabase.rpc('verify_online_payment', {
      p_submission_id: submissionId,
      p_action: 'approve',
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async rejectSubmission(submissionId: string, rejectionReason: string) {
    if (!rejectionReason.trim()) {
      throw new Error('Please provide a reason for rejecting this payment')
    }

    const { data, error } = await supabase.rpc('verify_online_payment', {
      p_submission_id: submissionId,
      p_action: 'reject',
      p_rejection_reason: rejectionReason.trim(),
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async getPendingCount(hostelId?: string): Promise<number> {
    let query = supabase
      .from('online_payment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_verification')

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    const { count, error } = await query
    if (error) return 0
    return count || 0
  },
}
