import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, formatFeeMonth } from '../../utils/formatters'
import { CreditCard, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

export const ResidentFeesPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then(setResident)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const feeCharges = resident?.fee_charges || []

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          My Monthly Fees
        </h2>
        <p className="text-xs text-text-secondary">
          Track month-by-month fee invoices, due dates, paid amounts, and remaining balances
        </p>
      </div>

      {feeCharges.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-text-secondary">
          No fee invoices generated yet.
        </div>
      ) : (
        <div className="space-y-3">
          {feeCharges.map((f) => {
            const remaining = Math.max(0, f.amount_due - f.amount_paid)
            return (
              <div
                key={f.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      {formatFeeMonth(f.fee_month)}
                    </h3>
                    <p className="text-xs text-text-secondary">Due by {formatDate(f.due_date)}</p>
                  </div>
                  <StatusBadge status={f.status} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-text-secondary">Total Due</span>
                    <p className="font-bold text-text-primary text-sm mt-0.5">{formatCurrency(f.amount_due)}</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-800">Paid Amount</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatCurrency(f.amount_paid)}</p>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl">
                    <span className="text-rose-800">Remaining</span>
                    <p className="font-bold text-rose-700 text-sm mt-0.5">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
