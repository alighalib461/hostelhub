import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

// Layouts
import { AuthLayout } from '../layouts/AuthLayout'
import { OwnerLayout } from '../layouts/OwnerLayout'
import { WardenLayout } from '../layouts/WardenLayout'
import { ResidentLayout } from '../layouts/ResidentLayout'
import { PublicPolicyLayout } from '../layouts/PublicPolicyLayout'

// Public & Auth Pages
import { LoginPage } from '../../pages/auth/LoginPage'
import { SignupPage } from '../../pages/auth/SignupPage'
import { PublicRegisterPage } from '../../pages/auth/PublicRegisterPage'
import { AcceptWardenInvitePage } from '../../pages/auth/AcceptWardenInvitePage'
import { PrivacyPolicyPage } from '../../pages/public/PrivacyPolicyPage'
import { TermsAndConditionsPage } from '../../pages/public/TermsAndConditionsPage'
import { AccountDeletionPage } from '../../pages/public/AccountDeletionPage'

// Owner & Shared Operations Pages
import { OwnerDashboardPage } from '../../pages/owner/OwnerDashboardPage'
import { ResidentsListPage } from '../../pages/owner/ResidentsListPage'
import { ResidentDetailPage } from '../../pages/owner/ResidentDetailPage'
import { AddResidentPage } from '../../pages/owner/AddResidentPage'
import { RegistrationRequestsPage } from '../../pages/owner/RegistrationRequestsPage'
import { HostelsListPage } from '../../pages/owner/HostelsListPage'
import { HostelDetailPage } from '../../pages/owner/HostelDetailPage'
import { RoomsBedsPage } from '../../pages/owner/RoomsBedsPage'
import { FeesPage } from '../../pages/owner/FeesPage'
import { PaymentsPage } from '../../pages/owner/PaymentsPage'
import { ReportsPage } from '../../pages/owner/ReportsPage'
import { ComplaintsPage } from '../../pages/owner/ComplaintsPage'
import { SettingsPage } from '../../pages/owner/SettingsPage'
import { WardensPage } from '../../pages/owner/WardensPage'
import { PaymentVerificationsPage } from '../../pages/owner/PaymentVerificationsPage'
import { PaymentAccountsPage } from '../../pages/owner/PaymentAccountsPage'
import { HostelMenuPage } from '../../pages/owner/HostelMenuPage'
import { AnnouncementsPage } from '../../pages/owner/AnnouncementsPage'
import { ExpensesPage } from '../../pages/owner/ExpensesPage'

// Warden Pages
import { WardenDashboardPage } from '../../pages/warden/WardenDashboardPage'

// Resident Pages
import { ResidentDashboardPage } from '../../pages/resident/ResidentDashboardPage'
import { ResidentProfilePage } from '../../pages/resident/ResidentProfilePage'
import { ResidentHostelPage } from '../../pages/resident/ResidentHostelPage'
import { ResidentFeesPage } from '../../pages/resident/ResidentFeesPage'
import { ResidentPayOnlinePage } from '../../pages/resident/ResidentPayOnlinePage'
import { ResidentReceiptsPage } from '../../pages/resident/ResidentReceiptsPage'
import { ResidentMenuPage } from '../../pages/resident/ResidentMenuPage'
import { ResidentAnnouncementsPage } from '../../pages/resident/ResidentAnnouncementsPage'
import { ResidentDocumentsPage } from '../../pages/resident/ResidentDocumentsPage'
import { ResidentComplaintsPage } from '../../pages/resident/ResidentComplaintsPage'

// Skeleton for loading
import { Skeleton } from '../../components/ui/Skeleton'

// Route Guard for Owner
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'resident') {
    return <Navigate to="/resident/dashboard" replace />
  }

  if (role === 'warden') {
    return <Navigate to="/warden/dashboard" replace />
  }

  return <>{children}</>
}

// Route Guard for Warden
const WardenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'resident') {
    return <Navigate to="/resident/dashboard" replace />
  }

  if (role === 'owner') {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}

// Route Guard for Resident
const ResidentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'owner') {
    return <Navigate to="/app/dashboard" replace />
  }

  if (role === 'warden') {
    return <Navigate to="/warden/dashboard" replace />
  }

  return <>{children}</>
}

// Route Guard for Guest / Public Auth
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    )
  }

  if (isAuthenticated) {
    if (role === 'resident') {
      return <Navigate to="/resident/dashboard" replace />
    }
    if (role === 'warden') {
      return <Navigate to="/warden/dashboard" replace />
    }
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}

export const AppRouter: React.FC = () => {
  const { isAuthenticated, role } = useAuth()

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            role === 'resident' ? (
              <Navigate to="/resident/dashboard" replace />
            ) : role === 'warden' ? (
              <Navigate to="/warden/dashboard" replace />
            ) : (
              <Navigate to="/app/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Registration link for prospective residents */}
      <Route path="/register/:hostelId" element={<PublicRegisterPage />} />

      {/* Public Warden Invitation link */}
      <Route path="/invite/warden/:token" element={<AcceptWardenInvitePage />} />

      {/* Public Legal & Policy Pages (No login required, direct URL & reload support) */}
      <Route element={<PublicPolicyLayout />}>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/account-deletion" element={<AccountDeletionPage />} />
        <Route path="/delete-account" element={<AccountDeletionPage />} />
      </Route>

      {/* Public Auth Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Owner Protected Routes */}
      <Route
        path="/app"
        element={
          <OwnerRoute>
            <OwnerLayout />
          </OwnerRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="residents" element={<ResidentsListPage />} />
        <Route path="residents/new" element={<AddResidentPage />} />
        <Route path="residents/:id" element={<ResidentDetailPage />} />
        <Route path="registration-requests" element={<RegistrationRequestsPage />} />
        <Route path="hostels" element={<HostelsListPage />} />
        <Route path="hostels/:id" element={<HostelDetailPage />} />
        <Route path="rooms" element={<RoomsBedsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payment-verifications" element={<PaymentVerificationsPage />} />
        <Route path="payment-accounts" element={<PaymentAccountsPage />} />
        <Route path="menu" element={<HostelMenuPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="wardens" element={<WardensPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Warden Protected Routes */}
      <Route
        path="/warden"
        element={
          <WardenRoute>
            <WardenLayout />
          </WardenRoute>
        }
      >
        <Route index element={<Navigate to="/warden/dashboard" replace />} />
        <Route path="dashboard" element={<WardenDashboardPage />} />
        <Route path="residents" element={<ResidentsListPage />} />
        <Route path="residents/new" element={<AddResidentPage />} />
        <Route path="residents/:id" element={<ResidentDetailPage />} />
        <Route path="rooms" element={<RoomsBedsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payment-verifications" element={<PaymentVerificationsPage />} />
        <Route path="menu" element={<HostelMenuPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Resident Protected Routes */}
      <Route
        path="/resident"
        element={
          <ResidentRoute>
            <ResidentLayout />
          </ResidentRoute>
        }
      >
        <Route index element={<Navigate to="/resident/dashboard" replace />} />
        <Route path="dashboard" element={<ResidentDashboardPage />} />
        <Route path="profile" element={<ResidentProfilePage />} />
        <Route path="hostel" element={<ResidentHostelPage />} />
        <Route path="fees" element={<ResidentFeesPage />} />
        <Route path="pay-online" element={<ResidentPayOnlinePage />} />
        <Route path="receipts" element={<ResidentReceiptsPage />} />
        <Route path="menu" element={<ResidentMenuPage />} />
        <Route path="announcements" element={<ResidentAnnouncementsPage />} />
        <Route path="complaints" element={<ResidentComplaintsPage />} />
        <Route path="documents" element={<ResidentDocumentsPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
