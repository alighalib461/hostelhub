import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/supabase/authService'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import {
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Phone,
  HelpCircle,
  LogIn,
  FileText,
  Shield,
  ShieldAlert,
  Calendar,
  Building,
  Info,
  ArrowRight,
  Sparkles,
  Smartphone,
} from 'lucide-react'

export const AccountDeletionPage: React.FC = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'owner' | 'resident' | 'other'>('resident')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestCode, setRequestCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmed) {
      setError('Please check the confirmation box to submit your deletion request.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await authService.submitPublicDeletionRequest({
        fullName,
        email,
        phone,
        role,
        reason,
      })
      setRequestCode(res.requestCode)
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to submit deletion request. Please check your connection and try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Account & Data Deletion
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Effective Date: September 9, 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              App: HostelHub
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1B2A] tracking-tight">
            Delete Your HostelHub Account
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-3xl">
            You can request the deletion of your HostelHub account and associated personal data at any time. This page explains how deletion works, how to delete your account instantly from within the app, and how to submit a web deletion request if you cannot log in.
          </p>
        </div>
      </div>

      {/* Success State */}
      {requestCode ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0D1B2A]">
              Deletion Request Submitted Successfully
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Your account deletion request has been recorded in our secure processing queue.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2.5 text-left">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Request Reference:</span>
              <span className="font-mono font-bold text-[#2563EB] text-sm">{requestCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Target Email:</span>
              <span className="font-semibold text-[#0D1B2A]">{email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Queued for verification
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Upon verification of account ownership, all authentication credentials, profile records, and uploaded document attachments associated with this email will be wiped from active databases and storage.
          </p>

          <div className="pt-2 max-w-xs mx-auto">
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Method 1: Instant In-App Deletion Option */}
          <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-[#2563EB] rounded-2xl shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1B2A]">
                    Method 1: Instant In-App Self-Service Deletion
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    Fastest (Immediate)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  If you can sign into your account, you can trigger an immediate, automated wipe of your credentials and data directly inside HostelHub:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-[#0D1B2A] flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  For Hostel Owners / Managers:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Log in to the <strong>Owner Portal</strong>.</li>
                  <li>Click on <strong>Settings</strong> in the navigation menu.</li>
                  <li>Scroll to the <strong>Danger Zone</strong> section at the bottom.</li>
                  <li>Click <strong>Delete Account</strong> and type <code className="font-mono bg-white px-1 border rounded text-rose-600">DELETE</code> to confirm.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-[#0D1B2A] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  For Hostel Residents:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Log in to the <strong>Resident Portal</strong>.</li>
                  <li>Navigate to your <strong>Profile</strong> tab.</li>
                  <li>Scroll down to the <strong>Danger Zone</strong> card.</li>
                  <li>Click <strong>Delete Account</strong> and confirm deletion.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <Link to="/login">
                <Button variant="primary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                  Sign In to Delete Immediately
                </Button>
              </Link>
            </div>
          </div>

          {/* Explanation of What Data is Deleted & Retained */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-[#0D1B2A]">
                What Happens When Your Account Is Deleted
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-bold text-[#0D1B2A] flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" /> Data That Is Permanently Removed:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li>Account login credentials (email and password authentication).</li>
                  <li>Personal profile details, full name, phone number, and avatar photos.</li>
                  <li>Resident admission linkages and profile connections.</li>
                  <li>Uploaded identification documents (CNIC scans/photos, admission files).</li>
                  <li>Hostel configuration data (for owners deleting their primary accounts).</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-bold text-[#0D1B2A] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Legitimate Retention Exceptions:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Some information may need to be retained where required for legitimate legal, financial compliance, fraud prevention, dispute resolution, or regulatory reporting purposes (such as historical financial audit trails or statutory tax records where applicable).
                </p>
              </div>
            </div>
          </div>

          {/* Method 2: Public Web Deletion Request Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                  Method 2
                </span>
                <h3 className="text-lg font-bold text-[#0D1B2A]">
                  Submit a Public Deletion Request Form
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                If you cannot sign in or no longer have access to the app, submit your details below to place an account deletion request in our queue.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Muhammad Ali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Email Address"
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Registered Phone Number"
                  required
                  type="tel"
                  placeholder="0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <Select
                label="Your Role in HostelHub"
                value={role}
                onChange={(e) => setRole(e.target.value as 'owner' | 'resident' | 'other')}
                options={[
                  { value: 'resident', label: 'Hostel Resident' },
                  { value: 'owner', label: 'Hostel Owner / Manager' },
                  { value: 'other', label: 'Public Applicant / Other' },
                ]}
              />

              <Input
                label="Reason for Deletion (Optional)"
                placeholder="e.g. Graduated from hostel, privacy preference"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                leftIcon={<HelpCircle className="w-4 h-4" />}
              />

              {/* Confirmation Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I confirm that I am the authorized owner of this HostelHub account and request the permanent deletion of my account, profile, and associated personal documents.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="danger"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Submit Account Deletion Request
              </Button>
            </form>
          </div>

          {/* Alternative Contact Support Card */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-[#0D1B2A] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-teal-600" />
                Alternative / Support Contact:
              </p>
              <p className="text-slate-600">
                You can also contact our support team directly to request data assistance:
              </p>
            </div>
            <a
              href="mailto:malighalib461@gmail.com?subject=HostelHub%20Account%20Deletion%20Request"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold text-[#2563EB] hover:text-blue-700 hover:border-blue-300 shadow-2xs transition-colors shrink-0"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              <span>malighalib461@gmail.com</span>
            </a>
          </div>
        </>
      )}
    </div>
  )
}
