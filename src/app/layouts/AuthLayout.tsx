import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { BrandLogo } from '../../components/shared/BrandLogo'
import { Shield, Users, Bed, CreditCard, Sparkles, CheckCircle } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Branding Showcase (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-brand/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-accent/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <BrandLogo variant="dark" withTagline iconSize={42} />
          </Link>
        </div>

        {/* Center Hero Card */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-brand/20 border border-blue-brand/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-accent" />
            <span>Modern Multi-Hostel SaaS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Manage Better. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
              Grow Faster.
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            HostelHUB eliminates paper registers, manual receipts, and scattered records with a unified digital platform built for hostel owners and residents.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { icon: <Users className="w-4 h-4 text-blue-400" />, text: 'Resident records & CNIC document management' },
              { icon: <Bed className="w-4 h-4 text-teal-400" />, text: 'Interactive visual room & bed occupancy tracking' },
              { icon: <CreditCard className="w-4 h-4 text-emerald-400" />, text: 'Automated monthly fees & instant digital receipts' },
              { icon: <Shield className="w-4 h-4 text-amber-400" />, text: 'Multi-hostel control with enterprise Row-Level Security' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Badge & Links */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Verified Secure Supabase Backend</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/account-deletion" className="hover:text-white transition-colors">
              Account Deletion
            </Link>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 sm:p-12 min-h-screen">
        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Mobile Logo View */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-block">
              <BrandLogo variant="full" withTagline iconSize={36} />
            </Link>
          </div>

          {/* Form Content */}
          <Outlet />
        </div>

        {/* Mobile-Visible Public Policy Footer Links */}
        <div className="w-full max-w-md pt-6 pb-2 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-3">
          <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms-and-conditions" className="hover:text-slate-600 transition-colors">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link to="/account-deletion" className="hover:text-slate-600 transition-colors">
            Account Deletion
          </Link>
        </div>
      </div>
    </div>
  )
}
