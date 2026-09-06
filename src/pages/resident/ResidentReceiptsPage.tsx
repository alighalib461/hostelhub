import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { paymentsService } from '../../services/payments/paymentsService'
import { ResidentWithDetails, ReceiptData } from '../../types/models'
import { ReceiptModal } from '../../components/shared/ReceiptModal'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, formatFeeMonth } from '../../utils/formatters'
import { Receipt, Eye, Download, ShieldCheck } from 'lucide-react'

export const ResidentReceiptsPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then(setResident)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleOpenReceipt = async (paymentId: string) => {
    try {
      const data = await paymentsService.getReceiptData(paymentId)
      if (data) {
        setSelectedReceipt(data)
        setIsReceiptModalOpen(true)
      }
    } catch (err) {
      console.error('Error fetching receipt:', err)
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const payments = resident?.payments || []

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Payment Receipts
        </h2>
        <p className="text-xs text-text-secondary">
          Official authenticated digital payment receipts issued by your hostel administration
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-text-secondary">
          No payment receipts issued yet.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-accent flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-brand text-sm">
                      {p.receipt_number}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Paid via <span className="capitalize">{p.payment_method?.replace('_', ' ')}</span> on {formatDate(p.payment_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <span className="text-base font-bold text-emerald-700">
                  {formatCurrency(p.amount)}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => handleOpenReceipt(p.id)}
                >
                  View Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
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
