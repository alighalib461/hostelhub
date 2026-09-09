import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  FileText,
  Database,
  Lock,
  Server,
  Share2,
  Trash2,
  AlertCircle,
  Mail,
  UserCheck,
  Calendar,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Official Privacy Policy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Effective Date: September 9, 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              App: HostelHub
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1B2A] tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-3xl">
            HostelHub is a hostel management application designed to help hostel owners and administrators manage hostels, rooms, beds, residents, admissions, fees, payment records, and related information.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Have questions about your data or want to request account removal?</span>
            </div>
            <Link
              to="/account-deletion"
              className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] hover:text-blue-700 underline shrink-0"
            >
              <span>Account Deletion Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Policy Content Sections */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-10">
        {/* Section 1 */}
        <section id="information-we-collect" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Information We Collect
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub may process the following categories of information to provide and maintain our services:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3>Account Information</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Email address, authentication information, user role (e.g., owner or resident), and account profile details.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
                <Database className="w-4 h-4 text-teal-600" />
                <h3>Resident Information</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Name, contact details (phone number, email), identification information (e.g. CNIC), hostel/room/bed assignments, admission/history records, fee schedules, payment records, and other information entered by an authorized hostel administrator.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3>Identification Documents</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                CNIC/identification document images uploaded for resident identification, verification, and hostel management records.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3>Profile Media & Files</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Profile images, hostel photos, and other files or images uploaded voluntarily through the application.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="how-we-use-information" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              How We Use Information
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We use the collected information for specific, operational purposes:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
            {[
              'Create and authenticate accounts.',
              'Manage hostels, rooms, beds, and residents.',
              'Maintain resident admission and history records.',
              'Track fees, dues, and payment records.',
              'Store identification documents and images securely.',
              'Maintain platform security, reliability, and functionality.',
              'Provide user support and troubleshooting.',
              'Process account and data deletion requests.',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3 */}
        <section id="data-storage" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Data Storage and Service Providers
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub uses Supabase services for authentication, database, and file/storage functionality. Information may therefore be processed by these necessary infrastructure and cloud service providers to operate and maintain the application reliably.
          </p>

          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Infrastructure providers are bound by industry standards and strict data protection agreements to process data exclusively for hosting, storage, and service fulfillment.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section id="sharing-of-information" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Sharing of Information
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p className="font-semibold text-[#0D1B2A]">
              HostelHub does not sell users' personal information.
            </p>
            <p>
              Information may be processed by necessary service providers used to operate HostelHub, or disclosed where required for legal, security, fraud-prevention, or regulatory reasons.
            </p>
            <p>
              Authorized hostel owners and administrators may access resident information that they are responsible for managing through the application.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section id="data-security" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              5
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Data Security
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We use reasonable technical and organizational safeguards to protect information, including encrypted network communications (HTTPS/TLS), database Row-Level Security (RLS) policies, and role-based access restrictions. However, no internet-based service or electronic storage method can guarantee absolute security.
          </p>
        </section>

        {/* Section 6 */}
        <section id="data-retention" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              6
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Data Retention
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Information is retained for as long as reasonably necessary to provide the service, maintain records, comply with legal obligations, resolve disputes, and protect security.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Some information may need to be retained where required for legitimate legal, security, fraud-prevention, or regulatory purposes.
          </p>
        </section>

        {/* Section 7 */}
        <section id="account-deletion" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0">
              7
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Account and Data Deletion
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Users can delete their account through the available account deletion functionality in HostelHub (accessible in Owner Settings or Resident Profile). Users can also use the public Account Deletion page to request deletion of their account and associated personal information.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Where legally required or reasonably necessary for security, fraud prevention, regulatory, or other legitimate purposes, certain information may be retained.
          </p>

          <div className="pt-2">
            <Link
              to="/account-deletion"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Go to Account Deletion Portal</span>
            </Link>
          </div>
        </section>

        {/* Section 8 */}
        <section id="childrens-privacy" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              8
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Children's Privacy
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub is not specifically directed toward children. Users should not provide information belonging to children unless they have the appropriate legal authority to do so.
          </p>
        </section>

        {/* Section 9 */}
        <section id="changes-to-privacy-policy" className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              9
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Changes to This Privacy Policy
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We may update this Privacy Policy when necessary to reflect changes in our practices or legal obligations. The updated version will be made available directly on this page with a revised effective date.
          </p>
        </section>

        {/* Section 10 */}
        <section id="contact" className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              10
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Contact Information
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            For privacy-related questions, data access requests, or deletion inquiries, please contact:
          </p>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#0D1B2A]">HostelHub Privacy & Compliance</p>
              <p className="text-xs text-slate-500">Contact Email for Privacy & Data Requests</p>
            </div>
            <a
              href="mailto:malighalib461@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#2563EB] hover:text-blue-700 hover:border-blue-300 shadow-2xs transition-colors"
            >
              <Mail className="w-4 h-4 text-teal-600" />
              <span>malighalib461@gmail.com</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
