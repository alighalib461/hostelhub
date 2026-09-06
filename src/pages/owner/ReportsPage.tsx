import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { reportsService } from '../../services/reports/reportsService'
import { residentsService } from '../../services/residents/residentsService'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { Skeleton } from '../../components/ui/Skeleton'
import { exportToCSV } from '../../utils/exportUtils'
import {
  formatCurrency,
  formatDate,
  formatFeeMonth,
  formatCNIC,
  formatPhone,
} from '../../utils/formatters'
import {
  BarChart3,
  Download,
  Printer,
  DollarSign,
  Bed,
  AlertCircle,
  Users,
  FileSpreadsheet,
} from 'lucide-react'

export const ReportsPage: React.FC = () => {
  const { selectedHostelId } = useHostelContext()
  const [activeTab, setActiveTab] = useState<'collection' | 'occupancy' | 'pending' | 'residents'>('collection')
  const [isLoading, setIsLoading] = useState(true)

  // Report datasets
  const [collectionData, setCollectionData] = useState<any>(null)
  const [occupancyData, setOccupancyData] = useState<any>(null)
  const [pendingData, setPendingData] = useState<any>(null)
  const [residentsData, setResidentsData] = useState<any[]>([])

  useEffect(() => {
    loadReports()
  }, [selectedHostelId, activeTab])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'collection') {
        const data = await reportsService.getCollectionReport(selectedHostelId)
        setCollectionData(data)
      } else if (activeTab === 'occupancy') {
        const data = await reportsService.getOccupancyReport(selectedHostelId)
        setOccupancyData(data)
      } else if (activeTab === 'pending') {
        const data = await reportsService.getPendingFeesReport(selectedHostelId)
        setPendingData(data)
      } else if (activeTab === 'residents') {
        const data = await residentsService.getResidents({ hostelId: selectedHostelId })
        setResidentsData(data)
      }
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    if (activeTab === 'collection' && collectionData) {
      const headers = ['Receipt #', 'Resident Name', 'Resident ID', 'Hostel', 'Billing Month', 'Amount', 'Date', 'Method', 'Status']
      const rows = collectionData.payments.map((p: any) => [
        p.receipt_number,
        p.resident?.full_name || '',
        p.resident?.resident_id || '',
        p.hostel?.name || '',
        p.fee_charge?.fee_month || '',
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
      ])
      exportToCSV(`HostelHUB-Collection-Report-${timestamp}`, headers, rows)
    } else if (activeTab === 'occupancy' && occupancyData) {
      const headers = ['Hostel', 'Room Number', 'Capacity', 'Occupied Beds', 'Available Beds', 'Occupancy Rate %']
      const rows = occupancyData.rooms.map((r: any) => [
        r.hostel?.name || '',
        r.room_number,
        r.capacity,
        r.occupied_beds,
        r.available_beds,
        `${r.occupancy_rate}%`,
      ])
      exportToCSV(`HostelHUB-Occupancy-Report-${timestamp}`, headers, rows)
    } else if (activeTab === 'pending' && pendingData) {
      const headers = ['Resident Name', 'Resident ID', 'Phone', 'Hostel', 'Billing Month', 'Due Date', 'Amount Due', 'Paid', 'Remaining Balance', 'Status']
      const rows = pendingData.charges.map((c: any) => [
        c.resident?.full_name || '',
        c.resident?.resident_id || '',
        c.resident?.phone || '',
        c.hostel?.name || '',
        c.fee_month,
        c.due_date,
        c.amount_due,
        c.amount_paid,
        c.remaining_amount,
        c.status,
      ])
      exportToCSV(`HostelHUB-Pending-Fees-Report-${timestamp}`, headers, rows)
    } else if (activeTab === 'residents' && residentsData) {
      const headers = ['Resident ID', 'Full Name', 'Father Name', 'CNIC', 'Phone', 'Hostel', 'Room', 'Bed', 'Monthly Fee', 'Deposit', 'Status', 'Admission Date']
      const rows = residentsData.map((r: any) => [
        r.resident_id,
        r.full_name,
        r.father_name,
        r.cnic,
        r.phone,
        r.hostel?.name || '',
        r.current_assignment?.room?.room_number || '',
        r.current_assignment?.bed?.bed_number || '',
        r.monthly_fee,
        r.security_deposit,
        r.status,
        r.admission_date,
      ])
      exportToCSV(`HostelHUB-Resident-Roster-${timestamp}`, headers, rows)
    }
  }

  const tabs = [
    { id: 'collection', label: 'Collection Report', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'occupancy', label: 'Occupancy Report', icon: <Bed className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending & Aging Fees', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'residents', label: 'Resident Master Roster', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Reports & Business Analytics
          </h2>
          <p className="text-xs text-text-secondary">
            Aggregated database summaries, financial reconciliation, and exportable datasets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export to CSV
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {/* TAB 1: Collection Report */}
          {activeTab === 'collection' && collectionData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-text-secondary font-medium">Total Valid Collection</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(collectionData.totalCollected)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-text-secondary font-medium">Total Receipts Issued</span>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {collectionData.totalTransactions}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-rose-800 font-medium">Voided Records</span>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{collectionData.voidedCount}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Resident</th>
                      <th className="py-3 px-4">Hostel</th>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collectionData.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-mono font-bold text-blue-brand">{p.receipt_number}</td>
                        <td className="py-3 px-4 font-semibold text-text-primary">{p.resident?.full_name}</td>
                        <td className="py-3 px-4">{p.hostel?.name}</td>
                        <td className="py-3 px-4">{formatFeeMonth(p.fee_charge?.fee_month)}</td>
                        <td className="py-3 px-4">{formatDate(p.payment_date)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-4 capitalize">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Occupancy Report */}
          {activeTab === 'occupancy' && occupancyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-text-secondary font-medium">Total Beds</span>
                  <p className="text-xl font-bold text-text-primary mt-1">{occupancyData.totalBeds}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-blue-900 font-medium">Occupied Beds</span>
                  <p className="text-xl font-bold text-blue-brand mt-1">{occupancyData.occupiedBeds}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-emerald-900 font-medium">Available Beds</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{occupancyData.availableBeds}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-text-secondary font-medium">Overall Rate</span>
                  <p className="text-xl font-bold text-text-primary mt-1">{occupancyData.occupancyRate}%</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Hostel</th>
                      <th className="py-3 px-4">Room Number</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Occupied</th>
                      <th className="py-3 px-4">Available</th>
                      <th className="py-3 px-4">Occupancy Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {occupancyData.rooms.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-3 px-4 font-semibold text-text-primary">{r.hostel?.name}</td>
                        <td className="py-3 px-4 font-bold">Room {r.room_number}</td>
                        <td className="py-3 px-4">{r.capacity} Beds</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">{r.occupied_beds}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">{r.available_beds}</td>
                        <td className="py-3 px-4 font-bold">{r.occupancy_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Pending & Aging Fees */}
          {activeTab === 'pending' && pendingData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-rose-800 font-medium">Total Outstanding Balance</span>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {formatCurrency(pendingData.totalOutstanding)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
                  <span className="text-text-secondary font-medium">Pending Unsettled Invoices</span>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {pendingData.totalPendingCount}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Resident</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Hostel</th>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Total Due</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Remaining</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingData.charges.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-bold text-text-primary">{c.resident?.full_name}</td>
                        <td className="py-3 px-4 text-text-secondary">{formatPhone(c.resident?.phone)}</td>
                        <td className="py-3 px-4">{c.hostel?.name}</td>
                        <td className="py-3 px-4">{formatFeeMonth(c.fee_month)}</td>
                        <td className="py-3 px-4">{formatDate(c.due_date)}</td>
                        <td className="py-3 px-4">{formatCurrency(c.amount_due)}</td>
                        <td className="py-3 px-4 text-emerald-600">{formatCurrency(c.amount_paid)}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {formatCurrency(c.remaining_amount)}
                        </td>
                        <td className="py-3 px-4 capitalize">{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Resident Master Roster */}
          {activeTab === 'residents' && residentsData && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Resident ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">CNIC</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Hostel / Room</th>
                    <th className="py-3 px-4">Fee / Mo</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residentsData.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-3 px-4 font-mono font-bold text-blue-brand">{r.resident_id}</td>
                      <td className="py-3 px-4 font-bold text-text-primary">{r.full_name}</td>
                      <td className="py-3 px-4 font-mono">{formatCNIC(r.cnic)}</td>
                      <td className="py-3 px-4">{formatPhone(r.phone)}</td>
                      <td className="py-3 px-4">
                        {r.hostel?.name} • Room {r.current_assignment?.room?.room_number || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(r.monthly_fee)}</td>
                      <td className="py-3 px-4 capitalize">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
