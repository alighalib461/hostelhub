import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { wardensService } from '../../services/wardens/wardensService'
import { WardenInvitation } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { Skeleton } from '../../components/ui/Skeleton'
import { ShieldCheck, CheckCircle2, AlertCircle, Building, KeyRound, ArrowRight } from 'lucide-react'

export const AcceptWardenInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, signIn, signUp, refreshProfile } = useAuth()

  const [invitation, setInvitation] = useState<WardenInvitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (token) {
      loadInvitation(token)
    }
  }, [token])

  const loadInvitation = async (invToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const inv = await wardensService.getInvitationByToken(invToken)
      if (!inv) {
        setError('This invitation link is invalid or has expired.')
      } else if (inv.status !== 'pending') {
        setError(`This invitation has already been ${inv.status}.`)
      } else {
        setInvitation(inv)
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to load invitation.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !invitation) return

    setIsProcessing(true)
    setError(null)

    try {
      if (!user) {
        // User is not logged in, sign up with the invitation's email
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.')
          setIsProcessing(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          setIsProcessing(false)
          return
        }

        try {
          await signUp(invitation.email, password, invitation.full_name, 'warden', invitation.phone || undefined)
        } catch {
          // If already exists, try signing in with that password
          await signIn(invitation.email, password)
        }
      }

      // Accept invitation linking DB records
      await wardensService.acceptInvitation(token)
      await refreshProfile()

      navigate('/warden/dashboard')
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to accept invitation.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <Skeleton className="h-10 w-32 mx-auto" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invitation Notice</h2>
          <p className="text-xs text-slate-500">{error || 'Invitation not found.'}</p>
          <Button variant="primary" size="md" onClick={() => navigate('/login')} className="w-full justify-center">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo variant="light" withTagline={false} iconSize={36} />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Official Warden Invitation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome, {invitation.full_name}!
          </h2>
          <p className="text-xs text-slate-500">
            You have been invited by the hostel owner to manage hostel operations as an authorized Warden.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Email Address:</span>
            <span className="font-bold text-slate-800 font-mono">{invitation.email}</span>
          </div>
          {invitation.phone && (
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-bold text-slate-800">{invitation.phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Properties:</span>
            <span className="font-bold text-blue-600">{invitation.hostel_ids.length} Hostel Branch(es)</span>
          </div>
        </div>

        <form onSubmit={handleAcceptInvite} className="space-y-4">
          {!user && (
            <>
              <Input
                label="Set Account Password"
                type="password"
                placeholder="Minimum 6 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
              />
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isProcessing}
            className="w-full justify-center shadow-md text-sm font-bold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Accept Invitation & Open Portal
          </Button>
        </form>
      </div>
    </div>
  )
}
