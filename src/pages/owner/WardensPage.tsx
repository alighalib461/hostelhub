import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { wardensService } from '../../services/wardens/wardensService'
import {
  WardenWithDetails,
  WardenInvitation,
  WardenPermissions,
  DEFAULT_WARDEN_PERMISSIONS,
} from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/formatters'
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Building,
  Check,
  Copy,
  Sliders,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'

export const WardensPage: React.FC = () => {
  const { hostels, selectedHostelId } = useHostelContext()

  const [wardens, setWardens] = useState<WardenWithDetails[]>([])
  const [invitations, setInvitations] = useState<WardenInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedHostelIds, setSelectedHostelIds] = useState<string[]>([])
  const [permissions, setPermissions] = useState<WardenPermissions>({ ...DEFAULT_WARDEN_PERMISSIONS })
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null)

  // Edit Permissions Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingWarden, setEditingWarden] = useState<WardenWithDetails | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<WardenPermissions>({ ...DEFAULT_WARDEN_PERMISSIONS })
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)

  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedHostelId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [wardensList, invList] = await Promise.all([
        wardensService.getWardens(selectedHostelId),
        wardensService.getInvitations(),
      ])
      setWardens(wardensList)
      setInvitations(invList)
    } catch (err) {
      console.error('Failed to load wardens data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenInvite = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setSelectedHostelIds(selectedHostelId !== 'all' ? [selectedHostelId] : hostels.length > 0 ? [hostels[0].id] : [])
    setPermissions({ ...DEFAULT_WARDEN_PERMISSIONS })
    setInviteError(null)
    setGeneratedInviteLink(null)
    setIsInviteModalOpen(true)
  }

  const handleToggleHostelSelection = (hostelId: string) => {
    if (selectedHostelIds.includes(hostelId)) {
      if (selectedHostelIds.length > 1) {
        setSelectedHostelIds(selectedHostelIds.filter((id) => id !== hostelId))
      }
    } else {
      setSelectedHostelIds([...selectedHostelIds, hostelId])
    }
  }

  const handleTogglePermission = (key: keyof WardenPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleToggleEditPermission = (key: keyof WardenPermissions) => {
    setEditingPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setInviteError('Full name and email are required.')
      return
    }
    if (selectedHostelIds.length === 0) {
      setInviteError('Please select at least one hostel for this warden.')
      return
    }

    setIsInviting(true)
    setInviteError(null)

    try {
      const inv = await wardensService.inviteWarden({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        hostel_ids: selectedHostelIds,
        permissions,
      })

      const inviteUrl = `${window.location.origin}/invite/warden/${inv.token}`
      setGeneratedInviteLink(inviteUrl)
      loadData()
    } catch (err: unknown) {
      setInviteError((err as { message?: string })?.message || 'Failed to send invitation.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleOpenEditPermissions = (w: WardenWithDetails) => {
    setEditingWarden(w)
    setEditingPermissions({
      ...DEFAULT_WARDEN_PERMISSIONS,
      ...(w.permissions as Partial<WardenPermissions>),
    })
    setIsEditModalOpen(true)
  }

  const handleSavePermissions = async () => {
    if (!editingWarden) return
    setIsSavingPermissions(true)
    try {
      await wardensService.updateWardenPermissions(editingWarden.id, editingPermissions)
      setIsEditModalOpen(false)
      loadData()
    } catch (err) {
      console.error('Failed to save permissions:', err)
    } finally {
      setIsSavingPermissions(false)
    }
  }

  const handleToggleActive = async (w: WardenWithDetails) => {
    try {
      await wardensService.toggleWardenStatus(w.id, !w.is_active)
      loadData()
    } catch (err) {
      console.error('Failed to toggle active status:', err)
    }
  }

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(identifier)
    setTimeout(() => setCopiedToken(null), 2500)
  }

  const permissionItems: { key: keyof WardenPermissions; label: string; desc: string }[] = [
    { key: 'can_view_residents', label: 'View Residents', desc: 'Can view residents directory and details' },
    { key: 'can_add_residents', label: 'Add Residents', desc: 'Can register new residents & capture CNIC' },
    { key: 'can_edit_residents', label: 'Edit Residents', desc: 'Can update resident profiles & contact info' },
    { key: 'can_manage_rooms', label: 'Manage Rooms', desc: 'Can create and configure hostel rooms' },
    { key: 'can_manage_beds', label: 'Manage Beds', desc: 'Can add beds and assign residents to beds' },
    { key: 'can_record_payments', label: 'Record Cash Payments', desc: 'Can collect cash and generate digital receipts' },
    { key: 'can_verify_online_payments', label: 'Verify Online Payments', desc: 'Can approve/reject Bank, Easypaisa, JazzCash payments' },
    { key: 'can_view_fees', label: 'View Fees Ledger', desc: 'Can inspect monthly billing, due dates & overdue amounts' },
    { key: 'can_manage_complaints', label: 'Manage Complaints', desc: 'Can mark complaints in-progress or resolved' },
    { key: 'can_manage_menu', label: 'Manage Hostel Menu', desc: 'Can upload and replace the single hostel menu image' },
    { key: 'can_create_announcements', label: 'Create Announcements', desc: 'Can broadcast notices to assigned hostel residents' },
    { key: 'can_view_expenses', label: 'View Expenses', desc: 'Can view operational expense logs for assigned hostel' },
    { key: 'can_manage_expenses', label: 'Manage Expenses', desc: 'Can record new expense transactions' },
    { key: 'can_view_reports', label: 'View Reports', desc: 'Can view occupancy and fee recovery statistics' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Wardens & Staff Management
          </h2>
          <p className="text-xs text-slate-500">
            Invite hostel wardens, manage assigned properties, and enforce explicit role-based permissions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={handleOpenInvite}
        >
          Invite Warden
        </Button>
      </div>

      {/* Active Wardens List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
          Active Wardens ({wardens.length})
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : wardens.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8" />}
            title="No wardens assigned yet"
            description="Invite a hostel warden to manage daily operational tasks, residents, bed assignments, and online payment verifications."
            actionLabel="Invite First Warden"
            actionIcon={<UserPlus className="w-4 h-4" />}
            onAction={handleOpenInvite}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wardens.map((w) => {
              const activeCount = Object.values(
                (w.permissions as Record<string, boolean>) || {}
              ).filter(Boolean).length

              return (
                <div
                  key={w.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                          {w.profile?.full_name?.charAt(0) || 'W'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#172033] truncate">
                            {w.profile?.full_name || 'Hostel Warden'}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{w.profile?.email || '—'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleActive(w)}
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${
                          w.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {w.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <p className="flex items-center gap-2 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">
                          {w.hostel?.name || 'Assigned Hostel'}
                        </span>
                      </p>
                      {w.profile?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{w.profile.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      {activeCount} Permissions Granted
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Sliders className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEditPermissions(w)}
                      className="text-xs h-8"
                    >
                      Permissions
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Invitations ({invitations.filter((i) => i.status === 'pending').length})</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => {
              const inviteUrl = `${window.location.origin}/invite/warden/${inv.token}`
              return (
                <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#172033]">{inv.full_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                          inv.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      {inv.email} {inv.phone ? `• ${inv.phone}` : ''} • Expires {formatDate(inv.expires_at)}
                    </p>
                  </div>

                  {inv.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(inviteUrl, inv.id)}
                      leftIcon={copiedToken === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      className="text-xs shrink-0"
                    >
                      {copiedToken === inv.id ? 'Link Copied!' : 'Copy Invite Link'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INVITE WARDEN MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          if (!isInviting) setIsInviteModalOpen(false)
        }}
        title="Invite New Warden"
        maxWidth="lg"
      >
        {generatedInviteLink ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Invitation Created Successfully!</p>
                <p className="text-xs">
                  Share this private invitation link with <strong>{fullName}</strong> to allow them to set their password and log in.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-700 truncate">{generatedInviteLink}</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCopy(generatedInviteLink, 'modal')}
                leftIcon={copiedToken === 'modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                className="shrink-0"
              >
                {copiedToken === 'modal' ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="md" onClick={() => setIsInviteModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4 pt-1">
            {inviteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                placeholder="e.g. Muhammad Aslam"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="warden@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Input
              label="Contact Phone (Optional)"
              type="tel"
              placeholder="0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {/* Assigned Hostels Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#172033]">
                Assign to Hostel Properties <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                {hostels.map((h) => (
                  <label
                    key={h.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                      selectedHostelIds.includes(h.id)
                        ? 'bg-blue-50/80 border-blue-300 font-bold text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHostelIds.includes(h.id)}
                      onChange={() => handleToggleHostelSelection(h.id)}
                      className="w-4 h-4 text-[#2563EB] rounded focus:ring-blue-500"
                    />
                    <span className="truncate">{h.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#172033]">
                  Configure Explicit Warden Permissions
                </label>
                <span className="text-[10px] text-slate-400">Server-enforced</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {permissionItems.map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                      permissions[item.key]
                        ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[item.key])}
                      onChange={() => handleTogglePermission(item.key)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" type="button" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isInviting}>
                Generate Invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 2. EDIT PERMISSIONS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Permissions: ${editingWarden?.profile?.full_name || 'Warden'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500">
            Control which operational actions this warden is authorized to perform for{' '}
            <strong>{editingWarden?.hostel?.name}</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {permissionItems.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                  editingPermissions[item.key]
                    ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(editingPermissions[item.key])}
                  onChange={() => handleToggleEditPermission(item.key)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-tight">{item.label}</p>
                  <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              size="md"
              onClick={handleSavePermissions}
              isLoading={isSavingPermissions}
            >
              Save Permissions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
