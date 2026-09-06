import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { residentsService } from '../../services/residents/residentsService'
import { storageService } from '../../services/storage/storageService'
import { roomsService } from '../../services/rooms/roomsService'
import { paymentsService } from '../../services/payments/paymentsService'
import { ResidentWithDetails, ReceiptData } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Tabs } from '../../components/ui/Tabs'
import { Modal } from '../../components/ui/Modal'
import { BedSelector } from '../../components/shared/BedSelector'
import { ReceiptModal } from '../../components/shared/ReceiptModal'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  formatCNIC,
  formatPhone,
} from '../../utils/formatters'
import {
  User,
  Phone,
  CreditCard,
  Building,
  Bed,
  FileText,
  Receipt,
  ArrowLeft,
  Calendar,
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react'

export const ResidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Signed document URLs
  const [cnicFrontUrl, setCnicFrontUrl] = useState<string | null>(null)
  const [cnicBackUrl, setCnicBackUrl] = useState<string | null>(null)

  // Bed Reassignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [newBedId, setNewBedId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  useEffect(() => {
    if (id) loadResidentDetails(id)
  }, [id])

  const loadResidentDetails = async (residentId: string) => {
    setIsLoading(true)
    try {
      const data = await residentsService.getResidentById(residentId)
      setResident(data)

      // Fetch signed URLs for documents if present
      if (data?.documents) {
        const frontDoc = data.documents.find((d) => d.document_type === 'cnic_front')
        const backDoc = data.documents.find((d) => d.document_type === 'cnic_back')

        if (frontDoc) {
          storageService
            .getSignedUrl('resident-documents', frontDoc.storage_path)
            .then(setCnicFrontUrl)
        }
        if (backDoc) {
          storageService
            .getSignedUrl('resident-documents', backDoc.storage_path)
            .then(setCnicBackUrl)
        }
      }
    } catch (err) {
      console.error('Failed to load resident:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBedReassignment = async () => {
    if (!resident || !newBedId) return
    setIsAssigning(true)
    try {
      await roomsService.assignBed(resident.id, newBedId)
      setIsAssignModalOpen(false)
      loadResidentDetails(resident.id)
    } catch (err) {
      console.error('Failed to reassign bed:', err)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!resident) return
    const newStatus = resident.status === 'active' ? 'left' : 'active'
    try {
      await residentsService.updateResident(resident.id, { status: newStatus })
      loadResidentDetails(resident.id)
    } catch (err) {
      console.error('Failed to update status:', err)
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
      console.error('Failed to get receipt data:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="bg-white p-12 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold">Resident Not Found</h3>
        <Button variant="primary" size="sm" onClick={() => navigate('/app/residents')}>
          Back to Residents
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'assignment', label: 'Room & Bed', icon: <Bed className="w-4 h-4" /> },
    { id: 'fees', label: 'Fee History', icon: <CreditCard className="w-4 h-4" />, badge: resident.fee_charges?.length },
    { id: 'payments', label: 'Payments & Receipts', icon: <Receipt className="w-4 h-4" />, badge: resident.payments?.length },
    { id: 'documents', label: 'CNIC & Docs', icon: <FileText className="w-4 h-4" />, badge: resident.documents?.length },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/app/residents')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Resident Directory</span>
      </button>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-xl flex items-center justify-center shrink-0 border border-blue-200">
            {resident.full_name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {resident.full_name}
              </h2>
              <StatusBadge status={resident.status} />
            </div>
            <p className="font-mono text-xs text-text-secondary flex items-center gap-2">
              <span className="font-semibold text-blue-brand">{resident.resident_id}</span>
              <span>•</span>
              <span>Hostel: {resident.hostel?.name || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant={resident.status === 'active' ? 'outline' : 'success'}
            size="sm"
            onClick={handleStatusToggle}
          >
            {resident.status === 'active' ? 'Mark as Left' : 'Reactivate Resident'}
          </Button>
          <Button
            variant="teal"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/app/payments')}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview & Personal Details */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-brand" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-text-secondary font-medium">Full Name</p>
                <p className="font-bold text-text-primary text-sm mt-0.5">{resident.full_name}</p>
              </div>
              <div>
                <p className="text-text-secondary font-medium">Father's Name</p>
                <p className="font-semibold text-text-primary mt-0.5">{resident.father_name}</p>
              </div>
              <div>
                <p className="text-text-secondary font-medium">CNIC Number</p>
                <p className="font-mono font-semibold text-text-primary mt-0.5">
                  {formatCNIC(resident.cnic)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary font-medium">Phone</p>
                <p className="font-semibold text-text-primary mt-0.5">{formatPhone(resident.phone)}</p>
              </div>
            </div>

            <div className="pt-2 text-xs">
              <p className="text-text-secondary font-medium">Permanent Address</p>
              <p className="font-semibold text-text-primary mt-0.5">{resident.permanent_address}</p>
            </div>
          </div>

          {/* Emergency Contact & Financial Quick Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Phone className="w-4 h-4 text-teal-accent" />
                <span>Emergency Contact</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-text-secondary font-medium">Contact Person</p>
                  <p className="font-bold text-text-primary mt-0.5">{resident.emergency_contact_name}</p>
                </div>
                <div>
                  <p className="text-text-secondary font-medium">Contact Phone</p>
                  <p className="font-semibold text-text-primary mt-0.5">
                    {formatPhone(resident.emergency_contact_phone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Financial Overview</span>
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-text-secondary font-medium">Monthly Fee</span>
                  <p className="font-bold text-text-primary mt-1">{formatCurrency(resident.monthly_fee)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-text-secondary font-medium">Deposit</span>
                  <p className="font-bold text-text-primary mt-1">{formatCurrency(resident.security_deposit)}</p>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200/80">
                  <span className="text-rose-800 font-medium">Current Due</span>
                  <p className="font-bold text-rose-700 mt-1">{formatCurrency(resident.current_month_balance)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Room & Bed Assignment */}
      {activeTab === 'assignment' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Current Room & Bed</h3>
              <p className="text-xs text-text-secondary">Track physical accommodation & assignment history</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
              Change / Reassign Bed
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-xs text-text-secondary font-medium">Hostel Name</span>
              <p className="text-base font-bold text-text-primary">{resident.hostel?.name || '—'}</p>
              <p className="text-xs text-slate-400">{resident.hostel?.address}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200/80 space-y-1">
              <span className="text-xs text-blue-900 font-medium">Assigned Room</span>
              <p className="text-xl font-bold text-blue-brand">
                {resident.current_assignment?.room?.room_number
                  ? `Room ${resident.current_assignment.room.room_number}`
                  : 'No Room Assigned'}
              </p>
              <p className="text-xs text-blue-700">
                Capacity: {resident.current_assignment?.room?.capacity || 0} beds
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-1">
              <span className="text-xs text-emerald-900 font-medium">Assigned Bed</span>
              <p className="text-xl font-bold text-emerald-700">
                {resident.current_assignment?.bed?.bed_number
                  ? `Bed ${resident.current_assignment.bed.bed_number}`
                  : 'No Bed Assigned'}
              </p>
              <p className="text-xs text-emerald-800">
                Since: {formatDate(resident.current_assignment?.start_date || resident.admission_date)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Fee Ledger */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Monthly Fee Charges</h3>
              <p className="text-xs text-text-secondary">Historical billing records generated for this resident</p>
            </div>
          </div>

          {(resident.fee_charges || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-text-secondary">No fee charges recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(resident.fee_charges || []).map((f) => {
                    const remaining = Math.max(0, f.amount_due - f.amount_paid)
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {formatFeeMonth(f.fee_month)}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{formatDate(f.due_date)}</td>
                        <td className="py-3 px-4 font-semibold text-text-primary">
                          {formatCurrency(f.amount_due)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">
                          {formatCurrency(f.amount_paid)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-600">
                          {formatCurrency(remaining)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={f.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Payment Transactions</h3>
            <Button
              variant="teal"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/app/payments')}
            >
              Record Payment
            </Button>
          </div>

          {(resident.payments || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-text-secondary">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(resident.payments || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-blue-brand">
                        {p.receipt_number}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(p.id)}
                          className="text-xs h-7 px-2.5"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: CNIC Documents & Verified Storage */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">Verified Identity Documents</h3>
            <p className="text-xs text-text-secondary">
              Securely stored in encrypted private Supabase Storage buckets with short-lived signed URLs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* CNIC Front */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  CNIC Front Side
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              {cnicFrontUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-black/5 flex items-center justify-center">
                  <img src={cnicFrontUrl} alt="CNIC Front" className="w-full h-auto object-contain" />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No CNIC front image uploaded.
                </div>
              )}
            </div>

            {/* CNIC Back */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  CNIC Back Side
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              {cnicBackUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-black/5 flex items-center justify-center">
                  <img src={cnicBackUrl} alt="CNIC Back" className="w-full h-auto object-contain" />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No CNIC back image uploaded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bed Reassignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        maxWidth="lg"
        title="Reassign Bed"
        description={`Select a new available bed for ${resident.full_name}`}
      >
        <div className="space-y-4 pt-2">
          <BedSelector
            hostelId={resident.hostel_id}
            selectedBedId={newBedId}
            onChange={(bedId) => setNewBedId(bedId)}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBedReassignment}
              disabled={!newBedId}
              isLoading={isAssigning}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
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
