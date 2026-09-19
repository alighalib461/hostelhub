import { supabase } from '../supabase/client'
import { PaymentAccount } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const paymentAccountsService = {
  async getPaymentAccounts(hostelId: string, onlyActive = false): Promise<PaymentAccount[]> {
    if (!hostelId || hostelId === 'all') return []

    let query = supabase
      .from('payment_accounts')
      .select('*')
      .eq('hostel_id', hostelId)
      .order('created_at', { ascending: false })

    if (onlyActive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as PaymentAccount[]
  },

  async createPaymentAccount(payload: {
    hostel_id: string
    account_type: 'bank' | 'easypaisa' | 'jazzcash'
    bank_name?: string | null
    account_title: string
    account_number: string
    iban?: string | null
    instructions?: string | null
    is_active?: boolean
  }): Promise<PaymentAccount> {
    const { data, error } = await supabase
      .from('payment_accounts')
      .insert({
        hostel_id: payload.hostel_id,
        account_type: payload.account_type,
        bank_name: payload.bank_name || null,
        account_title: payload.account_title.trim(),
        account_number: payload.account_number.trim(),
        iban: payload.iban?.trim() || null,
        instructions: payload.instructions?.trim() || null,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data as PaymentAccount
  },

  async updatePaymentAccount(
    id: string,
    updates: Partial<PaymentAccount>
  ): Promise<PaymentAccount> {
    const { data, error } = await supabase
      .from('payment_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data as PaymentAccount
  },

  async deletePaymentAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_accounts')
      .delete()
      .eq('id', id)

    if (error) throw new Error(formatErrorMessage(error))
  },
}
