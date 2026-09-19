import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { formatCurrency, formatDate, formatFeeMonth } from '../../utils/formatters'
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export const ResidentFeesPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then(setResident)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />

  const feeCharges = resident?.fee_charges || []
  const totalOutstanding = feeCharges.reduce((sum, f) => {
    return sum + Math.max(0, f.amount_due - f.amount_paid)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header with Direct Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            My Monthly Fees
          </h2>
          <p className="text-xs text-text-secondary">
            Track month-by-month fee invoices, due dates, paid amounts, and submit online payment proof
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Smartphone className="w-4 h-4" />}
          onClick={() => navigate('/resident/pay-online')}
          className="shadow-sm font-bold text-xs"
        >
          Pay Online / Submit Proof
        </Button>
      </div>

      {/* Outstanding Summary Banner */}
      {totalOutstanding > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Outstanding Balance: {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-[11px] text-amber-800/80">
                You can pay via Bank Transfer, Easypaisa, or JazzCash and upload proof online.
              </p>
            </div>
          </div>
          <Button
            variant="teal"
            size="sm"
            onClick={() => navigate('/resident/pay-online')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs font-bold shrink-0"
          >
            Pay Now
          </Button>
        </div>
      ) : feeCharges.length > 0 ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All fee invoices are fully cleared. Thank you for your on-time payments!</span>
        </div>
      ) : null}

      {/* Invoice List */}
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={f.status} />
                    {remaining > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/resident/pay-online')}
                        className="text-[11px] h-7 px-2.5 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold hidden sm:inline-flex"
                      >
                        Pay Online
                      </Button>
                    )}
                  </div>
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
