import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building,
  Users,
  CreditCard,
  Ban,
  Scale,
  Calendar,
  Mail,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Terms of Service
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Effective Date: September 9, 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              App: HostelHub
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1B2A] tracking-tight">
            Terms & Conditions
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-3xl">
            Please read these Terms & Conditions carefully before using the HostelHub platform, application, or services. By creating an account or using HostelHub, you agree to be bound by these terms.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <span>For details on how we collect and process data, see our Privacy Policy.</span>
            </div>
            <Link
              to="/privacy-policy"
              className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] hover:text-blue-700 underline shrink-0"
            >
              <span>View Privacy Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-10">
        {/* Section 1 */}
        <section id="acceptance-of-terms" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Acceptance of Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            By accessing, registering for, downloading, or using HostelHub (the "Application" or "Service"), you agree to comply with and be legally bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you must not access or use HostelHub.
          </p>
        </section>

        {/* Section 2 */}
        <section id="description-of-service" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Description of HostelHub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub is a specialized software application and digital management system designed to assist hostel owners, managers, administrators, and residents in organizing hostels, rooms, beds, resident profiles, admission records, fee schedules, payments, receipts, and related documentation.
          </p>
        </section>

        {/* Section 3 */}
        <section id="user-accounts" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              User Accounts & Security
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To use certain features of HostelHub, you must register for an account with a valid email address and password. You agree to provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.
          </p>
        </section>

        {/* Section 4 */}
        <section id="user-responsibilities" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              User Responsibilities & Authority
            </h2>
          </div>
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Administrative Authority Requirement
            </p>
            <p>
              Hostel owners and administrators are strictly responsible for ensuring that they have the appropriate authority, legal consent, and legitimate basis to enter, manage, view, update, and process resident information within the Application.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All users are responsible for the accuracy, truthfulness, and lawful use of all information, documents, and media they enter or upload into HostelHub.
          </p>
        </section>

        {/* Section 5 */}
        <section id="resident-and-id-data" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              5
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Resident and Identification Data
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub provides tools for recording resident details and uploading identification documents (such as CNIC copies, photos, and emergency contact details). Owners and administrators must handle all identification data in accordance with applicable privacy laws and safeguard physical and digital access to such records.
          </p>
        </section>

        {/* Section 6 */}
        <section id="fees-and-payments" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              6
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Fees, Billing & Payment Records
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            HostelHub enables record-keeping of monthly dues, fee amounts, payment receipts, and payment statuses. HostelHub acts as a record-keeping and organizational tool; any financial agreements, physical collections, cash transactions, or banking settlements occur directly between hostel operators and residents.
          </p>
        </section>

        {/* Section 7 */}
        <section id="acceptable-use" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              7
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Acceptable Use Policy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You agree not to misuse HostelHub or assist anyone else in doing so. Specifically, you must not:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 list-disc pl-5 leading-relaxed">
            <li>Attempt unauthorized access to any part of the service, other users' accounts, or infrastructure systems.</li>
            <li>Use the application for any illegal, fraudulent, harmful, or unauthorized purpose.</li>
            <li>Interfere with or disrupt the integrity, security, or performance of the application or network.</li>
            <li>Upload malicious code, viruses, malware, or harmful attachments.</li>
            <li>Decompile, reverse-engineer, disassemble, or copy source code, designs, or proprietary algorithms.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="account-suspension" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              8
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Account Suspension & Termination
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or jeopardize system security. Users may voluntarily terminate their accounts at any time via the in-app deletion feature or the public Account Deletion page.
          </p>
        </section>

        {/* Section 9 */}
        <section id="data-and-privacy" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              9
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Data and Privacy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Our collection, usage, retention, and deletion of personal data are governed by the HostelHub <Link to="/privacy-policy" className="text-[#2563EB] underline font-semibold">Privacy Policy</Link>. By using the Service, you consent to data processing in accordance with that policy.
          </p>
        </section>

        {/* Section 10 */}
        <section id="intellectual-property" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              10
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Intellectual Property
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The HostelHub software, branding, logos, user interfaces, design systems, and documentation are the exclusive property of HostelHub and its licensors, protected by applicable copyright, trademark, and intellectual property laws.
          </p>
        </section>

        {/* Section 11 */}
        <section id="service-availability" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              11
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Service Availability & Disclaimer of Warranties
            </h2>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
            <p className="font-semibold text-[#0D1B2A]">
              No Guarantee of Uninterrupted or Error-Free Service
            </p>
            <p>
              HostelHub is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, statutory, or otherwise. HostelHub does not represent or guarantee that the service will be uninterrupted, error-free, completely secure, or free from server maintenance downtime.
            </p>
          </div>
        </section>

        {/* Section 12 */}
        <section id="limitation-of-liability" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              12
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Limitation of Liability
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To the maximum extent permitted by applicable law, HostelHub, its developers, affiliates, and service providers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data loss, business interruption, or financial disputes arising out of your use of or inability to use the Application.
          </p>
        </section>

        {/* Section 13 */}
        <section id="changes-to-terms" className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm shrink-0">
              13
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Changes to Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We reserve the right to revise or update these Terms from time to time. The latest version will always be posted on this page with the revised Effective Date. Continued use of HostelHub after modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* Section 14 */}
        <section id="contact-information" className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
              14
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D1B2A]">
              Contact Information
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            If you have questions, notices, or inquiries regarding these Terms & Conditions, please contact us:
          </p>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#0D1B2A]">HostelHub Legal & Terms Department</p>
              <p className="text-xs text-slate-500">Official inquiries and communications</p>
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
