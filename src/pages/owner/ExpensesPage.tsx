import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { expensesService } from '../../services/expenses/expensesService'
import { storageService } from '../../services/storage/storageService'
import { ExpenseWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, getCurrentFeeMonth, formatFeeMonth } from '../../utils/formatters'
import {
  DollarSign,
  PlusCircle,
  Building,
  Calendar,
  Trash2,
  AlertCircle,
  TrendingDown,
  FileText,
  Search,
} from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Utilities',
  'Maintenance',
  'Groceries / Food',
  'Staff Salary',
  'Rent',
  'Internet / Cable',
  'Cleaning / Supplies',
  'Other',
] as const

export const ExpensesPage: React.FC = () => {
  const { hostels, selectedHostelId, selectedHostel, wardenPermissions } = useHostelContext()

  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentFeeMonth())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [summary, setSummary] = useState({ totalAmount: 0, totalTransactions: 0, byCategory: {} as Record<string, number> })

  // Record Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetHostelId, setTargetHostelId] = useState('')
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>('Utilities')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const activeHostelId =
    selectedHostelId !== 'all' ? selectedHostelId : hostels.length > 0 ? hostels[0].id : ''

  useEffect(() => {
    loadData()
  }, [selectedHostelId, selectedMonth, selectedCategory])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [list, sum] = await Promise.all([
        expensesService.getExpenses({
          hostelId: selectedHostelId,
          month: selectedMonth,
          category: selectedCategory,
          search: searchQuery,
        }),
        expensesService.getExpenseSummary(selectedHostelId, selectedMonth),
      ])
      setExpenses(list)
      setSummary(sum)
    } catch (err) {
      console.error('Failed to load expenses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenRecord = () => {
    setTargetHostelId(activeHostelId)
    setCategory('Utilities')
    setTitle('')
    setAmount('')
    setExpenseDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setProofFile(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || Number(amount) <= 0 || !targetHostelId) {
      setFormError('Please fill in all required fields.')
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      let proofPath: string | null = null
      if (proofFile) {
        const ext = proofFile.name.split('.').pop() || 'jpg'
        const path = `expenses/${targetHostelId}_${Date.now()}.${ext}`
        const res = await storageService.uploadFile('resident-documents', path, proofFile)
        proofPath = res.path
      }

      await expensesService.createExpense({
        hostel_id: targetHostelId,
        category,
        title: title.trim(),
        amount: Number(amount),
        expense_date: expenseDate,
        receipt_proof_path: proofPath,
        notes: notes.trim() || null,
      })

      setIsModalOpen(false)
      loadData()
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message || 'Failed to record expense.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return
    try {
      await expensesService.deleteExpense(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Hostel Operational Expenses
          </h2>
          <p className="text-xs text-slate-500">
            Track utilities, maintenance, grocery, and staff operational spending for{' '}
            <strong>{selectedHostel ? selectedHostel.name : 'all hostels'}</strong>
          </p>
        </div>

        {wardenPermissions.can_manage_expenses !== false && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenRecord}
          >
            Record Expense
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Spending ({formatFeeMonth(selectedMonth)})
            </span>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-[11px] text-slate-500">{summary.totalTransactions} transactions logged</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Top 2 Categories */}
        {Object.entries(summary.byCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([cat, amt]) => (
            <div
              key={cat}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card flex items-center justify-between"
            >
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {cat}
                </span>
                <p className="text-xl font-bold text-[#172033] truncate">{formatCurrency(amt)}</p>
                <p className="text-[11px] text-slate-500">
                  {summary.totalAmount > 0 ? `${Math.round((amt / summary.totalAmount) * 100)}% of total` : '0%'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                {cat.charAt(0)}
              </div>
            </div>
          ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-44 text-xs"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-40 text-xs"
          />
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="text-xs"
          />
        </div>
      </div>

      {/* Expenses Ledger */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-8 h-8" />}
          title="No expenses recorded"
          description="Log operational costs to keep complete transparency over hostel profit and expenditure."
          actionLabel="Record Expense"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={handleOpenRecord}
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {exp.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {exp.hostel?.name || 'Hostel'} • {formatDate(exp.expense_date)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#172033]">{exp.title}</h4>
                {exp.notes && <p className="text-xs text-slate-500 italic">{exp.notes}</p>}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <p className="text-base sm:text-lg font-bold text-rose-700">
                  {formatCurrency(exp.amount)}
                </p>

                {wardenPermissions.can_manage_expenses !== false && (
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operational Expense"
        maxWidth="md"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Hostel Branch"
            required
            value={targetHostelId}
            onChange={(e) => setTargetHostelId(e.target.value)}
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Expense Category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof EXPENSE_CATEGORIES)[number])}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Input
              label="Expense Date"
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <Input
            label="Expense Title / Description"
            placeholder="e.g. July Electricity Bill / Grocery Supplies / Plumbing Pipe Repair"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Amount (PKR)"
            type="number"
            min={1}
            placeholder="e.g. 25000"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Paid via online banking by Warden..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Save Expense Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
