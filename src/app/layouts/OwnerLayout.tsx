import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { useAuth } from '../providers/AuthProvider'
import { useHostelContext } from '../providers/HostelProvider'
import { Button } from '../../components/ui/Button'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building2,
  BedDouble,
  BarChart3,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building,
  PlusCircle,
} from 'lucide-react'

export const OwnerLayout: React.FC = () => {
  const { profile, signOut } = useAuth()
  const { hostels, selectedHostelId, setSelectedHostelId } = useHostelContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Residents', path: '/app/residents', icon: <Users className="w-4 h-4" /> },
    { label: 'Fees & Billing', path: '/app/fees', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Payments', path: '/app/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Rooms & Beds', path: '/app/rooms', icon: <BedDouble className="w-4 h-4" /> },
    { label: 'Hostels', path: '/app/hostels', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Registration Requests', path: '/app/registration-requests', icon: <UserPlus className="w-4 h-4" /> },
    { label: 'Reports & Analytics', path: '/app/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Settings', path: '/app/settings', icon: <Settings className="w-4 h-4" /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const currentNavItem = navItems.find((item) => location.pathname.startsWith(item.path))
  const pageTitle = currentNavItem ? currentNavItem.label : 'HostelHUB Owner Portal'

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0D1B2A] text-white flex-col justify-between shrink-0 shadow-xl z-20 sticky top-0 h-screen border-r border-[#1E293B]">
        {/* Top Logo & App Title */}
        <div className="p-6 pb-4 border-b border-white/10">
          <BrandLogo variant="dark" withTagline iconSize={36} />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
            Main Management
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom User & Logout Section */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-[#070D14]/80">
          <div className="flex items-center gap-3 px-2">
            {profile?.avatar_path ? (
              <img
                src={profile.avatar_path}
                alt={profile.full_name}
                className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/20 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {profile?.full_name?.charAt(0) || 'O'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Owner'}</p>
              <p className="text-[11px] text-[#16A085] font-semibold capitalize">Owner / Admin</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 justify-start px-3"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-[#0D1B2A] text-white flex flex-col justify-between h-full p-4 z-10 shadow-2xl border-r border-[#1E293B]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <BrandLogo variant="dark" iconSize={32} />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 justify-start"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[#172033] tracking-tight">{pageTitle}</h1>
              <p className="text-xs text-slate-500 font-medium">HostelHUB Multi-Hostel Administration</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Multi-Hostel Selector */}
            <div className="relative flex items-center">
              <Building className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-xs font-bold text-[#172033] rounded-xl pl-9 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors"
              >
                <option value="all">🏢 All Hostels ({hostels.length})</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Quick Action: Add Resident */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/app/residents/new')}
              className="hidden sm:inline-flex"
            >
              Add Resident
            </Button>

            {/* User Profile Avatar */}
            <div
              onClick={() => navigate('/app/settings')}
              className="cursor-pointer shrink-0"
              title="Settings"
            >
              {profile?.avatar_path ? (
                <img
                  src={profile.avatar_path}
                  alt={profile.full_name}
                  className="w-9 h-9 rounded-xl object-cover border border-blue-200 hover:border-blue-500 hover:scale-105 transition-all shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-300 text-[#2563EB] flex items-center justify-center font-bold text-xs hover:border-blue-500 hover:bg-blue-100 transition-all shadow-xs">
                  {profile?.full_name?.charAt(0) || 'O'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
