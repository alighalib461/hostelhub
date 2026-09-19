import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { onlinePaymentsService } from '../../services/onlinePayments/onlinePaymentsService'
import { paymentsService } from '../../services/payments/paymentsService'
import { storageService } from '../../services/storage/storageService'
import {
  OnlinePaymentSubmissionWithDetails,
  ReceiptData,
} from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { ReceiptModal } from '../../components/shared/ReceiptModal'
import { formatCurrency, formatDate, formatFeeMonth } from '../../utils/formatters'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Receipt,
  AlertCircle,
  Building,
  User,
  CreditCard,
  Eye,
  FileImage,
} from 'lucide-react'

export const PaymentVerificationsPage: React.FC = () => {
  const { selectedHostelId } = useHostelContext()

  const [submissions, setSubmissions] = useState<OnlinePaymentSubmissionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending_verification' | 'approved' | 'rejected' | 'all'>('pending_verification')

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedSubmissionForReject, setSelectedSubmissionForReject] = useState<OnlinePaymentSubmissionWithDetails | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectError, setRejectError] = useState<string | null>(null)

  // Proof Image Preview Modal State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [selectedHostelId, statusFilter])

  const loadSubmissions = async () => {
    setIsLoading(true)
    try {
      const data = await onlinePaymentsService.getSubmissions({
        hostelId: selectedHostelId,
        status: statusFilter,
      })
      setSubmissions(data)
    } catch (err) {
      console.error('Failed to load online payment submissions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (sub: OnlinePaymentSubmissionWithDetails) => {
    if (!window.confirm(`Are you sure you want to approve this ${formatCurrency(sub.amount)} payment for ${sub.resident?.full_name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await onlinePaymentsService.approveSubmission(sub.id)
      if (result.payment_id) {
        // Fetch receipt and open receipt viewer
        const receipt = await paymentsService.getReceiptData(result.payment_id)
        if (receipt) {
          setSelectedReceipt(receipt)
          setIsReceiptModalOpen(true)
        }
      }
      loadSubmissions()
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to approve payment.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenReject = (sub: OnlinePaymentSubmissionWithDetails) => {
    setSelectedSubmissionForReject(sub)
    setRejectionReason('')
    setRejectError(null)
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmissionForReject) return
    if (!rejectionReason.trim()) {
      setRejectError('Please specify the reason for rejecting this payment.')
      return
    }

    setIsProcessing(true)
    setRejectError(null)
    try {
      await onlinePaymentsService.rejectSubmission(selectedSubmissionForReject.id, rejectionReason.trim())
      setRejectModalOpen(false)
      loadSubmissions()
    } catch (err: unknown) {
      setRejectError((err as { message?: string })?.message || 'Failed to reject payment.')
    } finally {
      setIsProcessing(false)
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
      console.error('Failed to fetch receipt:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Online Payment Verifications
          </h2>
          <p className="text-xs text-slate-500">
            Verify manual Bank Transfer, Easypaisa, and JazzCash submissions before updating resident balances
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'pending_verification', label: 'Pending Verification', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
          { id: 'approved', label: 'Approved', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
          { id: 'rejected', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5 text-rose-600" /> },
          { id: 'all', label: 'All Submissions', icon: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8" />}
          title={`No ${statusFilter === 'pending_verification' ? 'pending' : ''} online payment submissions`}
          description={
            statusFilter === 'pending_verification'
              ? 'All resident bank transfer and digital wallet payments have been verified.'
              : 'No payment submissions found matching the selected filter.'
          }
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const proofUrl = sub.proof_image_path
              ? storageService.getPublicUrl('resident-documents', sub.proof_image_path) || sub.proof_image_path
              : null

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
              >
                {/* Left Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Tx: {sub.transaction_id}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {sub.payment_method.replace('_', ' ')}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px]">Resident</span>
                      <p className="font-bold text-[#172033] truncate">
                        {sub.resident?.full_name || 'Resident'} ({sub.resident?.resident_id || '—'})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Hostel</span>
                      <p className="font-semibold text-slate-700 truncate">{sub.hostel?.name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Fee Month & Date</span>
                      <p className="font-semibold text-slate-700 truncate">
                        {sub.fee_charge ? formatFeeMonth(sub.fee_charge.fee_month) : '—'} • {formatDate(sub.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Note if rejected */}
                  {sub.status === 'rejected' && sub.rejection_reason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium">
                      Rejection Reason: &ldquo;{sub.rejection_reason}&rdquo;
                    </div>
                  )}
                </div>

                {/* Right Amount & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Submitted Amount</span>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(sub.amount)}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {proofUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileImage className="w-3.5 h-3.5" />}
                        onClick={() => setPreviewImageUrl(proofUrl)}
                        className="text-xs h-8 border-slate-300"
                      >
                        View Proof
                      </Button>
                    )}

                    {sub.status === 'pending_verification' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          onClick={() => handleOpenReject(sub)}
                          className="text-xs h-8 text-rose-700 border-rose-200 hover:bg-rose-50 font-bold"
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="teal"
                          size="sm"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => handleApprove(sub)}
                          className="text-xs h-8 shadow-xs font-bold"
                          disabled={isProcessing}
                        >
                          Approve Payment
                        </Button>
                      </>
                    )}

                    {sub.status === 'approved' && sub.payment_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Receipt className="w-3.5 h-3.5 text-[#2563EB]" />}
                        onClick={() => handleViewReceipt(sub.payment_id!)}
                        className="text-xs h-8 font-semibold"
                      >
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. REJECT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!isProcessing) setRejectModalOpen(false)
        }}
        title="Reject Online Payment Submission"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 pt-1">
          {rejectError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rejectError}</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Please enter a clear explanation for rejecting this transaction (e.g. invalid transaction ID, amount mismatch, or proof unreadable). The resident will receive this reason and can resubmit with corrected details.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Transaction ID was not found in bank statement / Screenshot is blurry..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" type="button" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isProcessing} className="bg-rose-600 hover:bg-rose-700">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. PROOF IMAGE PREVIEW MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(previewImageUrl)}
        onClose={() => setPreviewImageUrl(null)}
        title="Payment Proof Screenshot"
        maxWidth="lg"
      >
        {previewImageUrl && (
          <div className="space-y-4 pt-1">
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-2">
              <img
                src={previewImageUrl}
                alt="Payment Proof"
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="md" onClick={() => setPreviewImageUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  )
}
