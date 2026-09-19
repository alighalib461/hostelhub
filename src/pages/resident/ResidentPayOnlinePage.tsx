import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { residentsService } from '../../services/residents/residentsService'
import { paymentAccountsService } from '../../services/paymentAccounts/paymentAccountsService'
import { onlinePaymentsService } from '../../services/onlinePayments/onlinePaymentsService'
import { storageService } from '../../services/storage/storageService'
import {
  ResidentWithDetails,
  PaymentAccount,
  OnlinePaymentSubmissionWithDetails,
  FeeCharge,
} from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, formatFeeMonth } from '../../utils/formatters'
import {
  CreditCard,
  Building,
  Landmark,
  Smartphone,
  Check,
  Copy,
  Upload,
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileImage,
} from 'lucide-react'

export const ResidentPayOnlinePage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [submissions, setSubmissions] = useState<OnlinePaymentSubmissionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form State
  const [selectedFeeId, setSelectedFeeId] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [transactionId, setTransactionId] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await residentsService.getResidentForCurrentUser()
      setResident(res)

      if (res) {
        const [accs, subs] = await Promise.all([
          paymentAccountsService.getPaymentAccounts(res.hostel_id, true),
          onlinePaymentsService.getSubmissions({ residentId: res.id }),
        ])
        setAccounts(accs)
        setSubmissions(subs)

        // Pre-select pending fee charge if available
        const pendingFees = (res.fee_charges || []).filter(
          (f) => f.status !== 'paid' && f.status !== 'cancelled'
        )
        if (pendingFees.length > 0) {
          setSelectedFeeId(pendingFees[0].id)
          const rem = Math.max(0, Number(pendingFees[0].amount_due) - Number(pendingFees[0].amount_paid))
          setAmount(rem)
        }

        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load resident payment portal data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeeSelectionChange = (feeId: string) => {
    setSelectedFeeId(feeId)
    const fee = (resident?.fee_charges || []).find((f) => f.id === feeId)
    if (fee) {
      const rem = Math.max(0, Number(fee.amount_due) - Number(fee.amount_paid))
      setAmount(rem)
    }
  }

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveProof = () => {
    setProofFile(null)
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview)
      setProofPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resident || !selectedFeeId || !selectedAccountId || !amount || Number(amount) <= 0 || !transactionId.trim()) {
      setFormError('Please fill in all required payment submission fields.')
      return
    }

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
    if (!selectedAccount) {
      setFormError('Please select a payment account.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      let proofPath: string | null = null
      if (proofFile) {
        const ext = proofFile.name.split('.').pop() || 'jpg'
        const path = `proofs/${resident.id}_${Date.now()}.${ext}`
        const uploadRes = await storageService.uploadFile('resident-documents', path, proofFile)
        proofPath = uploadRes.path
      }

      const paymentMethod =
        selectedAccount.account_type === 'bank'
          ? 'bank_transfer'
          : selectedAccount.account_type

      await onlinePaymentsService.submitOnlinePayment({
        fee_charge_id: selectedFeeId,
        resident_id: resident.id,
        hostel_id: resident.hostel_id,
        payment_account_id: selectedAccount.id,
        amount: Number(amount),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        proof_image_path: proofPath,
      })

      setSuccessMsg('Payment submitted successfully! It is now Pending Verification by hostel management.')
      setTransactionId('')
      handleRemoveProof()
      await loadData()
      setTimeout(() => setSuccessMsg(null), 6000)
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message || 'Failed to submit payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-3xl" />

  if (!resident) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-sm font-bold text-[#172033]">Account Link Required</p>
        <p className="text-xs text-slate-500">
          Please link your admission record from your dashboard before submitting fee payments.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/resident/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  const pendingFees = (resident.fee_charges || []).filter(
    (f) => f.status !== 'paid' && f.status !== 'cancelled'
  )
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-card space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Manual Online Fee Submission</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
          Pay Hostel Fees Online
        </h2>
        <p className="text-xs text-slate-500">
          Transfer fees to your hostel&apos;s bank account or digital wallet and submit your transaction receipt for instant verification.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Accounts & Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Active Hostel Accounts */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
            <span>1. Hostel Payment Accounts</span>
          </h3>

          {accounts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No online payment accounts have been configured by your hostel owner yet. Please contact your warden for cash payments.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const isBank = acc.account_type === 'bank'
                const isSelected = selectedAccountId === acc.id

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-[#2563EB] ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200/90 shadow-card hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                            isBank
                              ? 'bg-blue-50 text-[#2563EB]'
                              : acc.account_type === 'easypaisa'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isBank ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172033]">{acc.account_title}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {isBank ? acc.bank_name || 'Bank Transfer' : acc.account_type}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{isBank ? 'Account No:' : 'Mobile Wallet:'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#172033]">{acc.account_number}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(acc.account_number, acc.id)
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {copiedKey === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isBank && acc.iban && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">IBAN:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#172033] text-[11px]">{acc.iban}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopy(acc.iban!, acc.id + '-iban')
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                            >
                              {copiedKey === acc.id + '-iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {acc.instructions && (
                        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                          {acc.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Step 2: Submission Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
            2. Submit Payment Details
          </h3>

          <form onSubmit={handleSubmitPayment} className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 sm:p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Select
              label="Select Fee Invoice"
              required
              value={selectedFeeId}
              onChange={(e) => handleFeeSelectionChange(e.target.value)}
            >
              {pendingFees.length === 0 ? (
                <option value="">All fees are currently up to date!</option>
              ) : (
                pendingFees.map((f) => {
                  const rem = Math.max(0, Number(f.amount_due) - Number(f.amount_paid))
                  return (
                    <option key={f.id} value={f.id}>
                      {formatFeeMonth(f.fee_month)} • Due: {formatCurrency(f.amount_due)} (Remaining: {formatCurrency(rem)})
                    </option>
                  )
                })
              )}
            </Select>

            <Input
              label="Amount Paid (PKR)"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <Input
              label="Transaction ID / Reference Number"
              placeholder="e.g. 29384729104 or Meezan Bank Tx ID"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />

            {/* Proof Screenshot Attachment */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Payment Screenshot / Receipt (Optional but recommended)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProofSelect}
                className="hidden"
              />

              {proofPreview ? (
                <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden">
                  <img src={proofPreview} alt="Proof" className="w-36 h-28 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveProof}
                    className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-1 text-slate-500 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-[#172033]">Upload Payment Screenshot</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG up to 10MB</span>
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={!selectedFeeId || accounts.length === 0}
              className="w-full justify-center shadow-md font-bold text-sm mt-2"
            >
              Submit for Verification
            </Button>
          </form>
        </div>
      </div>

      {/* Payment Submissions Status History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
            My Online Payment Submissions ({submissions.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#2563EB]">
                      Tx: {sub.transaction_id}
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {sub.payment_method.replace('_', ' ')}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>

                  <p className="text-slate-500">
                    {sub.fee_charge ? formatFeeMonth(sub.fee_charge.fee_month) : 'Fee'} • Submitted {formatDate(sub.created_at)}
                  </p>

                  {sub.status === 'rejected' && sub.rejection_reason && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg font-medium">
                      Rejection Reason: &ldquo;{sub.rejection_reason}&rdquo;
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm sm:text-base font-bold text-emerald-700">
                    {formatCurrency(sub.amount)}
                  </p>
                  {sub.status === 'approved' && sub.payment_id && (
                    <span className="text-[11px] text-blue-600 font-semibold inline-flex items-center gap-1 mt-0.5">
                      <Receipt className="w-3 h-3" /> Official Receipt Generated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
