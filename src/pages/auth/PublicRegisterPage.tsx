import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { hostelsService } from '../../services/hostels/hostelsService'
import { registrationsService } from '../../services/registrations/registrationsService'
import { storageService } from '../../services/storage/storageService'
import { Hostel } from '../../types/models'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { formatCNIC } from '../../utils/formatters'
import {
  Building2,
  User,
  Phone,
  CreditCard,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react'

export const PublicRegisterPage: React.FC = () => {
  const { hostelId } = useParams<{ hostelId: string }>()
  const [hostel, setHostel] = useState<Hostel | null>(null)
  const [isLoadingHostel, setIsLoadingHostel] = useState(true)

  // Form states
  const [fullName, setFullName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [cnic, setCnic] = useState('')
  const [phone, setPhone] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  // Files
  const [cnicFront, setCnicFront] = useState<File | null>(null)
  const [cnicBack, setCnicBack] = useState<File | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hostelId) {
      hostelsService
        .getHostelById(hostelId)
        .then((data) => setHostel(data))
        .catch((err) => console.error('Failed to load hostel info:', err))
        .finally(() => setIsLoadingHostel(false))
    }
  }, [hostelId])

  const handleCnicChange = (val: string) => {
    setCnic(formatCNIC(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostelId) return
    setError(null)
    setIsSubmitting(true)

    try {
      let cnicFrontPath: string | null = null
      let cnicBackPath: string | null = null
      let photoPath: string | null = null

      const timestamp = Date.now()

      // Upload CNIC front if selected
      if (cnicFront) {
        const cleanName = `requests/${hostelId}/${timestamp}-cnic-front.jpg`
        const res = await storageService.uploadFile('resident-documents', cleanName, cnicFront)
        cnicFrontPath = res.path
      }

      // Upload CNIC back if selected
      if (cnicBack) {
        const cleanName = `requests/${hostelId}/${timestamp}-cnic-back.jpg`
        const res = await storageService.uploadFile('resident-documents', cleanName, cnicBack)
        cnicBackPath = res.path
      }

      // Upload Photo if selected
      if (profilePhoto) {
        const cleanName = `requests/${hostelId}/${timestamp}-photo.jpg`
        const res = await storageService.uploadFile('resident-photos', cleanName, profilePhoto)
        photoPath = res.path
      }

      await registrationsService.submitRegistration({
        hostel_id: hostelId,
        full_name: fullName,
        father_name: fatherName,
        cnic: cnic.replace(/-/g, ''),
        phone,
        permanent_address: permanentAddress,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        profile_photo_path: photoPath,
        cnic_front_path: cnicFrontPath,
        cnic_back_path: cnicBackPath,
      })

      setIsSuccess(true)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to submit registration request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Application Submitted!</h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Your registration request for <strong className="text-text-primary">{hostel?.name || 'the hostel'}</strong> has been received. The hostel administration will review your details and assign your room/bed upon approval.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1">
            <p className="font-semibold text-text-primary">What happens next?</p>
            <p>1. The hostel owner reviews your details & verified documents.</p>
            <p>2. Once approved, you will receive confirmation and your Resident ID.</p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <BrandLogo variant="full" iconSize={38} className="justify-center" />
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Resident Admission Portal</h2>
          <p className="text-xs text-text-secondary">
            Apply online for hostel residency with digital record verification
          </p>
        </div>

        {/* Hostel Overview Banner */}
        <div className="bg-navy-primary text-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Target Hostel
            </span>
            <h3 className="text-base font-bold truncate">
              {isLoadingHostel ? 'Loading hostel details...' : hostel?.name || 'Hostel Admission'}
            </h3>
            {hostel?.address && (
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{hostel.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-brand" />
                <span>Personal Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Usama Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  label="Father's Name"
                  required
                  placeholder="e.g. Tariq Khan"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CNIC Number (13 digits)"
                  required
                  placeholder="42101-1234567-1"
                  value={cnic}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  maxLength={15}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                />
                <Input
                  label="Phone Number"
                  required
                  type="tel"
                  placeholder="0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Permanent Address"
                required
                placeholder="Complete street address, city, province"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Section 2: Emergency Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Phone className="w-4 h-4 text-teal-accent" />
                <span>Emergency Contact Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Person"
                  required
                  placeholder="Parent / Guardian Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
                <Input
                  label="Emergency Contact Phone"
                  required
                  type="tel"
                  placeholder="0300-9876543"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Section 3: Document Uploads */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Identity Documents (CNIC & Photo)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CNIC Front */}
                <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 hover:border-blue-400 transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-text-primary">CNIC Front</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicFront(e.target.files?.[0] || null)}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-blue-50 file:text-blue-700"
                  />
                  {cnicFront && <p className="text-[10px] text-emerald-600 font-medium truncate">{cnicFront.name}</p>}
                </div>

                {/* CNIC Back */}
                <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 hover:border-blue-400 transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-text-primary">CNIC Back</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicBack(e.target.files?.[0] || null)}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-blue-50 file:text-blue-700"
                  />
                  {cnicBack && <p className="text-[10px] text-emerald-600 font-medium truncate">{cnicBack.name}</p>}
                </div>

                {/* Profile Photo */}
                <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 hover:border-blue-400 transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-text-primary">Profile Photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-blue-50 file:text-blue-700"
                  />
                  {profilePhoto && <p className="text-[10px] text-emerald-600 font-medium truncate">{profilePhoto.name}</p>}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Submit Application
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
