import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import {
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react'

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialRole = searchParams.get('role') === 'resident' ? 'resident' : 'owner'
  const [role, setRole] = useState<'owner' | 'resident'>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match exactly.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const { profile: createdProfile, user } = await signUp(
        cleanEmail,
        password,
        fullName.trim(),
        role,
        phone.trim()
      )
      const userRole = createdProfile?.role || (user?.user_metadata?.role as 'owner' | 'resident') || role
      if (userRole === 'owner') {
        navigate('/app/dashboard', { replace: true })
      } else {
        navigate('/resident/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Failed to create account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Create HostelHUB Account</h2>
        <p className="text-xs text-[#64748B]">Choose your role to get started with digitized hostel management</p>
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

        <p className="text-[11px] text-center text-slate-500">
          {role === 'owner' ? (
            <span className="inline-flex items-center gap-1 text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              Registering as Hostel Owner & Manager
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Registering as Hostel Resident
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Muhammad Ali"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="0300-1234567"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:text-slate-600 text-slate-400 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 hover:text-slate-600 text-slate-400 focus:outline-none"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link to="/terms-and-conditions" className="text-[#2563EB] hover:underline font-semibold">
            Terms & Conditions
          </Link>{' '}
          and acknowledge our{' '}
          <Link to="/privacy-policy" className="text-[#2563EB] hover:underline font-semibold">
            Privacy Policy
          </Link>.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create {role === 'owner' ? 'Owner' : 'Resident'} Account
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-[#64748B]">
        Already have an account?{' '}
        <Link to={`/login?role=${role}`} className="text-[#2563EB] font-semibold hover:underline">
          Sign In as {role === 'owner' ? 'Owner' : 'Resident'}
        </Link>
      </div>
    </div>
  )
}
