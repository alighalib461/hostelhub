import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { residentsService } from '../../services/residents/residentsService'
import { feesService } from '../../services/fees/feesService'
import { paymentsService } from '../../services/payments/paymentsService'
import { roomsService } from '../../services/rooms/roomsService'
import { registrationsService } from '../../services/registrations/registrationsService'
import { complaintsService } from '../../services/complaints/complaintsService'
import { onlinePaymentsService } from '../../services/onlinePayments/onlinePaymentsService'
import { StatCard } from '../../components/shared/StatCard'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ReceiptModal } from '../../components/shared/ReceiptModal'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  ResidentWithDetails,
  PaymentWithDetails,
  ReceiptData,
  RegistrationRequestWithDocs,
} from '../../types/models'
import { formatCurrency, formatDate, formatFeeMonth, getCurrentFeeMonth } from '../../utils/formatters'
import {
  Users,
  CreditCard,
  AlertCircle,
  Bed,
  UserPlus,
  ArrowRight,
  Receipt,
  PlusCircle,
  Sparkles,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UtensilsCrossed,
  Bell,
} from 'lucide-react'

export const WardenDashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const { selectedHostelId, selectedHostel, wardenPermissions } = useHostelContext()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [activeResidents, setActiveResidents] = useState<ResidentWithDetails[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([])
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequestWithDocs[]>([])
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0)
  const [complaintsSummary, setComplaintsSummary] = useState({
    total: 0,
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    unresolved: 0,
  })
  const [feeSummary, setFeeSummary] = useState({
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    total_outstanding: 0,
  })
  const [occupancyStats, setOccupancyStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyRate: 0,
  })

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const currentMonth = getCurrentFeeMonth()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  useEffect(() => {
    if (selectedHostelId) {
      loadDashboardData()
    }
  }, [selectedHostelId])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [residents, payments, fees, roomsData, requests, complaintsSum, verifications] =
        await Promise.all([
          wardenPermissions.can_view_residents
            ? residentsService.getResidents({ hostelId: selectedHostelId, status: 'active' })
            : Promise.resolve([]),
          wardenPermissions.can_record_payments
            ? paymentsService.getPayments({ hostelId: selectedHostelId })
            : Promise.resolve([]),
          wardenPermissions.can_view_fees
            ? feesService.getFeeSummary(selectedHostelId, currentMonth)
            : Promise.resolve({ expected: 0, collected: 0, pending: 0, overdue: 0, total_outstanding: 0 }),
          wardenPermissions.can_manage_rooms || wardenPermissions.can_manage_beds
            ? roomsService.getRoomsWithBeds(selectedHostelId)
            : Promise.resolve([]),
          registrationsService.getRegistrationRequests({ hostelId: selectedHostelId, status: 'pending' }),
          wardenPermissions.can_manage_complaints
            ? complaintsService.getComplaintsSummary(selectedHostelId)
            : Promise.resolve({ total: 0, submitted: 0, in_progress: 0, resolved: 0, unresolved: 0 }),
          wardenPermissions.can_verify_online_payments
            ? onlinePaymentsService.getPendingCount(selectedHostelId)
            : Promise.resolve(0),
        ])

      setActiveResidents(residents)
      setRecentPayments(payments.slice(0, 5))
      setFeeSummary(fees)
      setPendingRequests(requests)
      setComplaintsSummary(complaintsSum)
      setPendingVerificationsCount(verifications)

      let totalB = 0
      let occB = 0
      let availB = 0
      roomsData.forEach((room) => {
        totalB += room.beds.length
        occB += room.occupied_count
        availB += room.available_count
      })
      const rate = totalB > 0 ? Math.round((occB / totalB) * 100) : 0
      setOccupancyStats({
        totalBeds: totalB,
        occupiedBeds: occB,
        availableBeds: availB,
        occupancyRate: rate,
      })
    } catch (err) {
      console.error('Failed to load warden dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const data = await paymentsService.getReceiptData(paymentId)
      if (data) {
        setSelectedReceipt(data)
        setIsReceiptModalOpen(true)
      }
    } catch (err) {
      console.error('Error fetching receipt:', err)
    }
  }

  const collectionPercent =
    feeSummary.expected > 0
      ? Math.min(100, Math.round((feeSummary.collected / feeSummary.expected) * 100))
      : 0

  const hasActionItems =
    pendingVerificationsCount > 0 ||
    complaintsSummary.unresolved > 0 ||
    pendingRequests.length > 0 ||
    feeSummary.overdue > 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Greeting & Hostel Badge */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 text-[11px] font-semibold truncate max-w-full">
            <Sparkles className="w-3 h-3 shrink-0 text-teal-600" />
            <span className="truncate">{selectedHostel?.name || 'Assigned Hostel'}</span>
            <span className="text-teal-300">•</span>
            <span className="text-slate-600 shrink-0">{formatFeeMonth(currentMonth)}</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-[#172033] tracking-tight truncate">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Warden'} 👋
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            Here is your live daily operations dashboard for {selectedHostel?.name || 'your assigned hostel'}.
          </p>
        </div>

        {/* Desktop Quick Action Buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {wardenPermissions.can_add_residents && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => navigate('/warden/residents/new')}
            >
              Add Resident
            </Button>
          )}
          {wardenPermissions.can_record_payments && (
            <Button
              variant="teal"
              size="sm"
              leftIcon={<CreditCard className="w-4 h-4" />}
              onClick={() => navigate('/warden/payments')}
            >
              Record Payment
            </Button>
          )}
          {wardenPermissions.can_verify_online_payments && pendingVerificationsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4 text-indigo-600" />}
              onClick={() => navigate('/warden/payment-verifications')}
              className="border-indigo-200 text-indigo-700 bg-indigo-50/60 font-bold"
            >
              Verify Online ({pendingVerificationsCount})
            </Button>
          )}
        </div>
      </div>

      {/* 2. Mobile Quick Actions */}
      <div className="sm:hidden grid grid-cols-2 gap-2.5">
        {wardenPermissions.can_add_residents && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/warden/residents/new')}
            className="w-full justify-center shadow-xs py-3 text-xs font-bold"
          >
            + Add Resident
          </Button>
        )}
        {wardenPermissions.can_record_payments && (
          <Button
            variant="teal"
            size="md"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => navigate('/warden/payments')}
            className="w-full justify-center shadow-xs py-3 text-xs font-bold"
          >
            Record Payment
          </Button>
        )}
      </div>

      {/* 3. 2 × 2 KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard
            title="Residents"
            value={activeResidents.length}
            subtitle={`${activeResidents.length} active in hostel`}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => wardenPermissions.can_view_residents && navigate('/warden/residents')}
          />

          <StatCard
            title="Occupancy"
            value={`${occupancyStats.occupancyRate}%`}
            subtitle={`${occupancyStats.occupiedBeds}/${occupancyStats.totalBeds} beds taken`}
            progressPercent={occupancyStats.occupancyRate}
            icon={<Bed className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => (wardenPermissions.can_manage_rooms || wardenPermissions.can_manage_beds) && navigate('/warden/rooms')}
          />

          <StatCard
            title="Collection"
            value={formatCurrency(feeSummary.collected)}
            subtitle={`Target: ${formatCurrency(feeSummary.expected)}`}
            progressPercent={collectionPercent}
            icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#16A085]" />}
            iconBg="bg-emerald-50"
            iconColor="text-[#16A085]"
            onClick={() => wardenPermissions.can_view_fees && navigate('/warden/fees')}
          />

          <StatCard
            title="Outstanding"
            value={formatCurrency(feeSummary.total_outstanding)}
            subtitle={feeSummary.overdue > 0 ? `${formatCurrency(feeSummary.overdue)} overdue` : 'Up to date'}
            icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#E74C3C]" />}
            iconBg={feeSummary.overdue > 0 ? 'bg-rose-50' : 'bg-amber-50'}
            iconColor={feeSummary.overdue > 0 ? 'text-[#E74C3C]' : 'text-amber-600'}
            onClick={() => wardenPermissions.can_view_fees && navigate('/warden/fees')}
          />
        </div>
      )}

      {/* 4. Operations Attention Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasActionItems ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            )}
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Operations Attention Hub
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Live Synced</span>
        </div>

        {hasActionItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Pending Online Verifications */}
            {wardenPermissions.can_verify_online_payments && pendingVerificationsCount > 0 && (
              <div
                onClick={() => navigate('/warden/payment-verifications')}
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/90 border border-indigo-200 cursor-pointer hover:bg-indigo-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-950 truncate">
                      {pendingVerificationsCount} Online Payment{pendingVerificationsCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-indigo-700 truncate">Pending Verification</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-600 shrink-0" />
              </div>
            )}

            {/* Unresolved Complaints */}
            {wardenPermissions.can_manage_complaints && complaintsSummary.unresolved > 0 && (
              <div
                onClick={() => navigate('/warden/complaints')}
                className="flex items-center justify-between p-3 rounded-xl bg-rose-50/80 border border-rose-200/90 cursor-pointer hover:bg-rose-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-rose-900 truncate">
                      {complaintsSummary.submitted > 0
                        ? `${complaintsSummary.submitted} New Ticket${complaintsSummary.submitted > 1 ? 's' : ''}`
                        : `${complaintsSummary.unresolved} Active Ticket${complaintsSummary.unresolved > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-[10px] text-rose-700 truncate">Maintenance & Complaints</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
              </div>
            )}

            {/* Overdue Fees */}
            {wardenPermissions.can_view_fees && feeSummary.overdue > 0 && (
              <div
                onClick={() => navigate('/warden/fees')}
                className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 border border-orange-200/90 cursor-pointer hover:bg-orange-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-orange-900 truncate">
                      {formatCurrency(feeSummary.overdue)} Overdue
                    </p>
                    <p className="text-[10px] text-orange-700 truncate">Requires Fee Collection</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All operations normal. No pending online verifications, open complaints, or overdue fees!</span>
          </div>
        )}
      </div>

      {/* 5. Quick Modules Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {wardenPermissions.can_manage_menu && (
          <div
            onClick={() => navigate('/warden/menu')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-primary">Hostel Menu</span>
          </div>
        )}

        {wardenPermissions.can_create_announcements && (
          <div
            onClick={() => navigate('/warden/announcements')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-primary">Announcements</span>
          </div>
        )}

        {wardenPermissions.can_manage_rooms && (
          <div
            onClick={() => navigate('/warden/rooms')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Bed className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-primary">Manage Beds</span>
          </div>
        )}

        {wardenPermissions.can_manage_complaints && (
          <div
            onClick={() => navigate('/warden/complaints')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-text-primary">Complaints</span>
          </div>
        )}
      </div>

      {/* 6. Recent Payments Table */}
      {wardenPermissions.can_record_payments && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">Recent Payments</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/warden/payments')}
              className="text-xs font-semibold text-blue-600"
            >
              All Payments →
            </Button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#2563EB]">
                        {p.receipt_number}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-[#172033] font-bold truncate mt-0.5">
                      {p.resident?.full_name || 'Resident'}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(p.payment_date)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReceipt(p.id)}
                      className="text-[11px] px-2 py-1 h-7 border-slate-300 font-semibold"
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  )
}
