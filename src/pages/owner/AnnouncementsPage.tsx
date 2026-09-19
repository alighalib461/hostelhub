import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { useAuth } from '../../app/providers/AuthProvider'
import { announcementsService } from '../../services/announcements/announcementsService'
import { AnnouncementWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/formatters'
import {
  Bell,
  PlusCircle,
  Building,
  Users,
  ShieldCheck,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export const AnnouncementsPage: React.FC = () => {
  const { hostels, selectedHostelId } = useHostelContext()
  const { role } = useAuth()

  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetAudience, setTargetAudience] = useState<'both' | 'residents' | 'wardens'>('both')
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all')
  const [selectedHostelIds, setSelectedHostelIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadAnnouncements()
  }, [selectedHostelId])

  const loadAnnouncements = async () => {
    setIsLoading(true)
    try {
      const data = await announcementsService.getAnnouncements({
        hostelId: selectedHostelId,
      })
      setAnnouncements(data)
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setTitle('')
    setContent('')
    setTargetAudience('both')
    setTargetMode(role === 'warden' ? 'specific' : 'all')
    setSelectedHostelIds(selectedHostelId !== 'all' ? [selectedHostelId] : hostels.length > 0 ? [hostels[0].id] : [])
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleToggleHostel = (hId: string) => {
    if (selectedHostelIds.includes(hId)) {
      if (selectedHostelIds.length > 1) {
        setSelectedHostelIds(selectedHostelIds.filter((id) => id !== hId))
      }
    } else {
      setSelectedHostelIds([...selectedHostelIds, hId])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setFormError('Title and announcement content are required.')
      return
    }

    if (targetMode === 'specific' && selectedHostelIds.length === 0) {
      setFormError('Please select at least one hostel branch.')
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      await announcementsService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        target_audience: targetAudience,
        is_all_hostels: targetMode === 'all',
        hostel_id: targetMode === 'specific' ? selectedHostelIds[0] : null,
        selected_hostel_ids: targetMode === 'specific' ? selectedHostelIds : undefined,
      })

      setIsModalOpen(false)
      loadAnnouncements()
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message || 'Failed to publish announcement.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    try {
      await announcementsService.deleteAnnouncement(id)
      loadAnnouncements()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Announcements & Notices
          </h2>
          <p className="text-xs text-slate-500">
            Broadcast official notices, holiday alerts, and guidelines to residents and wardens
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={handleOpenCreate}
        >
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No announcements published yet"
          description="Create your first notice to broadcast information to residents or staff across your hostels."
          actionLabel="Create Announcement"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ann.is_all_hostels ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <Globe className="w-3 h-3" /> All Hostels
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Building className="w-3 h-3" /> {ann.hostel?.name || 'Assigned Hostel'}
                      </span>
                    )}

                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Audience: {ann.target_audience}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#172033] pt-1">{ann.title}</h3>
                </div>

                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Published by {ann.creator?.full_name || 'Management'} ({ann.creator?.role || 'Staff'})</span>
                <span>{formatDate(ann.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Announcement"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Announcement Title"
            placeholder="e.g. Eid Holidays Notice / Generator Maintenance"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">
              Notice Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write the full announcement details and dates..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'both', label: 'Everyone (Both)' },
                { id: 'residents', label: 'Residents Only' },
                { id: 'wardens', label: 'Wardens Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetAudience(opt.id as typeof targetAudience)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    targetAudience === opt.id
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {role === 'owner' && (
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">Hostel Targeting</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTargetMode('all')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    targetMode === 'all'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  🏢 All Hostels
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('specific')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    targetMode === 'specific'
                      ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  📍 Selected Hostels
                </button>
              </div>

              {targetMode === 'specific' && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {hostels.map((h) => (
                    <label
                      key={h.id}
                      className="flex items-center gap-2.5 p-1.5 text-xs cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedHostelIds.includes(h.id)}
                        onChange={() => handleToggleHostel(h.id)}
                        className="w-4 h-4 text-[#2563EB] rounded focus:ring-blue-500"
                      />
                      <span>{h.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
