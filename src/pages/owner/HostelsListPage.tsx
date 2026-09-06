import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { hostelsService } from '../../services/hostels/hostelsService'
import { HostelWithStats } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../utils/formatters'
import {
  Building2,
  PlusCircle,
  MapPin,
  Phone,
  DoorOpen,
  Bed,
  Users,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Edit,
} from 'lucide-react'

export const HostelsListPage: React.FC = () => {
  const { hostels, isLoadingHostels, refetchHostels } = useHostelContext()
  const navigate = useNavigate()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedHostel, setSelectedHostel] = useState<HostelWithStats | null>(null)

  // Add/Edit Form State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setName('')
    setAddress('')
    setPhone('')
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (h: HostelWithStats) => {
    setSelectedHostel(h)
    setName(h.name)
    setAddress(h.address)
    setPhone(h.phone || '')
    setIsEditModalOpen(true)
  }

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await hostelsService.createHostel({ name, address, phone })
      setIsAddModalOpen(false)
      refetchHostels()
    } catch (err) {
      console.error('Failed to create hostel:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateHostel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHostel) return
    setIsSaving(true)
    try {
      await hostelsService.updateHostel(selectedHostel.id, { name, address, phone })
      setIsEditModalOpen(false)
      refetchHostels()
    } catch (err) {
      console.error('Failed to update hostel:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyRegisterLink = (hostelId: string) => {
    const registerUrl = `${window.location.origin}/register/${hostelId}`
    navigator.clipboard.writeText(registerUrl)
    setCopiedId(hostelId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Hostels Portfolio
          </h2>
          <p className="text-xs text-text-secondary">
            Manage your multiple hostel branches, buildings, capacities, and public registration portals
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add New Hostel
        </Button>
      </div>

      {/* Hostels Grid */}
      {isLoadingHostels ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : hostels.length === 0 ? (
        <EmptyState
          title="No hostels added yet"
          description="Start managing your properties by adding your first hostel branch."
          icon={<Building2 className="w-8 h-8" />}
          actionLabel="Add Hostel"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((h) => {
            const occupancyRate =
              h.total_beds && h.total_beds > 0
                ? Math.round(((h.occupied_beds || 0) / h.total_beds) * 100)
                : 0

            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between space-y-4"
              >
                {/* Top Card Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-brand flex items-center justify-center font-bold">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-primary">{h.name}</h3>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active Branch
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(h)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Edit Hostel"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-text-secondary">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{h.address}</span>
                    </p>
                    {h.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{h.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 border-y border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-text-secondary">Rooms</span>
                    <p className="font-bold text-text-primary text-sm mt-0.5">{h.rooms_count || 0}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-text-secondary">Total Beds</span>
                    <p className="font-bold text-text-primary text-sm mt-0.5">{h.total_beds || 0}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-[10px] text-emerald-800">Occupancy</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">{occupancyRate}%</p>
                  </div>
                </div>

                {/* Public Admission Link button */}
                <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-blue-900 font-semibold truncate">Public Admission Portal</span>
                  <button
                    onClick={() => handleCopyRegisterLink(h.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-brand hover:text-blue-800 px-2 py-1 rounded bg-white shadow-2xs border border-blue-200"
                  >
                    {copiedId === h.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/app/rooms')}
                    leftIcon={<Bed className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Manage Beds
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/app/hostels/${h.id}`)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Hostel Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="md"
        title="Add New Hostel Branch"
      >
        <form onSubmit={handleCreateHostel} className="space-y-4 pt-2">
          <Input
            label="Hostel Name"
            placeholder="e.g. Al-Razi Boys Hostel"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Complete Address"
            placeholder="e.g. Plot 45, Sector H-12, Islamabad"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Contact Phone"
            type="tel"
            placeholder="0300-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Create Hostel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Hostel Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        title="Edit Hostel Branch"
      >
        <form onSubmit={handleUpdateHostel} className="space-y-4 pt-2">
          <Input
            label="Hostel Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Complete Address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
