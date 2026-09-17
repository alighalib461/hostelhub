import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { complaintsService } from '../../services/complaints/complaintsService'
import { storageService } from '../../services/storage/storageService'
import {
  ComplaintWithDetails,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
} from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { StatCard } from '../../components/shared/StatCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { SearchBar } from '../../components/shared/SearchBar'
import { formatDate } from '../../utils/formatters'
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Search,
  Filter,
  User,
  Building,
  Bed,
  Check,
  PlayCircle,
  Eye,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Electrical',
  'Plumbing',
  'Room / Furniture',
  'Cleaning',
  'Internet / Wi-Fi',
  'Mess / Food',
  'Security',
  'Other',
]

const QUICK_RESOLUTIONS = [
  'Repaired and tested by maintenance staff.',
  'Replaced with a new unit.',
  'Issue inspected and resolved on site.',
  'Cleaned and serviced.',
  'Wi-Fi router / connection reset and verified.',
]

export const ComplaintsPage: React.FC = () => {
  const { selectedHostelId, selectedHostel } = useHostelContext()

  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all')

  // Selected Complaint for Modal
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithDetails | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadComplaints()
  }, [selectedHostelId, statusFilter, categoryFilter, priorityFilter])

  const loadComplaints = async () => {
    setIsLoading(true)
    try {
      const data = await complaintsService.getComplaints({
        hostelId: selectedHostelId,
        status: statusFilter,
        category: categoryFilter === 'All' ? 'all' : categoryFilter,
        priority: priorityFilter,
        search: searchTerm,
      })
      setComplaints(data)
    } catch (err) {
      console.error('Failed to load complaints:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term)
    complaintsService
      .getComplaints({
        hostelId: selectedHostelId,
        status: statusFilter,
        category: categoryFilter === 'All' ? 'all' : categoryFilter,
        priority: priorityFilter,
        search: term,
      })
      .then(setComplaints)
      .catch(console.error)
  }

  const handleOpenComplaint = (c: ComplaintWithDetails) => {
    setSelectedComplaint(c)
    setResolutionNote(c.resolution_note || '')
    setErrorMessage(null)
  }

  const handleUpdateStatus = async (newStatus: ComplaintStatus) => {
    if (!selectedComplaint) return

    setIsUpdatingStatus(true)
    setErrorMessage(null)

    try {
      const updated = await complaintsService.updateComplaintStatus(
        selectedComplaint.id,
        newStatus,
        resolutionNote
      )

      setActionSuccessMessage(
        newStatus === 'resolved'
          ? `Complaint ${updated.complaint_code} marked as Resolved!`
          : `Complaint ${updated.complaint_code} marked as In Progress.`
      )

      // Refresh local record
      setSelectedComplaint((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              resolution_note: updated.resolution_note,
              resolved_at: updated.resolved_at,
              resolved_by: updated.resolved_by,
            }
          : null
      )

      // Refresh full list
      loadComplaints()

      setTimeout(() => setActionSuccessMessage(null), 4000)
    } catch (err: unknown) {
      setErrorMessage((err as { message?: string })?.message || 'Failed to update complaint status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Calculate summary metrics
  const submittedCount = complaints.filter((c) => c.status === 'submitted').length
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length
  const urgentCount = complaints.filter((c) => c.priority === 'urgent' && c.status !== 'resolved').length

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{selectedHostel ? selectedHostel.name : 'All Managed Hostels'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Maintenance & Complaints
          </h2>
          <p className="text-xs text-[#64748B]">
            Review, prioritize, assign, and track resolution of resident maintenance tickets.
          </p>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={complaints.length}
          subtitle={`${urgentCount} urgent requests`}
          icon={<Wrench className="w-6 h-6 text-[#2563EB]" />}
          iconBg="bg-blue-50"
          iconColor="text-[#2563EB]"
          onClick={() => setStatusFilter('all')}
        />

        <StatCard
          title="New / Submitted"
          value={submittedCount}
          subtitle="Awaiting staff action"
          icon={<AlertCircle className="w-6 h-6 text-[#E74C3C]" />}
          iconBg={submittedCount > 0 ? 'bg-rose-50' : 'bg-slate-50'}
          iconColor={submittedCount > 0 ? 'text-[#E74C3C]' : 'text-slate-400'}
          onClick={() => setStatusFilter('submitted')}
        />

        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Being repaired"
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => setStatusFilter('in_progress')}
        />

        <StatCard
          title="Resolved"
          value={resolvedCount}
          subtitle="Completed maintenance"
          icon={<CheckCircle2 className="w-6 h-6 text-[#16A085]" />}
          iconBg="bg-emerald-50"
          iconColor="text-[#16A085]"
          onClick={() => setStatusFilter('resolved')}
        />
      </div>

      {/* Action Notification */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchBar
              placeholder="Search by resident, room, subject..."
              value={searchTerm}
              onChange={handleSearchSubmit}
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'submitted', label: 'Submitted' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as ComplaintStatus | 'all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-blue-brand text-white shadow-xs'
                    : 'bg-slate-50 text-text-secondary hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Priority Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium text-text-primary rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as ComplaintPriority | 'all')}
              className="bg-slate-50 border border-slate-200 text-xs font-medium text-text-primary rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {(statusFilter !== 'all' || categoryFilter !== 'All' || priorityFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setCategoryFilter('All')
                setPriorityFilter('all')
                setSearchTerm('')
              }}
              className="text-xs text-blue-brand hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Complaints List Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8" />}
          title="No complaints found"
          description="There are no maintenance tickets matching your active filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-text-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Resident & Room</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-text-primary">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenComplaint(c)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Ticket & Subject */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-blue-brand text-[11px]">
                          {c.complaint_code}
                        </span>
                        <p className="font-bold text-text-primary group-hover:text-blue-brand transition-colors line-clamp-1">
                          {c.subject}
                        </p>
                      </div>
                    </td>

                    {/* Resident & Room */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div>
                        <p className="font-semibold text-text-primary truncate">
                          {c.resident?.full_name || 'Resident'}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          {c.room ? `Room ${c.room.room_number}` : 'Room —'}
                          {c.bed ? ` · Bed ${c.bed.bed_number}` : ''}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {c.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.priority === 'urgent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Flame className="w-3 h-3 text-rose-500" />
                          Urgent
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary text-[11px]">
                      {formatDate(c.created_at)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenComplaint(c)
                        }}
                        className="text-xs px-2.5 py-1 h-7"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. COMPLAINT DETAILS & RESOLUTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => {
          if (!isUpdatingStatus) {
            setSelectedComplaint(null)
            setErrorMessage(null)
          }
        }}
        title="Complaint Details & Resolution"
        maxWidth="lg"
      >
        {selectedComplaint && (
          <div className="space-y-5">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Header info */}
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
                      Urgent Priority
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  {selectedComplaint.subject}
                </h3>
              </div>

              <StatusBadge status={selectedComplaint.status} />
            </div>

            {/* Resident & Room Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Resident
                </span>
                <p className="font-bold text-text-primary mt-0.5 truncate">
                  {selectedComplaint.resident?.full_name || 'Resident'}
                </p>
                <p className="text-[10px] text-text-secondary font-mono">
                  {selectedComplaint.resident?.resident_id}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Contact Phone
                </span>
                <p className="font-bold text-text-primary mt-0.5">
                  {selectedComplaint.resident?.phone || '—'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Hostel & Room
                </span>
                <p className="font-bold text-text-primary mt-0.5 truncate">
                  {selectedComplaint.hostel?.name || '—'}
                </p>
                <p className="text-[10px] text-text-secondary">
                  {selectedComplaint.room ? `Room ${selectedComplaint.room.room_number}` : 'Room —'}
                  {selectedComplaint.bed ? ` · Bed ${selectedComplaint.bed.bed_number}` : ''}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                  Submitted At
                </span>
                <p className="font-bold text-text-primary mt-0.5">
                  {formatDate(selectedComplaint.created_at)}
                </p>
              </div>
            </div>

            {/* Complaint Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Resident's Issue Description
              </span>
              <p className="text-xs text-text-secondary leading-relaxed bg-white border border-slate-200 rounded-xl p-3.5 whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {selectedComplaint.photo_path && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Photo Attachment
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-w-sm">
                  <img
                    src={
                      storageService.getPublicUrl('resident-documents', selectedComplaint.photo_path) ||
                      selectedComplaint.photo_path
                    }
                    alt="Complaint photo"
                    className="w-full max-h-56 object-contain bg-slate-900/5"
                  />
                </div>
              </div>
            )}

            {/* Resolution Note & Action Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-brand" />
                  <span>Resolution Note & Updates for Resident</span>
                </label>
                {selectedComplaint.status === 'resolved' && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved on {formatDate(selectedComplaint.resolved_at || '')}
                  </span>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_RESOLUTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResolutionNote(preset)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white hover:bg-blue-50 hover:text-blue-brand border border-slate-200 transition-colors text-text-secondary"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="e.g. Fan repaired by electrician staff. / New tap installed."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none shadow-2xs"
              />

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {selectedComplaint.status !== 'in_progress' && selectedComplaint.status !== 'resolved' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<PlayCircle className="w-4 h-4 text-amber-600" />}
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('in_progress')}
                    >
                      Mark In Progress
                    </Button>
                  )}

                  {selectedComplaint.status !== 'resolved' && (
                    <Button
                      type="button"
                      variant="teal"
                      size="sm"
                      leftIcon={<Check className="w-4 h-4" />}
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}

                  {selectedComplaint.status === 'resolved' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isUpdatingStatus}
                      onClick={() => handleUpdateStatus('resolved')}
                    >
                      Update Resolution Note
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
