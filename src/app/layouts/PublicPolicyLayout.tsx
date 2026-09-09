import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { Button } from '../../components/ui/Button'
import {
  Shield,
  FileText,
  Trash2,
  LogIn,
  Menu,
  X,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export const PublicPolicyLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Privacy Policy', path: '/privacy-policy', icon: <Shield className="w-4 h-4" /> },
    { label: 'Terms & Conditions', path: '/terms-and-conditions', icon: <FileText className="w-4 h-4" /> },
    { label: 'Account Deletion', path: '/account-deletion', icon: <Trash2 className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo variant="full" iconSize={32} />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-50 text-[#2563EB] font-bold shadow-2xs'
                      : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-100'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action: Sign In */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="primary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Public Legal & Compliance
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-[#2563EB] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </NavLink>
            ))}

            <div className="pt-2 border-t border-slate-100">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="primary" size="md" className="w-full" leftIcon={<LogIn className="w-4 h-4" />}>
                  Sign In to HostelHub
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1B2A] text-slate-300 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
            {/* Column 1: Brand & Tagline */}
            <div className="space-y-3">
              <BrandLogo variant="dark" withTagline iconSize={36} />
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                HostelHub is a modern multi-hostel SaaS management platform designed to automate resident records, room allocation, and digital fee collection.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-teal-300">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Modern Hostel Management Platform</span>
              </div>
            </div>

            {/* Column 2: Legal Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Legal & Compliance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-and-conditions"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>Terms & Conditions</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/account-deletion"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Account Deletion Request</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Developer Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Developer & Support Contact
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                For privacy inquiries, account management, legal notices, or technical support:
              </p>
              <a
                href="mailto:malighalib461@gmail.com"
                className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-white/5 px-3 py-2 rounded-xl border border-white/10"
              >
                <Mail className="w-4 h-4 text-teal-400" />
                <span>malighalib461@gmail.com</span>
              </a>
              <p className="text-[11px] text-slate-400">
                Effective Date: <strong className="text-slate-200">September 9, 2026</strong>
              </p>
            </div>
          </div>

          {/* Bottom copyright line */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} HostelHub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <span>•</span>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/account-deletion" className="hover:text-white transition-colors">
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
