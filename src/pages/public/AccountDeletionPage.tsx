import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/supabase/authService'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import {
  ShieldAlert,
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
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header & Branding */}
        <div className="text-center space-y-2">
          <BrandLogo variant="full" iconSize={38} className="justify-center" />
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Account & Data Deletion Request
          </h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Official portal for requesting permanent removal of your HostelHub account and associated personal data
          </p>
        </div>

        {/* Success State */}
        {requestCode ? (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">
                Deletion Request Received
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your request has been logged in our secure deletion queue.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-text-secondary">Request Reference:</span>
                <span className="font-mono font-bold text-blue-brand text-sm">{requestCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Target Email:</span>
                <span className="font-semibold text-text-primary">{email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Processing Timeframe:</span>
                <span className="font-semibold text-text-primary">Within 48 hours</span>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary">
              All credentials, resident identifiers, and uploaded document attachments associated with this email will be wiped.
            </p>

            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Self-Service Instant Deletion Callout */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-brand rounded-xl shrink-0 mt-0.5">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Have your login credentials?
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    You can immediately delete your account directly from the in-app Settings page.
                  </p>
                </div>
              </div>

              <Link to="/login" className="w-full sm:w-auto shrink-0">
                <Button variant="primary" size="sm" className="w-full text-xs">
                  Sign In to Delete
                </Button>
              </Link>
            </div>

            {/* Deletion Policy Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                <Shield className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Data Deletion & Retention Policy
                </h3>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                When an account deletion request is processed, HostelHub permanently deletes the following data from active databases and cloud storage:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-brand" /> Account & Profile
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Authentication credentials, email, phone number, and avatar photos.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-accent" /> Identity Documents
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    CNIC front/back copies, admission records, and application attachments.
                  </p>
                </div>
              </div>
            </div>

            {/* Public Request Form */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  Submit Web Deletion Request
                </h3>
                <p className="text-xs text-text-secondary">
                  Complete this form if you do not have access to the HostelHub mobile app.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
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
                  placeholder="e.g. No longer staying in hostel, privacy request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  leftIcon={<HelpCircle className="w-4 h-4" />}
                />

                {/* Confirmation Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs text-text-secondary leading-relaxed">
                      I confirm that I am the owner of this account and request the permanent deletion of my account, profile, and associated personal documents.
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
                  Submit Deletion Request
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
