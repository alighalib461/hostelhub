import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hostelsService } from '../../services/hostels/hostelsService'
import { roomsService } from '../../services/rooms/roomsService'
import { HostelWithStats, RoomWithBeds } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency } from '../../utils/formatters'
import {
  Building2,
  MapPin,
  Phone,
  DoorOpen,
  Bed,
  Users,
  ArrowLeft,
  Copy,
  Check,
  PlusCircle,
  Settings,
} from 'lucide-react'

export const HostelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [hostel, setHostel] = useState<HostelWithStats | null>(null)
  const [rooms, setRooms] = useState<RoomWithBeds[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (hostelId: string) => {
    setIsLoading(true)
    try {
      const [h, r] = await Promise.all([
        hostelsService.getHostelById(hostelId),
        roomsService.getRoomsWithBeds(hostelId),
      ])
      setHostel(h)
      setRooms(r)
    } catch (err) {
      console.error('Failed to load hostel details:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!id) return
    const url = `${window.location.origin}/register/${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!hostel) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl">
        <p className="text-sm font-bold text-text-primary">Hostel Not Found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/hostels')} className="mt-4">
          Back to Hostels
        </Button>
      </div>
    )
  }

  const occRate =
    hostel.total_beds && hostel.total_beds > 0
      ? Math.round(((hostel.occupied_beds || 0) / hostel.total_beds) * 100)
      : 0

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/app/hostels')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hostels Portfolio</span>
      </button>

      {/* Hostel Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-brand flex items-center justify-center font-extrabold text-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {hostel.name}
            </h2>
            <p className="text-xs text-text-secondary flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{hostel.address}</span>
              {hostel.phone && <span>• Tel: {hostel.phone}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Link Copied!' : 'Copy Registration Link'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/rooms')}
            leftIcon={<Bed className="w-4 h-4" />}
          >
            Manage Rooms & Beds
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-text-secondary font-medium">Total Rooms</span>
          <p className="text-xl font-bold text-text-primary mt-1">{hostel.rooms_count}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-text-secondary font-medium">Total Beds</span>
          <p className="text-xl font-bold text-text-primary mt-1">{hostel.total_beds}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-text-secondary font-medium">Active Residents</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{hostel.active_residents_count}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <span className="text-text-secondary font-medium">Occupancy Rate</span>
          <p className="text-xl font-bold text-blue-brand mt-1">{occRate}%</p>
        </div>
      </div>

      {/* Rooms Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">Rooms in this Hostel ({rooms.length})</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/rooms')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Room
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r) => (
            <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-sm">Room {r.room_number}</span>
                <span className="text-xs font-semibold text-slate-500">
                  {r.occupied_count}/{r.capacity} Occupied
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {r.beds.map((b) => (
                  <span
                    key={b.id}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      b.status === 'occupied'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Bed {b.bed_number}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
