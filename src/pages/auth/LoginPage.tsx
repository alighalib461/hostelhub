import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Mail, Lock, LogIn, Sparkles, User, Shield, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { profile: signedInProfile } = await signIn(email.trim(), password)
      const userRole = signedInProfile?.role || 'owner'
      if (userRole === 'resident') {
        navigate('/resident/dashboard', { replace: true })
      } else {
        navigate('/app/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Login failed. Please check credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick Demo Access Handler
  const handleQuickDemo = async (demoRole: 'owner' | 'resident') => {
    setError(null)
    setIsLoading(true)
    const demoEmail = demoRole === 'owner' ? 'owner@hostelhub.demo' : 'resident@hostelhub.demo'
    const demoPassword = 'Password123!'

    try {
      const { profile: demoProfile } = await signIn(demoEmail, demoPassword)
      const userRole = demoProfile?.role || demoRole
      if (userRole === 'resident') {
        navigate('/resident/dashboard', { replace: true })
      } else {
        navigate('/app/dashboard', { replace: true })
      }
    } catch {
      setEmail(demoEmail)
      setPassword(demoPassword)
      setError('Demo account not registered yet. You can sign up using this email or use your existing account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Welcome to HostelHUB</h2>
        <p className="text-xs text-[#64748B]">Sign in to manage your hostels or view your resident account</p>
      </div>

      {/* Quick Demo Access Bar */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick 1-Click Demo Access</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleQuickDemo('owner')}
            leftIcon={<Shield className="w-3.5 h-3.5 text-teal-400" />}
            disabled={isLoading}
            className="text-xs py-1.5"
          >
            Owner Demo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDemo('resident')}
            leftIcon={<User className="w-3.5 h-3.5 text-blue-600" />}
            disabled={isLoading}
            className="text-xs py-1.5"
          >
            Resident Demo
          </Button>
        </div>
      </div>

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

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-[#64748B]">
        Don't have an account yet?{' '}
        <Link to="/signup" className="text-[#2563EB] font-semibold hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  )
}
