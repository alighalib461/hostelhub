import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { residentsService } from '../../services/residents/residentsService'
import { feesService } from '../../services/fees/feesService'
import { paymentsService } from '../../services/payments/paymentsService'
import { roomsService } from '../../services/rooms/roomsService'
import { registrationsService } from '../../services/registrations/registrationsService'
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
} from 'lucide-react'

export const OwnerDashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const { selectedHostelId, selectedHostel, hostels } = useHostelContext()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [activeResidents, setActiveResidents] = useState<ResidentWithDetails[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([])
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequestWithDocs[]>([])
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

  useEffect(() => {
    loadDashboardData()
  }, [selectedHostelId])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [residents, payments, fees, roomsData, requests] = await Promise.all([
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
      ])

      setActiveResidents(residents)
      setRecentPayments(payments.slice(0, 5))
      setFeeSummary(fees)
      setPendingRequests(requests)

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

  return (
    <div className="space-y-8">
      {/* 1. Greeting & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{selectedHostel ? selectedHostel.name : 'All Managed Hostels'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Hello, {profile?.full_name || 'Owner'} 👋
          </h2>
          <p className="text-xs text-[#64748B]">
            Here is your live hostel operations and collection overview for{' '}
            <strong className="text-[#172033]">{formatFeeMonth(currentMonth)}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Building2 className="w-4 h-4" />}
            onClick={() => navigate('/app/hostels')}
          >
            Add Hostel
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards (5-Second Executive Overview) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Residents */}
          <StatCard
            title="Total Residents"
            value={activeResidents.length}
            subtitle={`${activeResidents.length} currently active`}
            icon={<Users className="w-6 h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => navigate('/app/residents')}
          />

          {/* This Month Collection */}
          <StatCard
            title="Month Collection"
            value={formatCurrency(feeSummary.collected)}
            subtitle={`Target: ${formatCurrency(feeSummary.expected)}`}
            icon={<CreditCard className="w-6 h-6 text-[#16A085]" />}
            iconBg="bg-emerald-50"
            iconColor="text-[#16A085]"
            onClick={() => navigate('/app/fees')}
          />

          {/* Outstanding / Overdue */}
          <StatCard
            title="Pending & Overdue"
            value={formatCurrency(feeSummary.total_outstanding)}
            subtitle={`Overdue: ${formatCurrency(feeSummary.overdue)}`}
            icon={<AlertCircle className="w-6 h-6 text-[#E74C3C]" />}
            iconBg={feeSummary.overdue > 0 ? 'bg-rose-50' : 'bg-amber-50'}
            iconColor={feeSummary.overdue > 0 ? 'text-[#E74C3C]' : 'text-amber-600'}
            onClick={() => navigate('/app/fees')}
          />

          {/* Bed Occupancy Rate */}
          <StatCard
            title="Bed Occupancy"
            value={`${occupancyStats.occupancyRate}%`}
            subtitle={`${occupancyStats.occupiedBeds} of ${occupancyStats.totalBeds} beds taken (${occupancyStats.availableBeds} free)`}
            icon={<Bed className="w-6 h-6 text-[#2563EB]" />}
            iconBg="bg-blue-50"
            iconColor="text-[#2563EB]"
            onClick={() => navigate('/app/rooms')}
          />
        </div>
      )}

      {/* 3. Attention Required Alert Bar */}
      {(pendingRequests.length > 0 || feeSummary.overdue > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Action Items Requiring Attention</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-amber-800 mt-1">
                  {pendingRequests.length > 0 && (
                    <span className="font-semibold">
                      • {pendingRequests.length} pending admission request(s) awaiting approval
                    </span>
                  )}
                  {feeSummary.overdue > 0 && (
                    <span className="font-semibold">
                      • {formatCurrency(feeSummary.overdue)} in overdue fees this month
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pendingRequests.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/app/registration-requests')}
                >
                  Review Requests ({pendingRequests.length})
                </Button>
              )}
              {feeSummary.overdue > 0 && (
                <Button variant="outline" size="sm" onClick={() => navigate('/app/fees')}>
                  View Overdue Fees
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Occupancy Matrix & Collection Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Occupancy Overview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/rooms')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Manage
              </Button>
            </div>

            {/* Visual Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Occupancy Rate</span>
                <span className="font-bold text-text-primary">{occupancyStats.occupancyRate}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-brand transition-all duration-500"
                  style={{ width: `${occupancyStats.occupancyRate}%` }}
                />
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${100 - occupancyStats.occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-text-secondary font-medium">Total Beds</p>
                <p className="text-base font-bold text-text-primary mt-0.5">
                  {occupancyStats.totalBeds}
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200/80">
                <p className="text-blue-900 font-medium">Occupied</p>
                <p className="text-base font-bold text-blue-700 mt-0.5">
                  {occupancyStats.occupiedBeds}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <p className="text-emerald-900 font-medium">Available</p>
                <p className="text-base font-bold text-emerald-700 mt-0.5">
                  {occupancyStats.availableBeds}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-text-secondary flex items-center justify-between">
            <span>Bed assignment is locked & atomic</span>
            <span className="text-emerald-600 font-semibold">● Realtime Sync</span>
          </div>
        </div>

        {/* Fee Billing Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Fee Collection Summary</h3>
              <p className="text-xs text-text-secondary">
                Period: {formatFeeMonth(currentMonth)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/fees')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Fee Ledger
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-text-secondary font-medium">Expected</span>
              <p className="text-base sm:text-lg font-bold text-text-primary mt-1">
                {formatCurrency(feeSummary.expected)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
              <span className="text-[11px] text-emerald-800 font-medium">Collected</span>
              <p className="text-base sm:text-lg font-bold text-emerald-700 mt-1">
                {formatCurrency(feeSummary.collected)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
              <span className="text-[11px] text-amber-800 font-medium">Pending</span>
              <p className="text-base sm:text-lg font-bold text-amber-700 mt-1">
                {formatCurrency(feeSummary.pending)}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80">
              <span className="text-[11px] text-rose-800 font-medium">Overdue</span>
              <p className="text-base sm:text-lg font-bold text-rose-700 mt-1">
                {formatCurrency(feeSummary.overdue)}
              </p>
            </div>
          </div>

          {/* Simple collection progress bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Collection Recovery Progress</span>
              <span className="font-bold text-text-primary">
                {feeSummary.expected > 0
                  ? `${Math.round((feeSummary.collected / feeSummary.expected) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    feeSummary.expected > 0
                      ? Math.min(100, Math.round((feeSummary.collected / feeSummary.expected) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Admissions & Recent Payments Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-brand" />
              <h3 className="text-base font-bold text-text-primary">Recent Active Residents</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/residents')}
              className="text-xs"
            >
              View All
            </Button>
          </div>

          {activeResidents.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-secondary">
              No active residents registered yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeResidents.slice(0, 5).map((res) => (
                <div
                  key={res.id}
                  onClick={() => navigate(`/app/residents/${res.id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {res.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{res.full_name}</p>
                      <p className="text-[11px] text-text-secondary font-mono">
                        {res.resident_id} • Room {res.current_assignment?.room?.room_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-text-primary">
                      {formatCurrency(res.monthly_fee)}/mo
                    </p>
                    <StatusBadge status={res.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments & Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-text-primary">Recent Payments</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/payments')}
              className="text-xs"
            >
              View Ledger
            </Button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-secondary">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-brand">
                        {p.receipt_number}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-text-primary font-medium truncate mt-0.5">
                      {p.resident?.full_name || 'Resident'}
                    </p>
                    <p className="text-[10px] text-text-secondary">{formatDate(p.payment_date)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReceipt(p.id)}
                      className="text-xs px-2.5 py-1 h-7"
                    >
                      Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Multi-Hostel Comparison Cards */}
      {hostels.length > 1 && selectedHostelId === 'all' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-text-primary">Hostel Portfolio Comparison</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostels.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/app/hostels/${h.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{h.name}</h4>
                    <p className="text-xs text-text-secondary truncate max-w-[200px]">{h.address}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-brand">
                    {h.total_beds && h.total_beds > 0
                      ? `${Math.round(((h.occupied_beds || 0) / h.total_beds) * 100)}% Occ`
                      : '0% Occ'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-text-secondary">Rooms</span>
                    <p className="font-bold text-text-primary">{h.rooms_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary">Beds</span>
                    <p className="font-bold text-text-primary">{h.total_beds || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary">Residents</span>
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
