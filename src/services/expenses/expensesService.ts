import { supabase } from '../supabase/client'
import { ExpenseWithDetails, Expense } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const expensesService = {
  async getExpenses(options?: {
    hostelId?: string
    category?: string
    month?: string
    search?: string
  }): Promise<ExpenseWithDetails[]> {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        hostel:hostels (*),
        recorded_by_profile:profiles (*)
      `)
      .order('expense_date', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }

    if (options?.month && options.month !== 'all') {
      query = query.gte('expense_date', `${options.month}-01`).lte('expense_date', `${options.month}-31`)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))

    let list = (data || []) as ExpenseWithDetails[]

    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim()
      list = list.filter((e) => e.title.toLowerCase().includes(term) || (e.notes || '').toLowerCase().includes(term))
    }

    return list
  },

  async createExpense(payload: {
    hostel_id: string
    category: 'Utilities' | 'Maintenance' | 'Groceries / Food' | 'Staff Salary' | 'Rent' | 'Internet / Cable' | 'Cleaning / Supplies' | 'Other'
    title: string
    amount: number
    expense_date?: string
    receipt_proof_path?: string | null
    notes?: string | null
  }): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    if (!payload.title.trim()) throw new Error('Expense title is required')
    if (!payload.amount || payload.amount <= 0) throw new Error('Amount must be greater than zero')
    if (!payload.hostel_id) throw new Error('Hostel selection is required')

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        hostel_id: payload.hostel_id,
        category: payload.category,
        title: payload.title.trim(),
        amount: payload.amount,
        expense_date: payload.expense_date || new Date().toISOString().slice(0, 10),
        receipt_proof_path: payload.receipt_proof_path || null,
        notes: payload.notes?.trim() || null,
        recorded_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data as Expense
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(formatErrorMessage(error))
  },

  async getExpenseSummary(hostelId?: string, month?: string) {
    let query = supabase.from('expenses').select('amount, category, expense_date')

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    if (month && month !== 'all') {
      query = query.gte('expense_date', `${month}-01`).lte('expense_date', `${month}-31`)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))

    const list = data || []
    const totalAmount = list.reduce((sum, e) => sum + Number(e.amount), 0)
    const byCategory: Record<string, number> = {}

    list.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
    })

    return {
      totalAmount,
      totalTransactions: list.length,
      byCategory,
    }
  },
}
