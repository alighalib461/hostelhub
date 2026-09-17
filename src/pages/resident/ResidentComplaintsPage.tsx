import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { residentsService } from '../../services/residents/residentsService'
import { complaintsService } from '../../services/complaints/complaintsService'
import { storageService } from '../../services/storage/storageService'
import {
  ResidentWithDetails,
  ComplaintWithDetails,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatters'
import {
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Bed,
  Building2,
  Camera,
  Upload,
  X,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Flame,
  LifeBuoy,
  Info,
} from 'lucide-react'

const CATEGORIES: ComplaintCategory[] = [
  'Electrical',
  'Plumbing',
  'Room / Furniture',
  'Cleaning',
  'Internet / Wi-Fi',
  'Mess / Food',
  'Security',
  'Other',
]

export const ResidentComplaintsPage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithDetails | null>(null)

  // New Complaint Form State
  const [category, setCategory] = useState<ComplaintCategory>('Electrical')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<ComplaintPriority>('normal')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await residentsService.getResidentForCurrentUser()
      setResident(res)

      if (res) {
        const complaintsList = await complaintsService.getComplaints({
          residentId: res.id,
        })
        setComplaints(complaintsList)
      }
    } catch (err) {
      console.error('Failed to load resident complaints:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resident) {
      setFormError('Your resident admission record must be linked first.')
      return
    }

    if (!subject.trim()) {
      setFormError('Please enter a complaint subject.')
      return
    }

    if (!description.trim()) {
      setFormError('Please provide details in the description.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      let photoPath: string | null = null

      // Upload photo if selected
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const cleanName = `complaint_${resident.id}_${Date.now()}.${ext}`
        const storagePath = `complaints/${cleanName}`
        const uploadResult = await storageService.uploadFile('resident-documents', storagePath, photoFile)
        photoPath = uploadResult.path
      }

      await complaintsService.createComplaint({
        resident_id: resident.id,
        hostel_id: resident.hostel_id,
        room_id: resident.current_assignment?.room_id || null,
        bed_id: resident.current_assignment?.bed_id || null,
        category,
        subject,
        description,
        priority,
        photo_path: photoPath,
      })

      setSuccessMessage('Complaint submitted successfully! Our hostel management will attend to it.')
      setIsNewModalOpen(false)
      // Reset form
      setSubject('')
      setDescription('')
      setCategory('Electrical')
      setPriority('normal')
      handleRemovePhoto()

      // Reload complaints
      const updatedList = await complaintsService.getComplaints({ residentId: resident.id })
      setComplaints(updatedList)

      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!resident) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Complaints & Maintenance
          </h2>
          <p className="text-xs text-text-secondary">
            Connect your official hostel admission file to submit maintenance requests
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 shadow-card p-6 space-y-3">
          <p className="text-xs text-text-secondary">
            Please visit your{' '}
            <button
              onClick={() => navigate('/resident/dashboard')}
              className="text-blue-brand underline font-semibold"
            >
              Resident Dashboard
            </button>{' '}
            to link your official admission record with your Resident ID or CNIC.
          </p>
        </div>
      </div>
    )
  }

  const roomNumber = resident.current_assignment?.room?.room_number
  const bedNumber = resident.current_assignment?.bed?.bed_number

  return (
    <div className="space-y-6">
      {/* Top Banner & + New Complaint Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-brand border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Maintenance & Support</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            My Complaints
          </h2>
          <p className="text-xs text-text-secondary">
            Submit and track maintenance requests for Room {roomNumber || '—'} in {resident.hostel?.name}.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            setFormError(null)
            setIsNewModalOpen(true)
          }}
          className="shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
        >
          + New Complaint
        </Button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All (${complaints.length})` },
          {
            id: 'submitted',
            label: `Submitted (${complaints.filter((c) => c.status === 'submitted').length})`,
          },
          {
            id: 'in_progress',
            label: `In Progress (${complaints.filter((c) => c.status === 'in_progress').length})`,
          },
          {
            id: 'resolved',
            label: `Resolved (${complaints.filter((c) => c.status === 'resolved').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as ComplaintStatus | 'all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-blue-brand text-white shadow-xs'
                : 'bg-white text-text-secondary hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="w-8 h-8" />}
          title="No complaints found"
          description={
            statusFilter === 'all'
              ? 'You have not submitted any maintenance requests yet. Tap "+ New Complaint" if anything needs repair.'
              : `No complaints with status "${statusFilter}".`
          }
          actionLabel="+ New Complaint"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover p-5 space-y-3 cursor-pointer transition-all duration-150 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-blue-brand uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {c.category}
                    </span>
                    {c.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <Flame className="w-3 h-3 text-rose-500" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-text-primary group-hover:text-blue-brand transition-colors line-clamp-1">
                    {c.subject}
                  </h3>
                </div>

                <StatusBadge status={c.status} />
              </div>

              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-secondary">
                <span className="font-mono text-[11px]">
                  {c.room ? `Room ${c.room.room_number}` : roomNumber ? `Room ${roomNumber}` : 'Room —'}
                  {c.bed ? ` · Bed ${c.bed.bed_number}` : bedNumber ? ` · Bed ${bedNumber}` : ''}
                </span>
                <span>{formatDate(c.created_at)}</span>
              </div>

              {/* Resolution pill if resolved */}
              {c.status === 'resolved' && c.resolution_note && (
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-1 italic font-medium">
                    Resolution: &ldquo;{c.resolution_note}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CREATE COMPLAINT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsNewModalOpen(false)
            setFormError(null)
          }
        }}
        title="Submit New Complaint"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Auto-Captured Resident Info Card (Read-Only) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Info className="w-4 h-4 text-blue-brand" />
              <span>Auto-Captured Accommodation Information</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-text-secondary">Resident:</span>
                <p className="font-semibold text-text-primary truncate">{resident.full_name}</p>
              </div>
              <div>
                <span className="text-text-secondary">Resident ID:</span>
                <p className="font-semibold text-text-primary font-mono">{resident.resident_id}</p>
              </div>
              <div>
                <span className="text-text-secondary">Hostel:</span>
                <p className="font-semibold text-text-primary truncate">{resident.hostel?.name || '—'}</p>
              </div>
              <div>
                <span className="text-text-secondary">Room:</span>
                <p className="font-semibold text-text-primary">
                  {roomNumber ? `Room ${roomNumber}` : 'Not Assigned'}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Bed Spot:</span>
                <p className="font-semibold text-text-primary">
                  {bedNumber ? `Bed ${bedNumber}` : 'Not Assigned'}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Date:</span>
                <p className="font-semibold text-text-primary">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Complaint Category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            />

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    priority === 'normal'
                      ? 'bg-blue-50 border-blue-500 text-blue-brand shadow-xs'
                      : 'bg-white border-slate-200 text-text-secondary hover:bg-slate-50'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    priority === 'urgent'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                      : 'bg-white border-slate-200 text-text-secondary hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Urgent
                </button>
              </div>
            </div>
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            required
            placeholder="e.g. Ceiling fan regulator not working / Wi-Fi disconnected"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the maintenance issue, location in the room, or any specific symptoms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none shadow-2xs"
            />
          </div>

          {/* Photo / Attachment (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Photo / Attachment (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <img
                  src={photoPreview}
                  alt="Attachment Preview"
                  className="w-36 h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-1.5 text-text-secondary transition-all cursor-pointer"
              >
                <div className="p-2 bg-slate-100 rounded-full text-slate-600">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-text-primary">
                  Upload Photo or Take Picture
                </span>
                <span className="text-[10px] text-text-muted">JPG, PNG up to 10MB</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsNewModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. COMPLAINT DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        maxWidth="lg"
      >
        {selectedComplaint && (
          <div className="space-y-5">
            {/* Header / Badges */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-brand bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {selectedComplaint.complaint_code}
                  </span>
                  <span className="text-xs font-semibold text-text-secondary">
                    {selectedComplaint.category}
                  </span>
                  {selectedComplaint.priority === 'urgent' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <Flame className="w-3 h-3 text-rose-500" />
                      Urgent
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  {selectedComplaint.subject}
                </h3>
              </div>

              <StatusBadge status={selectedComplaint.status} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Hostel
                </span>
                <p className="font-bold text-text-primary mt-0.5 truncate">
                  {selectedComplaint.hostel?.name || resident.hostel?.name || '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Room & Bed
                </span>
                <p className="font-bold text-text-primary mt-0.5">
                  {selectedComplaint.room?.room_number
                    ? `Room ${selectedComplaint.room.room_number}`
                    : roomNumber
                    ? `Room ${roomNumber}`
                    : '—'}
                  {selectedComplaint.bed?.bed_number
                    ? ` · ${selectedComplaint.bed.bed_number}`
                    : bedNumber
                    ? ` · ${bedNumber}`
                    : ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Submitted On
                </span>
                <p className="font-bold text-text-primary mt-0.5">
                  {formatDate(selectedComplaint.created_at)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Status
                </span>
                <p className="font-bold text-text-primary mt-0.5 capitalize">
                  {selectedComplaint.status.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Description
              </span>
              <p className="text-xs text-text-secondary leading-relaxed bg-white border border-slate-200 rounded-xl p-3.5 whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {selectedComplaint.photo_path && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Attached Photo
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-w-sm">
                  <img
                    src={storageService.getPublicUrl('resident-documents', selectedComplaint.photo_path) || selectedComplaint.photo_path}
                    alt="Complaint photo"
                    className="w-full max-h-56 object-contain bg-slate-900/5"
                  />
                </div>
              </div>
            )}

            {/* Owner Resolution Section */}
            {selectedComplaint.status === 'resolved' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution from Hostel Management</span>
                </div>
                {selectedComplaint.resolution_note ? (
                  <p className="text-xs text-emerald-900 bg-white/80 border border-emerald-200/80 rounded-xl p-3 font-medium">
                    &ldquo;{selectedComplaint.resolution_note}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-emerald-800 italic">
                    This issue has been marked resolved by hostel management.
                  </p>
                )}
                {selectedComplaint.resolved_at && (
                  <p className="text-[11px] text-emerald-700">
                    Resolved: {formatDate(selectedComplaint.resolved_at)}
                  </p>
                )}
              </div>
            ) : selectedComplaint.status === 'in_progress' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>In Progress</span>
                </div>
                <p className="text-xs text-amber-800">
                  Hostel management has received your request and maintenance staff is currently working on it.
                </p>
                {selectedComplaint.resolution_note && (
                  <p className="text-xs text-amber-900 bg-white/80 border border-amber-200/80 rounded-xl p-2.5 mt-1 font-medium">
                    Note: &ldquo;{selectedComplaint.resolution_note}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Submitted & Awaiting Review</span>
                </div>
                <p className="text-xs text-blue-800">
                  Your complaint is in the hostel queue. You will see live status updates and resolution notes here once staff attends to it.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
