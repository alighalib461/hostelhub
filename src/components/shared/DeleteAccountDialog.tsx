import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/supabase/authService'
import { useAuth } from '../../app/providers/AuthProvider'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react'

export interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      await authService.deleteAccount()
      onClose()
      // Navigate to login with success state
      navigate('/login?deleted=true', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to delete account. Please try again or contact support.'
      setError(msg)
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setConfirmText('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Permanently Delete Account</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
          <div className="flex items-start gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>This action is immediate and cannot be undone.</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-700">
            Deleting your account will permanently wipe your login credentials, profile data,
            and personal identifiers from HostelHub servers.
          </p>
        </div>

        {/* Breakdown of What Happens */}
        <div className="space-y-2 text-xs">
          <p className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
            Data Deletion Summary:
          </p>
          <ul className="space-y-1.5 text-text-secondary list-disc pl-4 text-[11px] leading-relaxed">
            <li>
              <strong>Auth & Profile:</strong> Your email (<span className="text-text-primary font-mono">{profile?.email}</span>) and profile will be permanently removed.
            </li>
            {profile?.role === 'owner' ? (
              <li>
                <strong>Hostels & Rooms:</strong> All properties, rooms, beds, and records under your ownership will be deleted.
              </li>
            ) : (
              <li>
                <strong>Resident Admission Link:</strong> Your resident profile app connection will be unlinked.
              </li>
            )}
            <li>
              <strong>Files & Images:</strong> Uploaded profile avatars and document attachments will be cleared from cloud storage.
            </li>
          </ul>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Confirmation Input Guard */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-text-primary">
            Type <span className="font-bold font-mono text-rose-600 select-all">DELETE</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE here"
            disabled={isDeleting}
            autoFocus
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={!isConfirmed || isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Permanently Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
