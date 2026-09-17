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
  Building2,
  CreditCard,
  AlertCircle,
  Bed,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Receipt,
  PlusCircle,
  Clock,
  Sparkles,
  Search,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export const OwnerDashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const { selectedHostelId, selectedHostel, hostels } = useHostelContext()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [activeResidents, setActiveResidents] = useState<ResidentWithDetails[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([])
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequestWithDocs[]>([])
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

  // Selected receipt for modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const currentMonth = getCurrentFeeMonth()

  // Dynamic time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  useEffect(() => {
    loadDashboardData()
  }, [selectedHostelId])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [residents, payments, fees, roomsData, requests, complaintsSum] = await Promise.all([
        residentsService.getResidents({
          hostelId: selectedHostelId,
          status: 'active',
        }),
        paymentsService.getPayments({
          hostelId: selectedHostelId,
        }),
        feesService.getFeeSummary(selectedHostelId, currentMonth),
        roomsService.getRoomsWithBeds(selectedHostelId),
        registrationsService.getRegistrationRequests({
          hostelId: selectedHostelId,
          status: 'pending',
        }),
        complaintsService.getComplaintsSummary(selectedHostelId),
      ])

      setActiveResidents(residents)
      setRecentPayments(payments.slice(0, 5))
      setFeeSummary(fees)
      setPendingRequests(requests)
      setComplaintsSummary(complaintsSum)

      // Calculate occupancy
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
      console.error('Failed to load dashboard:', err)
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
    complaintsSummary.unresolved > 0 ||
    pendingRequests.length > 0 ||
    feeSummary.overdue > 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT DYNAMIC GREETING & CONTEXT HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200/80 text-[11px] font-semibold truncate max-w-full">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{selectedHostel ? selectedHostel.name : 'All Managed Hostels'}</span>
            <span className="text-blue-300">•</span>
            <span className="text-slate-600 shrink-0">{formatFeeMonth(currentMonth)}</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-[#172033] tracking-tight truncate">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Owner'} 👋
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            Here is your live operations summary and financial health overview.
          </p>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/app/residents/new')}
          >
            Add Resident
          </Button>
          <Button
            variant="teal"
            size="sm"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => navigate('/app/payments')}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE TOP QUICK ACTIONS (2 Prominent Side-by-Side Buttons)
         ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden grid grid-cols-2 gap-2.5">
        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => navigate('/app/residents/new')}
          className="w-full justify-center shadow-xs py-3 text-xs font-bold"
        >
          + Add Resident
        </Button>
        <Button
          variant="teal"
          size="md"
          leftIcon={<CreditCard className="w-4 h-4" />}
          onClick={() => navigate('/app/payments')}
          className="w-full justify-center shadow-xs py-3 text-xs font-bold"
        >
          Record Payment
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. 2 × 2 MOBILE KPI GRID (5-Second Executive Overview)
         ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
          <Skeleton className="h-28 sm:h-36 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Active Residents */}
          <StatCard
            title="Residents"
            value={activeResidents.length}
            subtitle={`${activeResidents.length} currently active`}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => navigate('/app/residents')}
          />

          {/* Bed Occupancy Rate */}
          <StatCard
            title="Occupancy"
            value={`${occupancyStats.occupancyRate}%`}
            subtitle={`${occupancyStats.occupiedBeds}/${occupancyStats.totalBeds} beds taken`}
            progressPercent={occupancyStats.occupancyRate}
            icon={<Bed className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => navigate('/app/rooms')}
          />

          {/* Month Collection */}
          <StatCard
            title="Collection"
            value={formatCurrency(feeSummary.collected)}
            subtitle={`Target: ${formatCurrency(feeSummary.expected)}`}
            progressPercent={collectionPercent}
            icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#16A085]" />}
            iconBg="bg-emerald-50"
            iconColor="text-[#16A085]"
            onClick={() => navigate('/app/fees')}
          />

          {/* Pending & Overdue */}
          <StatCard
            title="Outstanding"
            value={formatCurrency(feeSummary.total_outstanding)}
            subtitle={feeSummary.overdue > 0 ? `${formatCurrency(feeSummary.overdue)} overdue` : 'Up to date'}
            icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#E74C3C]" />}
            iconBg={feeSummary.overdue > 0 ? 'bg-rose-50' : 'bg-amber-50'}
            iconColor={feeSummary.overdue > 0 ? 'text-[#E74C3C]' : 'text-amber-600'}
            onClick={() => navigate('/app/fees')}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. "NEEDS ATTENTION" OPERATIONAL HUB
         ───────────────────────────────────────────────────────────── */}
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
            {/* Unresolved Complaints */}
            {complaintsSummary.unresolved > 0 && (
              <div
                onClick={() => navigate('/app/complaints')}
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

            {/* Pending Admission Requests */}
            {pendingRequests.length > 0 && (
              <div
                onClick={() => navigate('/app/registration-requests')}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 cursor-pointer hover:bg-amber-100/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-900 truncate">
                      {pendingRequests.length} Pending Admission{pendingRequests.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-amber-700 truncate">Online Registrations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
            )}

            {/* Overdue Fees */}
            {feeSummary.overdue > 0 && (
              <div
                onClick={() => navigate('/app/fees')}
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
            <span>All operations normal. No pending admission requests, open complaints, or overdue fees!</span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. OCCUPANCY & MONTHLY COLLECTION BREAKDOWN
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Occupancy Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">Occupancy Distribution</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/rooms')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs text-blue-600 font-semibold"
              >
                Manage Beds
              </Button>
            </div>

            {/* Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Occupancy Rate</span>
                <span className="font-bold text-[#172033]">{occupancyStats.occupancyRate}%</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#2563EB] transition-all duration-500"
                  style={{ width: `${occupancyStats.occupancyRate}%` }}
                />
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${100 - occupancyStats.occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium">Total</p>
                <p className="text-sm sm:text-base font-bold text-[#172033] mt-0.5">
                  {occupancyStats.totalBeds}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl border border-blue-200/80">
                <p className="text-blue-900 text-[10px] sm:text-xs font-medium">Occupied</p>
                <p className="text-sm sm:text-base font-bold text-blue-700 mt-0.5">
                  {occupancyStats.occupiedBeds}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <p className="text-emerald-900 text-[10px] sm:text-xs font-medium">Free</p>
                <p className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5">
                  {occupancyStats.availableBeds}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Billing Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">Fee Collection Summary</h3>
              <p className="text-xs text-slate-500">
                Month: {formatFeeMonth(currentMonth)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/fees')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Fee Ledger
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Expected</span>
              <p className="text-xs sm:text-base font-bold text-[#172033] mt-0.5 truncate">
                {formatCurrency(feeSummary.expected)}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <span className="text-[10px] sm:text-xs text-emerald-800 font-medium">Collected</span>
              <p className="text-xs sm:text-base font-bold text-emerald-700 mt-0.5 truncate">
                {formatCurrency(feeSummary.collected)}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-50 rounded-xl border border-amber-200/80">
              <span className="text-[10px] sm:text-xs text-amber-800 font-medium">Pending</span>
              <p className="text-xs sm:text-base font-bold text-amber-700 mt-0.5 truncate">
                {formatCurrency(feeSummary.pending)}
              </p>
            </div>
            <div className="p-2.5 sm:p-3 bg-rose-50 rounded-xl border border-rose-200/80">
              <span className="text-[10px] sm:text-xs text-rose-800 font-medium">Overdue</span>
              <p className="text-xs sm:text-base font-bold text-rose-700 mt-0.5 truncate">
                {formatCurrency(feeSummary.overdue)}
              </p>
            </div>
          </div>

          {/* Collection Progress bar */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Recovery Rate</span>
              <span className="font-bold text-[#172033]">{collectionPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. RECENT PAYMENTS & RESIDENTS LISTS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Payments & 1-Tap Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">Recent Payments</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/payments')}
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

        {/* Recent Active Residents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">Recent Residents</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/residents')}
              className="text-xs font-semibold text-blue-600"
            >
              All Residents →
            </Button>
          </div>

          {activeResidents.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No active residents registered yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeResidents.slice(0, 5).map((res) => (
                <div
                  key={res.id}
                  onClick={() => navigate(`/app/residents/${res.id}`)}
                  className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 px-1 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                      {res.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#172033] truncate">{res.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {res.resident_id} • Room {res.current_assignment?.room?.room_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#172033]">
                      {formatCurrency(res.monthly_fee)}
                    </p>
                    <StatusBadge status={res.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. MULTI-HOSTEL PORTFOLIO COMPARISON (If multiple hostels)
         ───────────────────────────────────────────────────────────── */}
      {hostels.length > 1 && selectedHostelId === 'all' && (
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-[#172033]">Hostel Portfolio Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hostels.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/app/hostels/${h.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#172033] truncate">{h.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{h.address}</p>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] shrink-0 ml-2">
                    {h.total_beds && h.total_beds > 0
                      ? `${Math.round(((h.occupied_beds || 0) / h.total_beds) * 100)}% Occ`
                      : '0% Occ'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400">Rooms</span>
                    <p className="font-bold text-[#172033]">{h.rooms_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Beds</span>
                    <p className="font-bold text-[#172033]">{h.total_beds || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Residents</span>
                    <p className="font-bold text-emerald-600">{h.active_residents_count || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

