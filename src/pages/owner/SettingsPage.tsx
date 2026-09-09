import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { authService } from '../../services/supabase/authService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  User,
  Phone,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Trash2,
  Upload,
  ShieldAlert,
} from 'lucide-react'
import { DeleteAccountDialog } from '../../components/shared/DeleteAccountDialog'

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await authService.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      })
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile details updated successfully!' })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as { message?: string })?.message || 'Failed to update profile.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so re-selecting same file triggers onChange
    e.target.value = ''

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Profile photo size must be less than 5MB.' })
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' })
      return
    }

    setIsUploadingPhoto(true)
    setMessage(null)

    try {
      await authService.uploadAvatar(file)
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as { message?: string })?.message || 'Failed to upload profile photo.',
      })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true)
    setMessage(null)
    try {
      await authService.removeAvatar()
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile photo removed.' })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as { message?: string })?.message || 'Failed to remove profile photo.',
      })
    } finally {
      setIsUploadingPhoto(false)
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
        <div
          className={`p-3.5 border text-xs rounded-xl flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Form & Photo Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-6">
        {/* Profile Header & Photo Management */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              {profile?.avatar_path ? (
                <img
                  src={profile.avatar_path}
                  alt={profile.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-2xl flex items-center justify-center border-2 border-blue-200 shadow-sm">
                  {profile?.full_name?.charAt(0) || 'O'}
                </div>
              )}

              {/* Hover / Tap camera badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg text-text-primary">
                {profile?.full_name || 'Hostel Owner'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand capitalize border border-blue-200">
                  {profile?.role || 'Owner'}
                </span>
                <span className="text-[11px] text-text-secondary">{profile?.email}</span>
              </div>
            </div>
          </div>

          {/* Photo Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploadingPhoto}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              className="text-xs flex-1 sm:flex-none"
            >
              {profile?.avatar_path ? 'Change Photo' : 'Upload Photo'}
            </Button>

            {profile?.avatar_path && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                className="text-rose-600 hover:bg-rose-50 text-xs px-2.5"
                title="Remove profile photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Text Form */}
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
            placeholder="e.g. 03095923110"
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
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-700">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h4>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-text-primary">Delete HostelHub Account</h5>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md">
              Permanently delete your account, login credentials, properties, rooms, and uploaded documents. This action cannot be reversed.
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
