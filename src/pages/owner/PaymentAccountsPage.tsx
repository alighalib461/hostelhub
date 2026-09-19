import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { paymentAccountsService } from '../../services/paymentAccounts/paymentAccountsService'
import { PaymentAccount } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  CreditCard,
  PlusCircle,
  Building,
  Landmark,
  Smartphone,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'

export const PaymentAccountsPage: React.FC = () => {
  const { hostels, selectedHostelId, selectedHostel } = useHostelContext()

  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [targetHostelId, setTargetHostelId] = useState('')
  const [accountType, setAccountType] = useState<'bank' | 'easypaisa' | 'jazzcash'>('bank')
  const [bankName, setBankName] = useState('')
  const [accountTitle, setAccountTitle] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [iban, setIban] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeHostelId =
    selectedHostelId !== 'all' ? selectedHostelId : hostels.length > 0 ? hostels[0].id : ''

  useEffect(() => {
    if (activeHostelId) {
      loadAccounts(activeHostelId)
    }
  }, [selectedHostelId, hostels])

  const loadAccounts = async (hostelId: string) => {
    setIsLoading(true)
    try {
      const data = await paymentAccountsService.getPaymentAccounts(hostelId)
      setAccounts(data)
    } catch (err) {
      console.error('Failed to load payment accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setTargetHostelId(activeHostelId)
    setAccountType('bank')
    setBankName('')
    setAccountTitle('')
    setAccountNumber('')
    setIban('')
    setInstructions('')
    setIsActive(true)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (acc: PaymentAccount) => {
    setEditingId(acc.id)
    setTargetHostelId(acc.hostel_id)
    setAccountType(acc.account_type)
    setBankName(acc.bank_name || '')
    setAccountTitle(acc.account_title)
    setAccountNumber(acc.account_number)
    setIban(acc.iban || '')
    setInstructions(acc.instructions || '')
    setIsActive(acc.is_active)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountTitle.trim() || !accountNumber.trim()) {
      setFormError('Account title and account/mobile number are required.')
      return
    }

    if (accountType === 'bank' && !bankName.trim()) {
      setFormError('Bank name is required for bank accounts.')
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      if (editingId) {
        await paymentAccountsService.updatePaymentAccount(editingId, {
          account_type: accountType,
          bank_name: accountType === 'bank' ? bankName.trim() : null,
          account_title: accountTitle.trim(),
          account_number: accountNumber.trim(),
          iban: accountType === 'bank' && iban.trim() ? iban.trim() : null,
          instructions: instructions.trim() || null,
          is_active: isActive,
        })
      } else {
        await paymentAccountsService.createPaymentAccount({
          hostel_id: targetHostelId,
          account_type: accountType,
          bank_name: accountType === 'bank' ? bankName.trim() : null,
          account_title: accountTitle.trim(),
          account_number: accountNumber.trim(),
          iban: accountType === 'bank' && iban.trim() ? iban.trim() : null,
          instructions: instructions.trim() || null,
          is_active: isActive,
        })
      }
      setIsModalOpen(false)
      loadAccounts(targetHostelId)
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message || 'Failed to save payment account.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (acc: PaymentAccount) => {
    try {
      await paymentAccountsService.updatePaymentAccount(acc.id, {
        is_active: !acc.is_active,
      })
      loadAccounts(activeHostelId)
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const handleDelete = async (acc: PaymentAccount) => {
    if (!window.confirm(`Are you sure you want to delete the ${acc.account_title} account?`)) return
    try {
      await paymentAccountsService.deletePaymentAccount(acc.id)
      loadAccounts(activeHostelId)
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Hostel Payment Accounts
          </h2>
          <p className="text-xs text-slate-500">
            Configure Bank Transfer, Easypaisa, and JazzCash payment instructions for{' '}
            <strong>{selectedHostel ? selectedHostel.name : 'your hostels'}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Payment Account
        </Button>
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title="No payment accounts configured"
          description="Add your hostel Bank Account, Easypaisa, or JazzCash details so residents can submit verified online fees."
          actionLabel="Add Payment Account"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isBank = acc.account_type === 'bank'
            const isEasypaisa = acc.account_type === 'easypaisa'
            const isJazzcash = acc.account_type === 'jazzcash'

            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          isBank
                            ? 'bg-blue-50 text-[#2563EB]'
                            : isEasypaisa
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isBank ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#172033]">{acc.account_title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {isBank ? acc.bank_name || 'Bank Account' : acc.account_type}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(acc)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        acc.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        {isBank ? 'Account Number' : 'Mobile Number'}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#172033]">{acc.account_number}</span>
                        <button
                          onClick={() => handleCopy(acc.account_number, acc.id + '-num')}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === acc.id + '-num' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isBank && acc.iban && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">IBAN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#172033] text-[11px]">{acc.iban}</span>
                          <button
                            onClick={() => handleCopy(acc.iban!, acc.id + '-iban')}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {copiedId === acc.id + '-iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {acc.instructions && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 italic">
                        {acc.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEdit(acc)}
                    className="text-xs h-8"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                    onClick={() => handleDelete(acc)}
                    className="text-xs h-8 text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Payment Account' : 'Add New Payment Account'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Hostel Property"
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

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Payment Method Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bank', label: 'Bank Account' },
                { id: 'easypaisa', label: 'Easypaisa' },
                { id: 'jazzcash', label: 'JazzCash' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccountType(opt.id as typeof accountType)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    accountType === opt.id
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {accountType === 'bank' && (
            <Input
              label="Bank Name"
              placeholder="e.g. Meezan Bank / HBL / UBL"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          )}

          <Input
            label="Account Title"
            placeholder="e.g. Al-Razi Boys Hostel / Ali Raza"
            required
            value={accountTitle}
            onChange={(e) => setAccountTitle(e.target.value)}
          />

          <Input
            label={accountType === 'bank' ? 'Account Number' : 'Mobile Wallet Number'}
            placeholder={accountType === 'bank' ? '01020304050607' : '0300-1234567'}
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />

          {accountType === 'bank' && (
            <Input
              label="IBAN (Optional)"
              placeholder="PK36MEZN0001020304050607"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Payment Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Please mention your Resident ID in transfer remarks..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-[#172033]">
              Active for resident payment submissions
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              {editingId ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
