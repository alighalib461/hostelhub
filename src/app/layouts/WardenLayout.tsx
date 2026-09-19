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
  X,
  ChevronDown,
  Building,
  PlusCircle,
  Wrench,
  MoreHorizontal,
  UtensilsCrossed,
  Bell,
  Receipt,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'

export const WardenLayout: React.FC = () => {
  const { profile, signOut } = useAuth()
  const { hostels, selectedHostelId, setSelectedHostelId, wardenPermissions } = useHostelContext()
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Dynamic Navigation filtered by Warden's explicit permissions
  const navItems = [
    { label: 'Dashboard', path: '/warden/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, show: true },
    { label: 'Residents', path: '/warden/residents', icon: <Users className="w-4 h-4" />, show: wardenPermissions.can_view_residents },
    { label: 'Rooms & Beds', path: '/warden/rooms', icon: <BedDouble className="w-4 h-4" />, show: wardenPermissions.can_manage_rooms || wardenPermissions.can_manage_beds },
    { label: 'Fees & Billing', path: '/warden/fees', icon: <CreditCard className="w-4 h-4" />, show: wardenPermissions.can_view_fees },
    { label: 'Payments', path: '/warden/payments', icon: <Receipt className="w-4 h-4" />, show: wardenPermissions.can_record_payments },
    { label: 'Verify Online Payments', path: '/warden/payment-verifications', icon: <ShieldCheck className="w-4 h-4" />, show: wardenPermissions.can_verify_online_payments },
    { label: 'Hostel Menu', path: '/warden/menu', icon: <UtensilsCrossed className="w-4 h-4" />, show: wardenPermissions.can_manage_menu },
    { label: 'Complaints', path: '/warden/complaints', icon: <Wrench className="w-4 h-4" />, show: wardenPermissions.can_manage_complaints },
    { label: 'Announcements', path: '/warden/announcements', icon: <Bell className="w-4 h-4" />, show: wardenPermissions.can_create_announcements },
    { label: 'Expenses', path: '/warden/expenses', icon: <DollarSign className="w-4 h-4" />, show: wardenPermissions.can_view_expenses },
    { label: 'Reports', path: '/warden/reports', icon: <BarChart3 className="w-4 h-4" />, show: wardenPermissions.can_view_reports },
  ].filter((item) => item.show)

  // Primary bottom navigation items (5 tabs)
  const bottomNavItems = [
    { label: 'Home', path: '/warden/dashboard', icon: LayoutDashboard },
    { label: 'Residents', path: '/warden/residents', icon: Users, show: wardenPermissions.can_view_residents },
    { label: 'Rooms', path: '/warden/rooms', icon: BedDouble, show: wardenPermissions.can_manage_rooms },
    { label: 'Payments', path: '/warden/payments', icon: Receipt, show: wardenPermissions.can_record_payments },
  ].filter((item) => item.show !== false)

  // Secondary items shown in the "More" slide-up drawer
  const moreNavItems = [
    { label: 'Verify Online Payments', path: '/warden/payment-verifications', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50', show: wardenPermissions.can_verify_online_payments },
    { label: 'Fees & Billing', path: '/warden/fees', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', show: wardenPermissions.can_view_fees },
    { label: 'Hostel Menu', path: '/warden/menu', icon: UtensilsCrossed, color: 'text-amber-600 bg-amber-50', show: wardenPermissions.can_manage_menu },
    { label: 'Complaints & Maintenance', path: '/warden/complaints', icon: Wrench, color: 'text-rose-600 bg-rose-50', show: wardenPermissions.can_manage_complaints },
    { label: 'Announcements', path: '/warden/announcements', icon: Bell, color: 'text-blue-600 bg-blue-50', show: wardenPermissions.can_create_announcements },
    { label: 'Expenses', path: '/warden/expenses', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', show: wardenPermissions.can_view_expenses },
    { label: 'Reports', path: '/warden/reports', icon: BarChart3, color: 'text-purple-600 bg-purple-50', show: wardenPermissions.can_view_reports },
  ].filter((item) => item.show)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const currentNavItem = navItems.find((item) => location.pathname.startsWith(item.path))
  const pageTitle = currentNavItem ? currentNavItem.label : 'Warden Operations'
  const isMoreActive = moreNavItems.some((item) => location.pathname.startsWith(item.path))

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0D1B2A] text-white flex-col justify-between shrink-0 shadow-xl z-20 sticky top-0 h-screen border-r border-[#1E293B]">
        {/* Top Logo & App Title */}
        <div className="p-6 pb-4 border-b border-white/10">
          <BrandLogo variant="dark" withTagline iconSize={36} />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
            Warden Operations
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
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {profile?.full_name?.charAt(0) || 'W'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Warden'}</p>
              <p className="text-[11px] text-teal-400 font-semibold capitalize">Hostel Warden</p>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Brand Logo Icon */}
            <div className="lg:hidden shrink-0">
              <BrandLogo variant="light" iconSize={28} />
            </div>

            <div className="hidden sm:block min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight truncate">{pageTitle}</h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">Warden Hostel Management</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Assigned Hostel Selector */}
            {hostels.length > 1 ? (
              <div className="relative flex items-center max-w-[170px] sm:max-w-[220px]">
                <Building className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none shrink-0" />
                <select
                  value={selectedHostelId}
                  onChange={(e) => setSelectedHostelId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-[#172033] rounded-xl pl-8 pr-7 py-1.5 sm:py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors truncate"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-slate-500 pointer-events-none shrink-0" />
              </div>
            ) : hostels.length === 1 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 max-w-[170px] sm:max-w-[220px] truncate">
                <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{hostels[0].name}</span>
              </div>
            ) : null}

            {/* Quick Action: Add Resident (Desktop) */}
            {wardenPermissions.can_add_residents && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => navigate('/warden/residents/new')}
                className="hidden sm:inline-flex"
              >
                Add Resident
              </Button>
            )}

            {/* User Profile Avatar */}
            <div className="shrink-0">
              {profile?.avatar_path ? (
                <img
                  src={profile.avatar_path}
                  alt={profile.full_name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-teal-200 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 border border-teal-300 text-teal-700 flex items-center justify-center font-bold text-xs shadow-xs">
                  {profile?.full_name?.charAt(0) || 'W'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body with Safe Bottom Padding for Mobile Nav */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg safe-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path !== '/warden/dashboard' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMoreDrawerOpen(false)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
                isActive
                  ? 'text-[#2563EB] font-bold scale-102'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          )
        })}

        {/* 5th Tab: "More" Drawer Trigger */}
        <button
          onClick={() => setIsMoreDrawerOpen(!isMoreDrawerOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
            isMoreActive || isMoreDrawerOpen
              ? 'text-[#2563EB] font-bold scale-102'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isMoreActive || isMoreDrawerOpen ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-500'}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* "MORE" SLIDE-UP DRAWER (Mobile) */}
      {isMoreDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMoreDrawerOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 z-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Warden Operations</h3>
                <p className="text-xs text-slate-500">Quick access to assigned hostel tools</p>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Button */}
            {wardenPermissions.can_add_residents && (
              <div className="mb-4">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<PlusCircle className="w-5 h-5" />}
                  onClick={() => {
                    setIsMoreDrawerOpen(false)
                    navigate('/warden/residents/new')
                  }}
                  className="w-full justify-center shadow-md py-3 text-sm font-bold"
                >
                  + Add New Resident
                </Button>
              </div>
            )}

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
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
                        ? 'bg-blue-50/80 border-blue-300 text-blue-800 font-bold shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>

            {/* User Profile & Sign Out */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {profile?.full_name?.charAt(0) || 'W'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#172033] truncate">{profile?.full_name || 'Warden'}</p>
                  <p className="text-[10px] text-teal-600 font-semibold truncate">Hostel Warden</p>
                </div>
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
