import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { registrationsService } from '../../services/registrations/registrationsService'
import { storageService } from '../../services/storage/storageService'
import { RegistrationRequestWithDocs } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { EmptyState } from '../../components/shared/EmptyState'
import { BedSelector } from '../../components/shared/BedSelector'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, formatCNIC, formatPhone } from '../../utils/formatters'
import confetti from 'canvas-confetti'
import {
  UserPlus,
  User,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Shield,
  Building,
} from 'lucide-react'

export const RegistrationRequestsPage: React.FC = () => {
  const { selectedHostelId } = useHostelContext()
  const [requests, setRequests] = useState<RegistrationRequestWithDocs[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // Review & Approval Modal state
  const [selectedReq, setSelectedReq] = useState<RegistrationRequestWithDocs | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  // Approval Form fields
  const [approveBedId, setApproveBedId] = useState('')
  const [approveFee, setApproveFee] = useState<number>(15000)
  const [approveDeposit, setApproveDeposit] = useState<number>(5000)
  const [approveDueDay, setApproveDueDay] = useState<number>(5)
  const [isApproving, setIsApproving] = useState(false)

  // Reject reason
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  // Signed document previews
  const [frontDocUrl, setFrontDocUrl] = useState<string | null>(null)
  const [backDocUrl, setBackDocUrl] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [selectedHostelId, statusFilter])

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const data = await registrationsService.getRegistrationRequests({
        hostelId: selectedHostelId,
        status: statusFilter,
      })
      setRequests(data)
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReview = async (req: RegistrationRequestWithDocs) => {
    setSelectedReq(req)
    setIsReviewOpen(true)

    // Fetch signed URLs for documents
    const front = req.documents.find((d) => d.document_type === 'cnic_front')
    const back = req.documents.find((d) => d.document_type === 'cnic_back')

    if (front) {
      storageService.getSignedUrl('resident-documents', front.storage_path).then(setFrontDocUrl)
    }
    if (back) {
      storageService.getSignedUrl('resident-documents', back.storage_path).then(setBackDocUrl)
    }
  }

  const handleApprove = async () => {
    if (!selectedReq || !approveBedId) return
    setIsApproving(true)
    try {
      await registrationsService.approveRegistration({
        request_id: selectedReq.id,
        bed_id: approveBedId,
        monthly_fee: approveFee,
        security_deposit: approveDeposit,
        fee_due_day: approveDueDay,
      })

      confetti({ particleCount: 70, spread: 60 })
      setIsApproveOpen(false)
      setIsReviewOpen(false)
      loadRequests()
    } catch (err) {
      console.error('Approval failed:', err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedReq) return
    setIsRejecting(true)
    try {
      await registrationsService.rejectRegistration(selectedReq.id, rejectReason || 'Did not meet admission criteria')
      setIsRejectOpen(false)
      setIsReviewOpen(false)
      loadRequests()
    } catch (err) {
      console.error('Rejection failed:', err)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Registration Requests
          </h2>
          <p className="text-xs text-text-secondary">
            Review and approve prospective resident applications submitted via public hostel registration link
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
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

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No registration requests"
          description={
            statusFilter === 'pending'
              ? 'There are currently no pending registration requests awaiting approval.'
              : `No requests with status "${statusFilter}".`
          }
          icon={<UserPlus className="w-8 h-8" />}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 font-bold text-base flex items-center justify-center shrink-0">
                  {req.full_name.charAt(0)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-text-primary text-sm sm:text-base truncate">
                      {req.full_name}
                    </h4>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Father: {req.father_name} • Phone: {formatPhone(req.phone)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hostel: <strong className="text-text-primary">{req.hostel?.name}</strong> • Applied on {formatDate(req.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => handleOpenReview(req)}
                >
                  Review Details
                </Button>

                {req.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => {
                        setSelectedReq(req)
                        setIsApproveOpen(true)
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setSelectedReq(req)
                        setIsRejectOpen(true)
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <Modal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          maxWidth="2xl"
          title={`Application Details — ${selectedReq.full_name}`}
        >
          <div className="space-y-6 pt-2">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-text-secondary">Applicant Name</span>
                <p className="font-bold text-text-primary text-sm mt-0.5">{selectedReq.full_name}</p>
              </div>
              <div>
                <span className="text-text-secondary">Father's Name</span>
                <p className="font-semibold text-text-primary mt-0.5">{selectedReq.father_name}</p>
              </div>
              <div>
                <span className="text-text-secondary">CNIC Number</span>
                <p className="font-mono font-semibold text-text-primary mt-0.5">
                  {formatCNIC(selectedReq.cnic)}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Contact Phone</span>
                <p className="font-semibold text-text-primary mt-0.5">{formatPhone(selectedReq.phone)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-text-secondary">Permanent Address</span>
                <p className="font-semibold text-text-primary mt-0.5">{selectedReq.permanent_address}</p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold uppercase tracking-wider text-text-secondary">
                Emergency Contact
              </span>
              <p className="font-semibold text-text-primary">
                {selectedReq.emergency_contact_name} ({formatPhone(selectedReq.emergency_contact_phone)})
              </p>
            </div>

            {/* Uploaded CNIC Previews */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Submitted Documents
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-semibold block mb-2">CNIC Front</span>
                  {frontDocUrl ? (
                    <img src={frontDocUrl} alt="CNIC Front" className="h-36 mx-auto object-contain rounded" />
                  ) : (
                    <span className="text-xs text-slate-400">Not uploaded</span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-semibold block mb-2">CNIC Back</span>
                  {backDocUrl ? (
                    <img src={backDocUrl} alt="CNIC Back" className="h-36 mx-auto object-contain rounded" />
                  ) : (
                    <span className="text-xs text-slate-400">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons in Review Modal */}
            {selectedReq.status === 'pending' && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setIsReviewOpen(false)
                    setIsRejectOpen(true)
                  }}
                >
                  Reject Application
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsReviewOpen(false)
                    setIsApproveOpen(true)
                  }}
                >
                  Proceed to Approve & Assign Bed
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Approval & Bed Assignment Modal */}
      {selectedReq && (
        <Modal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          maxWidth="lg"
          title={`Approve Admission — ${selectedReq.full_name}`}
          description="Select available bed and configure initial billing"
        >
          <div className="space-y-4 pt-2">
            <BedSelector
              hostelId={selectedReq.hostel_id}
              selectedBedId={approveBedId}
              onChange={(bId) => setApproveBedId(bId)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Monthly Fee (PKR)"
                type="number"
                required
                value={approveFee}
                onChange={(e) => setApproveFee(Number(e.target.value))}
              />
              <Input
                label="Security Deposit (PKR)"
                type="number"
                required
                value={approveDeposit}
                onChange={(e) => setApproveDeposit(Number(e.target.value))}
              />
              <Input
                label="Due Day"
                type="number"
                required
                value={approveDueDay}
                onChange={(e) => setApproveDueDay(Number(e.target.value))}
                min={1}
                max={28}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={handleApprove}
                disabled={!approveBedId}
                isLoading={isApproving}
              >
                Approve & Admit Resident
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedReq && (
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          maxWidth="sm"
          title="Reject Application"
        >
          <div className="space-y-4 pt-2">
            <Input
              label="Rejection Reason"
              placeholder="e.g. No vacancy available in requested capacity"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                isLoading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
