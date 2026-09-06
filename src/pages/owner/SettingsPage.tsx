import React, { useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { authService } from '../../services/supabase/authService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { User, Phone, Mail, Shield, Bell, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await authService.updateProfile({
        full_name: fullName,
        phone,
      })
      await refreshProfile()
      setMessage('Profile updated successfully!')
    } catch (err: unknown) {
      setMessage((err as { message?: string })?.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          System Settings & Profile
        </h2>
        <p className="text-xs text-text-secondary">
          Manage your account credentials, hostel defaults, and notification preferences
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-xl flex items-center justify-center">
            {profile?.full_name?.charAt(0) || 'O'}
          </div>
          <div>
            <h3 className="font-bold text-base text-text-primary">{profile?.full_name}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand capitalize border border-blue-200">
              {profile?.role || 'Owner'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Email Address (Login)"
            type="email"
            disabled
            value={profile?.email || ''}
            helperText="Email cannot be changed directly"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Notification Defaults */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="w-4 h-4 text-blue-brand" />
          <span>Notification & System Preferences</span>
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <p className="font-semibold text-text-primary">Payment Notifications</p>
              <p className="text-text-secondary text-[11px]">Receive notification when a payment receipt is issued</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-brand rounded" />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <p className="font-semibold text-text-primary">New Admission Alerts</p>
              <p className="text-text-secondary text-[11px]">Get alerted when a resident submits registration via public link</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-brand rounded" />
          </label>
        </div>
      </div>

      {/* Security & Sign out */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-text-primary">Session Management</h4>
          <p className="text-xs text-text-secondary">Sign out from this device</p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
