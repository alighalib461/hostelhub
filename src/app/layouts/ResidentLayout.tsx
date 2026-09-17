import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
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
  LifeBuoy,
  MoreHorizontal,
  X,
} from 'lucide-react'

export const ResidentLayout: React.FC = () => {
  const { profile, signOut } = useAuth()
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/resident/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Fees', path: '/resident/fees', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Receipts', path: '/resident/receipts', icon: <Receipt className="w-4 h-4" /> },
    { label: 'Complaints', path: '/resident/complaints', icon: <LifeBuoy className="w-4 h-4" /> },
    { label: 'My Hostel', path: '/resident/hostel', icon: <Building className="w-4 h-4" /> },
    { label: 'Documents', path: '/resident/documents', icon: <FileText className="w-4 h-4" /> },
    { label: 'Profile', path: '/resident/profile', icon: <User className="w-4 h-4" /> },
  ]

  const bottomNavItems = [
    { label: 'Home', path: '/resident/dashboard', icon: LayoutDashboard },
    { label: 'My Fees', path: '/resident/fees', icon: CreditCard },
    { label: 'Complaints', path: '/resident/complaints', icon: LifeBuoy },
    { label: 'Receipts', path: '/resident/receipts', icon: Receipt },
  ]

  const moreNavItems = [
    { label: 'Hostel Details', path: '/resident/hostel', icon: Building, color: 'text-blue-600 bg-blue-50' },
    { label: 'My Documents', path: '/resident/documents', icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'My Profile', path: '/resident/profile', icon: User, color: 'text-slate-600 bg-slate-100' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isMoreActive = moreNavItems.some((item) => location.pathname.startsWith(item.path))

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-6 overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo variant="full" iconSize={30} />

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
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg safe-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreDrawerOpen(false)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
                isActive ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          )
        })}

        {/* 5th Tab: More */}
        <button
          onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
            isMoreActive || isMoreDrawerOpen ? 'text-[#2563EB] font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMoreActive || isMoreDrawerOpen ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-500'}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* Resident "More" Drawer */}
      {isMoreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMoreDrawerOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 z-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Resident Menu</h3>
                <p className="text-xs text-slate-500">Hostel info, documents, & account</p>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-300 text-blue-800 font-bold'
                        : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172033]">{profile?.full_name || 'Resident'}</p>
                <p className="text-[10px] text-slate-500">{profile?.phone || 'Hostel Resident'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

