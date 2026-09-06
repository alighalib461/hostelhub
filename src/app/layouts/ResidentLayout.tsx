import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../../components/ui/Button'
import {
  LayoutDashboard,
  Building,
  CreditCard,
  Receipt,
  FileText,
  User,
  LogOut,
} from 'lucide-react'

export const ResidentLayout: React.FC = () => {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: '/resident/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Hostel', path: '/resident/hostel', icon: <Building className="w-4 h-4" /> },
    { label: 'My Fees', path: '/resident/fees', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Receipts', path: '/resident/receipts', icon: <Receipt className="w-4 h-4" /> },
    { label: 'Documents', path: '/resident/documents', icon: <FileText className="w-4 h-4" /> },
    { label: 'Profile', path: '/resident/profile', icon: <User className="w-4 h-4" /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo variant="full" iconSize={32} />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-brand'
                      : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-primary">{profile?.full_name || 'Resident'}</p>
              <p className="text-[10px] text-teal-600 font-semibold">Resident Portal</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-rose-600"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? 'text-blue-brand' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <div className="p-1">{item.icon}</div>
            <span className="truncate max-w-[60px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
