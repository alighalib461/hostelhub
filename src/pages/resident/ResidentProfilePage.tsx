import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCNIC, formatPhone, formatDate, formatCurrency } from '../../utils/formatters'
import { User, Phone, MapPin, CreditCard, Shield, AlertCircle } from 'lucide-react'

export const ResidentProfilePage: React.FC = () => {
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

  if (!resident) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center">
        <p className="text-xs text-text-secondary">Resident record not linked yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          My Resident Profile
        </h2>
        <p className="text-xs text-text-secondary">
          Official registered admission details on file with hostel management
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-xl flex items-center justify-center">
            {resident.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-base text-text-primary">{resident.full_name}</h3>
            <p className="font-mono text-xs text-blue-brand font-semibold">{resident.resident_id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Personal Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-secondary">Father's Name</span>
              <p className="font-semibold text-text-primary mt-0.5">{resident.father_name}</p>
            </div>
            <div>
              <span className="text-text-secondary">CNIC Number</span>
              <p className="font-mono font-semibold text-text-primary mt-0.5">{formatCNIC(resident.cnic)}</p>
            </div>
            <div>
              <span className="text-text-secondary">Phone Number</span>
              <p className="font-semibold text-text-primary mt-0.5">{formatPhone(resident.phone)}</p>
            </div>
            <div>
              <span className="text-text-secondary">Admission Date</span>
              <p className="font-semibold text-text-primary mt-0.5">{formatDate(resident.admission_date)}</p>
            </div>
          </div>
          <div className="pt-2 text-xs">
            <span className="text-text-secondary">Permanent Address</span>
            <p className="font-semibold text-text-primary mt-0.5">{resident.permanent_address}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Emergency Contact
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-secondary">Contact Name</span>
              <p className="font-semibold text-text-primary mt-0.5">{resident.emergency_contact_name}</p>
            </div>
            <div>
              <span className="text-text-secondary">Contact Phone</span>
              <p className="font-semibold text-text-primary mt-0.5">
                {formatPhone(resident.emergency_contact_phone)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
