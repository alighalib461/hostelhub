import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  getCurrentFeeMonth,
} from '../../utils/formatters'
import {
  Building2,
  Bed,
  CreditCard,
  Receipt,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  KeyRound,
} from 'lucide-react'

export const ResidentDashboardPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Linking State
  const [linkInput, setLinkInput] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currentMonth = getCurrentFeeMonth()

  useEffect(() => {
    loadResidentData()
  }, [])

  const loadResidentData = async () => {
    setIsLoading(true)
    try {
      const data = await residentsService.getResidentForCurrentUser()
      setResident(data)
    } catch (err) {
      console.error('Failed to load resident data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkInput.trim()) return

    setIsLinking(true)
    setLinkMessage(null)

    try {
      const result = await residentsService.linkResidentAccount(linkInput.trim())
      setLinkMessage({
        type: 'success',
        text: `Successfully linked record for ${result.full_name} (${result.resident_code})!`,
      })
      setLinkInput('')
      await refreshProfile()
      await loadResidentData()
    } catch (err: unknown) {
      setLinkMessage({
        type: 'error',
        text: (err as { message?: string })?.message || 'Failed to link resident record. Please verify your details.',
      })
    } finally {
      setIsLinking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const room = resident?.current_assignment?.room
  const bed = resident?.current_assignment?.bed
  const currentFee = (resident?.fee_charges || []).find((f) => f.fee_month === currentMonth)
  const remaining = currentFee ? Math.max(0, currentFee.amount_due - currentFee.amount_paid) : 0
  const recentPayment = (resident?.payments || [])[0]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-primary to-navy-dark text-white p-6 rounded-2xl shadow-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-brand/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Resident Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {resident?.full_name || profile?.full_name || 'Resident'} 👋
          </h2>
          <p className="text-xs text-slate-300">
            {resident ? (
              <span>
                Resident ID: <strong className="text-white font-mono">{resident.resident_id}</strong> • Assigned to{' '}
                <strong className="text-white">{resident.hostel?.name}</strong>
              </span>
            ) : (
              'Connect your official hostel admission file to access your room details, fees, and receipts'
            )}
          </p>
        </div>
      </div>

      {/* Account Linking Notice (Shown when resident record is not linked yet) */}
      {!resident && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-text-primary">Connect Your Hostel Resident Record</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Enter your <strong>Resident ID</strong> (e.g. <code>RES-000004</code>), <strong>CNIC Number</strong>, or <strong>registered phone number</strong> given during hostel admission.
              </p>
            </div>
          </div>

          {linkMessage && (
            <div
              className={`p-3 border text-xs rounded-xl flex items-start gap-2 ${
                linkMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {linkMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{linkMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleLinkRecord} className="flex flex-col sm:flex-row gap-3 pt-1">
            <Input
              placeholder="e.g. RES-000004 or 13102-0405024-1 or 03095923110"
              required
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="flex-1"
              leftIcon={<KeyRound className="w-4 h-4" />}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLinking}
              disabled={!linkInput.trim()}
              className="whitespace-nowrap"
            >
              Link Record
            </Button>
          </form>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Accommodation Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              My Accommodation
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-brand flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">
              {room?.room_number ? `Room ${room.room_number}` : 'No Room Assigned'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {bed?.bed_number ? `Bed: ${bed.bed_number}` : 'Awaiting assignment'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/resident/hostel')}
            className="w-full text-xs justify-between"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Hostel Details
          </Button>
        </div>

        {/* Current Fee Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Current Billing ({formatFeeMonth(currentMonth)})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">
              {formatCurrency(currentFee?.amount_due || resident?.monthly_fee || 0)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Remaining: {formatCurrency(remaining)}
              </span>
              {currentFee && <StatusBadge status={currentFee.status} />}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/resident/fees')}
            className="w-full text-xs justify-between"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Fee Breakdown
          </Button>
        </div>

        {/* Last Payment Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Recent Payment
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            {recentPayment ? (
              <>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(recentPayment.amount)}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Receipt: <span className="font-mono font-bold text-text-primary">{recentPayment.receipt_number}</span> on {formatDate(recentPayment.payment_date)}
                </p>
              </>
            ) : (
              <p className="text-xs text-text-secondary py-2">No payment transactions recorded yet.</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/resident/receipts')}
            className="w-full text-xs justify-between"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All Receipts
          </Button>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Hostel', path: '/resident/hostel', icon: <Building2 className="w-5 h-5 text-blue-brand" /> },
          { label: 'Fee History', path: '/resident/fees', icon: <CreditCard className="w-5 h-5 text-emerald-600" /> },
          { label: 'Receipts', path: '/resident/receipts', icon: <Receipt className="w-5 h-5 text-teal-600" /> },
          { label: 'Verified Docs', path: '/resident/documents', icon: <FileText className="w-5 h-5 text-amber-600" /> },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.path)}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-slate-50">{item.icon}</div>
            <span className="text-xs font-bold text-text-primary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
