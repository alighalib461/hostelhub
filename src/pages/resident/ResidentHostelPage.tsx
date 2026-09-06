import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/formatters'
import { Building2, MapPin, Phone, Bed, DoorOpen, Calendar, Shield } from 'lucide-react'

export const ResidentHostelPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then(setResident)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton className="h-64 w-full" />

  const hostel = resident?.hostel
  const room = resident?.current_assignment?.room
  const bed = resident?.current_assignment?.bed

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          My Hostel & Room
        </h2>
        <p className="text-xs text-text-secondary">
          Assigned building, accommodation room, bed number, and hostel contact details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hostel Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-brand flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-primary">{hostel?.name || 'Hostel'}</h3>
              <p className="text-xs text-emerald-600 font-semibold">Active Residence</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-text-secondary">Address:</span>
                <p className="font-semibold text-text-primary mt-0.5">{hostel?.address}</p>
              </div>
            </div>

            {hostel?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="font-medium text-text-secondary">Hostel Warden / Office:</span>
                  <p className="font-semibold text-text-primary">{hostel.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accommodation Assignment Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bed className="w-4 h-4 text-teal-accent" />
            <span>Room & Bed Assignment</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/80">
              <span className="text-xs font-medium text-blue-900">Room Number</span>
              <p className="text-xl font-bold text-blue-brand mt-1">
                {room?.room_number ? `Room ${room.room_number}` : 'Unassigned'}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">Capacity: {room?.capacity || 0} Beds</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <span className="text-xs font-medium text-emerald-900">Bed Spot</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {bed?.bed_number ? `Bed ${bed.bed_number}` : 'Unassigned'}
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Since {formatDate(resident?.current_assignment?.start_date || resident?.admission_date)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-text-primary">Hostel Guidelines:</p>
            <p>• Room & bed reassignments must be requested through hostel management.</p>
            <p>• Gate curfew & visitor policy is managed by the hostel warden.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
