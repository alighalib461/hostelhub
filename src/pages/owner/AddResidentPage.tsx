import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { residentsService } from '../../services/residents/residentsService'
import { storageService } from '../../services/storage/storageService'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { BedSelector } from '../../components/shared/BedSelector'
import { formatCurrency, formatCNIC, formatPhone } from '../../utils/formatters'
import confetti from 'canvas-confetti'
import { DocumentCaptureCard } from '../../components/shared/DocumentCaptureCard'
import {
  User,
  Phone,
  CreditCard,
  Building,
  Bed,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Sparkles,
} from 'lucide-react'

export const AddResidentPage: React.FC = () => {
  const { hostels, selectedHostelId } = useHostelContext()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [cnic, setCnic] = useState('')
  const [phone, setPhone] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  // Step 2: Documents
  const [cnicFront, setCnicFront] = useState<File | null>(null)
  const [cnicBack, setCnicBack] = useState<File | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)

  // Step 3: Hostel & Bed
  const [hostelId, setHostelId] = useState(
    selectedHostelId !== 'all' ? selectedHostelId : hostels[0]?.id || ''
  )
  const [bedId, setBedId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10))

  // Step 4: Financials
  const [monthlyFee, setMonthlyFee] = useState<number>(15000)
  const [securityDeposit, setSecurityDeposit] = useState<number>(5000)
  const [feeDueDay, setFeeDueDay] = useState<number>(5)
  const [generateInitialFee, setGenerateInitialFee] = useState(true)

  const steps = [
    { number: 1, title: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { number: 2, title: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { number: 3, title: 'Hostel & Bed', icon: <Bed className="w-4 h-4" /> },
    { number: 4, title: 'Financial Setup', icon: <CreditCard className="w-4 h-4" /> },
    { number: 5, title: 'Review & Confirm', icon: <CheckCircle2 className="w-4 h-4" /> },
  ]

  const validateStep = (step: number) => {
    setError(null)
    if (step === 1) {
      if (!fullName.trim() || !fatherName.trim() || !cnic.trim() || !phone.trim() || !permanentAddress.trim()) {
        setError('Please fill all required personal information fields.')
        return false
      }
      if (!emergencyName.trim() || !emergencyPhone.trim()) {
        setError('Please provide emergency contact name and phone number.')
        return false
      }
    }
    if (step === 3) {
      if (!hostelId) {
        setError('Please select a target hostel.')
        return false
      }
    }
    if (step === 4) {
      if (monthlyFee <= 0) {
        setError('Monthly fee must be greater than zero.')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      let cnicFrontPath: string | null = null
      let cnicBackPath: string | null = null
      let photoPath: string | null = null
      const timestamp = Date.now()

      if (cnicFront) {
        const res = await storageService.uploadFile(
          'resident-documents',
          `residents/${timestamp}-cnic-front.jpg`,
          cnicFront
        )
        cnicFrontPath = res.path
      }
      if (cnicBack) {
        const res = await storageService.uploadFile(
          'resident-documents',
          `residents/${timestamp}-cnic-back.jpg`,
          cnicBack
        )
        cnicBackPath = res.path
      }
      if (profilePhoto) {
        const res = await storageService.uploadFile(
          'resident-photos',
          `residents/${timestamp}-photo.jpg`,
          profilePhoto
        )
        photoPath = res.path
      }

      const createdResident = await residentsService.createResident({
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
        admission_date: admissionDate,
        monthly_fee: monthlyFee,
        security_deposit: securityDeposit,
        fee_due_day: feeDueDay,
        bed_id: bedId || undefined,
        initial_fee_month: generateInitialFee ? admissionDate.slice(0, 7) : undefined,
        initial_fee_amount: generateInitialFee ? monthlyFee : 0,
      })

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })

      navigate(`/app/residents/${createdResident.id}`)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to create resident.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedHostelObj = hostels.find((h) => h.id === hostelId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/residents')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Residents</span>
        </button>
        <span className="text-xs text-text-secondary">Step {currentStep} of 5</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Add New Resident
        </h2>
        <p className="text-xs text-text-secondary">
          Complete the 5-step registration wizard to admit a new resident and assign their bed
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((s) => {
          const isCompleted = currentStep > s.number
          const isCurrent = currentStep === s.number
          return (
            <div
              key={s.number}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isCurrent
                  ? 'bg-blue-50 border-blue-brand text-blue-900 ring-2 ring-blue-500/20'
                  : isCompleted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : s.icon}
                <span className="text-xs font-bold">{s.number}</span>
              </div>
              <span className="hidden sm:block text-[10px] font-semibold truncate">{s.title}</span>
            </div>
          )
        })}
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-brand" />
              <span>Step 1: Personal Information</span>
            </h3>

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
                onChange={(e) => setCnic(formatCNIC(e.target.value))}
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
              placeholder="Complete home street address, city"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
            />

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
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
        )}

        {/* STEP 2: Documents */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-teal-accent" />
              <span>Step 2: Upload Documents (Optional)</span>
            </h3>

            <p className="text-xs text-text-secondary">
              Upload resident identification documents. These will be encrypted and saved in private storage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentCaptureCard
                label="CNIC Front"
                description="Clear front side photo showing face & CNIC number"
                file={cnicFront}
                onFileChange={setCnicFront}
                filenamePrefix="cnic-front"
                aspectRatio="card"
              />

              <DocumentCaptureCard
                label="CNIC Back"
                description="Back side photo showing address & family tree info"
                file={cnicBack}
                onFileChange={setCnicBack}
                filenamePrefix="cnic-back"
                aspectRatio="card"
              />
            </div>

            <div className="pt-2">
              <DocumentCaptureCard
                label="Profile Photo"
                description="Recent passport-size headshot photo"
                file={profilePhoto}
                onFileChange={setProfilePhoto}
                filenamePrefix="profile-photo"
                aspectRatio="square"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Hostel & Bed Assignment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Bed className="w-4 h-4 text-blue-brand" />
              <span>Step 3: Hostel & Bed Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Hostel"
                required
                value={hostelId}
                onChange={(e) => {
                  setHostelId(e.target.value)
                  setBedId('')
                  setRoomId('')
                }}
                leftIcon={<Building className="w-4 h-4" />}
              >
                <option value="">Select Hostel</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Admission Date"
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
              />
            </div>

            {hostelId && (
              <div className="pt-2">
                <BedSelector
                  hostelId={hostelId}
                  selectedBedId={bedId}
                  onChange={(newBId, newRId) => {
                    setBedId(newBId)
                    setRoomId(newRId)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Financial Setup */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Step 4: Financial Setup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Monthly Fee (PKR)"
                required
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                min={0}
              />
              <Input
                label="Security Deposit (PKR)"
                required
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                min={0}
              />
              <Input
                label="Fee Due Day of Month"
                required
                type="number"
                value={feeDueDay}
                onChange={(e) => setFeeDueDay(Number(e.target.value))}
                min={1}
                max={28}
                helperText="Day 1–28"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateInitialFee}
                  onChange={(e) => setGenerateInitialFee(e.target.checked)}
                  className="w-4 h-4 text-blue-brand rounded focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-text-primary">
                  Generate initial month fee charge immediately ({admissionDate.slice(0, 7)})
                </span>
              </label>
              <p className="text-[11px] text-text-secondary pl-6">
                Creates the first billing entry of {formatCurrency(monthlyFee)} so you can immediately record payments.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Confirm */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Step 5: Review & Confirm Admission</span>
            </h3>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 text-xs">
              {/* Resident Summary */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-text-secondary">Full Name:</span>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{fullName}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Father's Name:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{fatherName}</p>
                </div>
                <div>
                  <span className="text-text-secondary">CNIC:</span>
                  <p className="font-mono font-semibold text-text-primary mt-0.5">{formatCNIC(cnic)}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Phone:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{formatPhone(phone)}</p>
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-text-secondary">Hostel:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{selectedHostelObj?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Bed Assignment:</span>
                  <p className="font-semibold text-blue-brand mt-0.5">
                    {bedId ? 'Assigned' : 'Unassigned (Can assign later)'}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary">Admission Date:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{admissionDate}</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-text-secondary">Monthly Fee:</span>
                  <p className="font-bold text-text-primary text-sm mt-0.5">{formatCurrency(monthlyFee)}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Security Deposit:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{formatCurrency(securityDeposit)}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Due Day:</span>
                  <p className="font-semibold text-text-primary mt-0.5">{feeDueDay}th of month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              variant="teal"
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
