import React, { useState, useEffect } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { DeleteAccountDialog } from '../../components/shared/DeleteAccountDialog'
import { formatCNIC, formatPhone, formatDate, formatCurrency } from '../../utils/formatters'
import { User, Phone, MapPin, CreditCard, Shield, AlertCircle, Trash2, ShieldAlert, LogOut } from 'lucide-react'

export const ResidentProfilePage: React.FC = () => {
  const { signOut } = useAuth()
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    residentsService
      .getResidentForCurrentUser()
      .then(setResident)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          My Resident Profile
        </h2>
        <p className="text-xs text-text-secondary">
          Official registered admission details and account settings
        </p>
      </div>

      {!resident ? (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-text-primary">Admission Record Not Linked</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Please visit your <a href="/resident/dashboard" className="text-blue-brand underline font-semibold">Resident Dashboard</a> to connect your account using your <strong>Resident ID</strong>, <strong>CNIC</strong>, or registered <strong>Phone Number</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {/* Session Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-text-primary">Session Management</h4>
          <p className="text-xs text-text-secondary">Sign out from this device</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-700">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h4>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-text-primary">Delete Resident Account</h5>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md">
              Permanently delete your login account, personal profile, and unlink your admission connection.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="shrink-0"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  )
}
