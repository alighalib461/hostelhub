import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Mail, Lock, LogIn, User, Shield, AlertCircle, Building2, UserCheck, CheckCircle2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialRole = searchParams.get('role') === 'resident' ? 'resident' : 'owner'
  const isDeleted = searchParams.get('deleted') === 'true'
  const [role, setRole] = useState<'owner' | 'resident'>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'resident' || roleParam === 'owner') {
      setRole(roleParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { profile: signedInProfile, user } = await signIn(email.trim(), password)
      
      // Determine user role with robust fallback
      const userRole =
        signedInProfile?.role ||
        (user?.user_metadata?.role as 'owner' | 'resident') ||
        role

      if (userRole === 'resident') {
        navigate('/resident/dashboard', { replace: true })
      } else {
        navigate('/app/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Welcome to HostelHUB</h2>
        <p className="text-xs text-[#64748B]">Sign in to manage your hostels or access your resident account</p>
      </div>

      {/* Role Selection Tabs (OWNER & RESIDENT) */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'owner'
                ? 'bg-[#0D1B2A] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#172033]'
            }`}
          >
            <Shield className={`w-4 h-4 ${role === 'owner' ? 'text-teal-400' : 'text-slate-500'}`} />
            <span>OWNER</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('resident')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'resident'
                ? 'bg-[#0D1B2A] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#172033]'
            }`}
          >
            <User className={`w-4 h-4 ${role === 'resident' ? 'text-blue-400' : 'text-slate-500'}`} />
            <span>RESIDENT</span>
          </button>
        </div>

        {/* Dynamic portal info hint */}
        <p className="text-[11px] text-center text-slate-500">
          {role === 'owner' ? (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              Hostel Owner & Manager Portal
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Resident Portal (Room, Fees & Receipts)
            </span>
          )}
        </p>
      </div>

      {isDeleted && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold">Account Deleted Permanently</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Your HostelHub account, credentials, and associated data have been completely removed.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-[#64748B]">
        <div>
          Don't have an account yet?{' '}
          <Link to={`/signup?role=${role}`} className="text-[#2563EB] font-semibold hover:underline">
            Create Account
          </Link>
        </div>
        <div className="text-[11px] text-slate-400">
          Need to remove your data?{' '}
          <Link to="/account-deletion" className="text-slate-500 hover:text-slate-700 underline">
            Request Account Deletion
          </Link>
        </div>
      </div>
    </div>
  )
}

