import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { feesService } from '../../services/fees/feesService'
import { paymentsService } from '../../services/payments/paymentsService'
import { FeeChargeWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { SearchBar } from '../../components/shared/SearchBar'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  getCurrentFeeMonth,
  formatPhone,
} from '../../utils/formatters'
import confetti from 'canvas-confetti'
import {
  CreditCard,
  PlusCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Receipt,
  Sparkles,
} from 'lucide-react'

export const FeesPage: React.FC = () => {
  const { selectedHostelId, hostels } = useHostelContext()
  const navigate = useNavigate()

  const [feeCharges, setFeeCharges] = useState<FeeChargeWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentFeeMonth())
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid' | 'overdue'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Summary Metrics
  const [summary, setSummary] = useState({
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    total_outstanding: 0,
  })

  // Generate Monthly Fees Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [genHostelId, setGenHostelId] = useState(
    selectedHostelId !== 'all' ? selectedHostelId : hostels[0]?.id || ''
  )
  const [genMonth, setGenMonth] = useState(getCurrentFeeMonth())
  const [isGenerating, setIsGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)

  // Record Payment Quick Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState<FeeChargeWithDetails | null>(null)
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    loadFeesData()
  }, [selectedHostelId, selectedMonth, statusFilter, searchTerm])

  const loadFeesData = async () => {
    setIsLoading(true)
    try {
      const [charges, sum] = await Promise.all([
        feesService.getFeeCharges({
          hostelId: selectedHostelId,
          feeMonth: selectedMonth,
          status: statusFilter,
          search: searchTerm,
        }),
        feesService.getFeeSummary(selectedHostelId, selectedMonth),
      ])
      setFeeCharges(charges)
      setSummary(sum)
    } catch (err) {
      console.error('Failed to load fees:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFees = async () => {
    if (!genHostelId || !genMonth) return
    setIsGenerating(true)
    setGenResult(null)
    try {
      const res = await feesService.generateMonthlyFees(genHostelId, genMonth)
      setGenResult(`Successfully generated ${res.generated_count} fee charges for ${formatFeeMonth(genMonth)}!`)
      loadFeesData()
    } catch (err: unknown) {
      setGenResult(`Error: ${(err as { message?: string })?.message || 'Failed to generate fees.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenRecordPayment = (charge: FeeChargeWithDetails) => {
    setSelectedCharge(charge)
    setPayAmount(charge.remaining_amount)
    setPayMethod('cash')
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayNotes('')
    setPayError(null)
    setIsRecordModalOpen(true)
  }

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharge) return
    setPayError(null)
    setIsRecording(true)

    try {
      await paymentsService.recordPayment({
        fee_charge_id: selectedCharge.id,
        amount: Number(payAmount),
        payment_method: payMethod,
        payment_date: payDate,
        notes: payNotes,
      })

      confetti({ particleCount: 70, spread: 60 })
      setIsRecordModalOpen(false)
      loadFeesData()
    } catch (err: unknown) {
      setPayError((err as { message?: string })?.message || 'Failed to record payment.')
    } finally {
      setIsRecording(false)
    }
  }

  // Month options generator (past 6 months + next 2 months)
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = -5; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      options.push({ value: val, label: formatFeeMonth(val) })
    }
    return options
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Fee & Billing Ledger
          </h2>
          <p className="text-xs text-text-secondary">
            Manage monthly resident billing, track outstanding balances, and generate recurring charges
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2 px-3 sm:px-4"
            leftIcon={<Sparkles className="w-4 h-4 text-blue-brand shrink-0" />}
            onClick={() => {
              setGenHostelId(selectedHostelId !== 'all' ? selectedHostelId : hostels[0]?.id || '')
              setIsGenerateModalOpen(true)
            }}
          >
            Generate Monthly Fees
          </Button>

          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2 px-3 sm:px-4"
            leftIcon={<CreditCard className="w-4 h-4 shrink-0" />}
            onClick={() => navigate('/app/payments')}
          >
            View Payment Transactions
          </Button>
        </div>
      </div>

      {/* KPI Cards for Selected Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-text-secondary font-medium">Expected Billing</span>
          <p className="text-xl font-bold text-text-primary mt-1">{formatCurrency(summary.expected)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-emerald-800 font-medium">Collected</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.collected)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-amber-800 font-medium">Pending Due</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(summary.pending)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-rose-800 font-medium">Overdue Amount</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(summary.overdue)}</p>
        </div>
      </div>

      {/* Search & Month Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search resident name, ID, or phone..."
            className="w-full sm:max-w-xs"
          />

          {/* Month Selector */}
          <div className="w-full sm:w-48">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={generateMonthOptions()}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {(['all', 'pending', 'partial', 'paid', 'overdue'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-navy-primary shadow-xs'
                  : 'text-slate-500 hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : feeCharges.length === 0 ? (
        <EmptyState
          title={`No fee records for ${formatFeeMonth(selectedMonth)}`}
          description="Click below to generate monthly fee charges for all active residents."
          icon={<CreditCard className="w-8 h-8" />}
          actionLabel="Generate Monthly Fees"
          actionIcon={<Sparkles className="w-4 h-4" />}
          onAction={() => setIsGenerateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Room / Bed</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Amount Due</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeCharges.map((charge) => (
                <tr key={charge.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {charge.resident?.full_name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">
                          {charge.resident?.full_name || 'Resident'}
                        </p>
                        <p className="font-mono text-[11px] text-text-secondary">
                          {charge.resident?.resident_id} • {charge.hostel?.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-medium text-text-primary">
                      {charge.resident?.current_assignment?.room?.room_number
                        ? `Room ${charge.resident.current_assignment.room.room_number}`
                        : '—'}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {charge.resident?.current_assignment?.bed?.bed_number
                        ? `Bed ${charge.resident.current_assignment.bed.bed_number}`
                        : ''}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 text-text-secondary">{formatDate(charge.due_date)}</td>

                  <td className="py-3.5 px-4 font-bold text-text-primary">
                    {formatCurrency(charge.amount_due)}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-emerald-600">
                    {formatCurrency(charge.amount_paid)}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-rose-600">
                    {formatCurrency(charge.remaining_amount)}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={charge.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {charge.remaining_amount > 0 ? (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => handleOpenRecordPayment(charge)}
                        className="text-xs h-8 px-3"
                      >
                        Record Pay
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Monthly Fees Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        maxWidth="md"
        title="Batch Generate Monthly Fees"
        description="Creates monthly fee charge entries for all active residents in the chosen hostel"
      >
        <div className="space-y-4 pt-2">
          {genResult && (
            <div
              className={`p-3 text-xs rounded-xl border ${
                genResult.startsWith('Error')
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {genResult}
            </div>
          )}

          <Select
            label="Hostel"
            required
            value={genHostelId}
            onChange={(e) => setGenHostelId(e.target.value)}
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>

          <Input
            label="Target Fee Month (YYYY-MM)"
            type="month"
            required
            value={genMonth}
            onChange={(e) => setGenMonth(e.target.value)}
          />

          <p className="text-[11px] text-text-secondary bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong>Duplicate Protection:</strong> If a resident already has a fee charge for this month, the system automatically skips them without creating duplicates.
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateFees}
              isLoading={isGenerating}
            >
              Run Batch Generation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      {selectedCharge && (
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          maxWidth="md"
          title="Record Payment & Issue Receipt"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
            {payError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            {/* Resident & Billing Summary Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Resident:</span>
                <span className="font-bold text-text-primary">
                  {selectedCharge.resident?.full_name} ({selectedCharge.resident?.resident_id})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Billing Period:</span>
                <span className="font-semibold text-text-primary">
                  {formatFeeMonth(selectedCharge.fee_month)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Due:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(selectedCharge.amount_due)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-bold text-rose-600">
                <span>Remaining Balance:</span>
                <span>{formatCurrency(selectedCharge.remaining_amount)}</span>
              </div>
            </div>

            <Input
              label="Payment Amount (PKR)"
              type="number"
              required
              min={1}
              max={selectedCharge.remaining_amount}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Payment Method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other / Cheque</option>
              </Select>

              <Input
                label="Payment Date"
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>

            <Input
              label="Notes (Optional)"
              placeholder="e.g. Paid via Online Banking transfer ref #1234"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="teal" size="sm" type="submit" isLoading={isRecording}>
                Record Payment & Issue Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
