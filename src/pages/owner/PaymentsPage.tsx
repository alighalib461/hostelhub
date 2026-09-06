import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { paymentsService } from '../../services/payments/paymentsService'
import { feesService } from '../../services/fees/feesService'
import { PaymentWithDetails, ReceiptData, FeeChargeWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { SearchBar } from '../../components/shared/SearchBar'
import { ReceiptModal } from '../../components/shared/ReceiptModal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  getCurrentFeeMonth,
} from '../../utils/formatters'
import confetti from 'canvas-confetti'
import {
  Receipt,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Eye,
  Ban,
  CheckCircle,
  CreditCard,
  Building,
} from 'lucide-react'

export const PaymentsPage: React.FC = () => {
  const { selectedHostelId, hostels } = useHostelContext()

  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'voided'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Void Payment Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false)
  const [paymentToVoid, setPaymentToVoid] = useState<PaymentWithDetails | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)

  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [unpaidCharges, setUnpaidCharges] = useState<FeeChargeWithDetails[]>([])
  const [selectedChargeId, setSelectedChargeId] = useState('')
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNotes, setPayNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [selectedHostelId, statusFilter, searchTerm])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const data = await paymentsService.getPayments({
        hostelId: selectedHostelId,
        status: statusFilter,
        search: searchTerm,
      })
      setPayments(data)
    } catch (err) {
      console.error('Failed to load payments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenRecordPayment = async () => {
    setRecordError(null)
    setIsRecordModalOpen(true)
    try {
      const charges = await feesService.getFeeCharges({
        hostelId: selectedHostelId,
      })
      const unpaid = charges.filter((c) => c.remaining_amount > 0)
      setUnpaidCharges(unpaid)
      if (unpaid.length > 0) {
        setSelectedChargeId(unpaid[0].id)
        setPayAmount(unpaid[0].remaining_amount)
      }
    } catch (err) {
      console.error('Failed to load unpaid charges:', err)
    }
  }

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChargeId) return
    setRecordError(null)
    setIsRecording(true)

    try {
      const result = await paymentsService.recordPayment({
        fee_charge_id: selectedChargeId,
        amount: Number(payAmount),
        payment_method: payMethod,
        payment_date: payDate,
        notes: payNotes,
      })

      confetti({ particleCount: 80, spread: 70 })
      setIsRecordModalOpen(false)
      loadPayments()

      // Immediately open receipt
      if (result?.payment_id) {
        handleViewReceipt(result.payment_id)
      }
    } catch (err: unknown) {
      setRecordError((err as { message?: string })?.message || 'Failed to record payment.')
    } finally {
      setIsRecording(false)
    }
  }

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const data = await paymentsService.getReceiptData(paymentId)
      if (data) {
        setSelectedReceipt(data)
        setIsReceiptModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to load receipt:', err)
    }
  }

  const handleOpenVoidModal = (payment: PaymentWithDetails) => {
    setPaymentToVoid(payment)
    setVoidReason('')
    setIsVoidModalOpen(true)
  }

  const handleConfirmVoid = async () => {
    if (!paymentToVoid || !voidReason.trim()) return
    setIsVoiding(true)
    try {
      await paymentsService.voidPayment(paymentToVoid.id, voidReason)
      setIsVoidModalOpen(false)
      loadPayments()
    } catch (err) {
      console.error('Failed to void payment:', err)
    } finally {
      setIsVoiding(false)
    }
  }

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const selectedChargeObj = unpaidCharges.find((c) => c.id === selectedChargeId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Payments & Receipts Ledger
          </h2>
          <p className="text-xs text-text-secondary">
            Immutable transaction history, official receipts with verification, and audited voids
          </p>
        </div>

        <Button
          variant="teal"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={handleOpenRecordPayment}
        >
          Record New Payment
        </Button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-text-secondary font-medium">Total Transactions</span>
          <p className="text-xl font-bold text-text-primary mt-1">{payments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-emerald-800 font-medium">Total Valid Collection</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-xs text-rose-800 font-medium">Voided Transactions</span>
          <p className="text-xl font-bold text-rose-600 mt-1">
            {payments.filter((p) => p.status === 'voided').length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by receipt number, resident name, or ID..."
          className="max-w-md"
        />

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'paid', 'voided'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
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

      {/* Ledger Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payment transactions found"
          description="Record your first resident payment to generate a digital receipt."
          icon={<Receipt className="w-8 h-8" />}
          actionLabel="Record Payment"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={handleOpenRecordPayment}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Resident</th>
                <th className="py-3.5 px-4">Billing Month</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => {
                const isVoided = p.status === 'voided'
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isVoided ? 'bg-rose-50/20 opacity-80' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-brand">
                      {p.receipt_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-text-primary text-sm">
                        {p.resident?.full_name || 'Resident'}
                      </p>
                      <p className="font-mono text-[11px] text-text-secondary">
                        {p.resident?.resident_id} • {p.hostel?.name}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      {formatFeeMonth(p.fee_charge?.fee_month)}
                    </td>

                    <td className="py-3.5 px-4 text-text-secondary">{formatDate(p.payment_date)}</td>

                    <td className="py-3.5 px-4 capitalize">{p.payment_method?.replace('_', ' ')}</td>

                    <td
                      className={`py-3.5 px-4 font-bold text-sm ${
                        isVoided ? 'text-slate-400 line-through' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(p.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs h-8 px-2.5"
                      >
                        Receipt
                      </Button>

                      {!isVoided && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenVoidModal(p)}
                          className="text-xs h-8 px-2 text-rose-600 hover:bg-rose-50"
                          title="Void payment and restore balance"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        maxWidth="md"
        title="Record Payment"
        description="Select resident fee charge, enter payment amount, and issue digital receipt"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 pt-2">
          {recordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{recordError}</span>
            </div>
          )}

          <Select
            label="Select Pending Resident Fee Charge"
            required
            value={selectedChargeId}
            onChange={(e) => {
              setSelectedChargeId(e.target.value)
              const c = unpaidCharges.find((item) => item.id === e.target.value)
              if (c) setPayAmount(c.remaining_amount)
            }}
          >
            {unpaidCharges.length === 0 && <option value="">No outstanding fees</option>}
            {unpaidCharges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.resident?.full_name} ({c.resident?.resident_id}) — {formatFeeMonth(c.fee_month)} [Due: {formatCurrency(c.remaining_amount)}]
              </option>
            ))}
          </Select>

          {selectedChargeObj && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Resident:</span>
                <span className="font-bold text-text-primary">{selectedChargeObj.resident?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Due for Month:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(selectedChargeObj.amount_due)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-rose-600">
                <span>Remaining to Pay:</span>
                <span>{formatCurrency(selectedChargeObj.remaining_amount)}</span>
              </div>
            </div>
          )}

          <Input
            label="Payment Amount (PKR)"
            type="number"
            required
            min={1}
            max={selectedChargeObj?.remaining_amount || 999999}
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
              <option value="other">Other</option>
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
            label="Notes / Ref (Optional)"
            placeholder="e.g. Received by Admin / Bank transaction ID"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              size="sm"
              type="submit"
              disabled={!selectedChargeId || unpaidCharges.length === 0}
              isLoading={isRecording}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void Payment Modal */}
      {paymentToVoid && (
        <Modal
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          maxWidth="sm"
          title="Void Payment Receipt"
          description={`Are you sure you want to void receipt #${paymentToVoid.receipt_number}?`}
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold">Important Audit Notice:</p>
              <p>Voiding will safely restore the resident's fee balance to pending/partial and preserve full audit history. The receipt number will not be deleted or reused.</p>
            </div>

            <Input
              label="Reason for Voiding"
              required
              placeholder="e.g. Cheque bounced / Incorrect amount entered by cashier"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsVoidModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmVoid}
                disabled={!voidReason.trim()}
                isLoading={isVoiding}
              >
                Confirm Void
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt View Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  )
}
