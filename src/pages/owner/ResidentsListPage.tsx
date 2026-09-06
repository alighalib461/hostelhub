import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { residentsService } from '../../services/residents/residentsService'
import { ResidentWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { SearchBar } from '../../components/shared/SearchBar'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, formatDate, formatCNIC, formatPhone } from '../../utils/formatters'
import {
  Users,
  UserPlus,
  Phone,
  DoorOpen,
  Filter,
  Eye,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export const ResidentsListPage: React.FC = () => {
  const { selectedHostelId } = useHostelContext()
  const navigate = useNavigate()

  const [residents, setResidents] = useState<ResidentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'left'>('active')

  useEffect(() => {
    loadResidents()
  }, [selectedHostelId, searchTerm, statusFilter])

  const loadResidents = async () => {
    setIsLoading(true)
    try {
      const data = await residentsService.getResidents({
        hostelId: selectedHostelId,
        search: searchTerm,
        status: statusFilter,
      })
      setResidents(data)
    } catch (err) {
      console.error('Failed to load residents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Resident Management
          </h2>
          <p className="text-xs text-text-secondary">
            View, search, and manage all registered hostel residents and their room assignments
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => navigate('/app/residents/new')}
        >
          Add New Resident
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, resident ID, CNIC, or phone..."
          className="max-w-lg"
        />

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'active', 'left'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-navy-primary shadow-xs'
                    : 'text-slate-500 hover:text-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resident List / Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : residents.length === 0 ? (
        <EmptyState
          title="No residents found"
          description={
            searchTerm
              ? `No resident matches "${searchTerm}". Try a different search term or clear the filter.`
              : 'You have not added any residents yet. Click below to add your first resident with bed assignment.'
          }
          icon={<Users className="w-8 h-8" />}
          actionLabel="Add Resident"
          actionIcon={<UserPlus className="w-4 h-4" />}
          onAction={() => navigate('/app/residents/new')}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-text-secondary uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">CNIC / Contact</th>
                  <th className="py-3.5 px-4">Hostel / Room</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Current Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {residents.map((res) => (
                  <tr
                    key={res.id}
                    onClick={() => navigate(`/app/residents/${res.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {res.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{res.full_name}</p>
                          <p className="font-mono text-[11px] text-text-secondary">{res.resident_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-text-primary">{formatPhone(res.phone)}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{formatCNIC(res.cnic)}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-text-primary">{res.hostel?.name || '—'}</p>
                      <p className="text-text-secondary text-[11px]">
                        {res.current_assignment?.room?.room_number
                          ? `Room ${res.current_assignment.room.room_number} • Bed ${res.current_assignment.bed?.bed_number || '—'}`
                          : 'No Bed Assigned'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {formatCurrency(res.monthly_fee)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          (res.current_month_balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(res.current_month_balance)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={res.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/residents/${res.id}`)
                        }}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Zero horizontal scrolling) */}
          <div className="md:hidden space-y-3">
            {residents.map((res) => (
              <div
                key={res.id}
                onClick={() => navigate(`/app/residents/${res.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {res.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-text-primary text-sm truncate">{res.full_name}</h4>
                      <p className="font-mono text-xs text-text-secondary">{res.resident_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={res.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-text-secondary">Hostel & Room:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {res.current_assignment?.room?.room_number
                        ? `Room ${res.current_assignment.room.room_number} (Bed ${res.current_assignment.bed?.bed_number})`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Monthly Fee:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {formatCurrency(res.monthly_fee)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-text-secondary flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {formatPhone(res.phone)}
                  </span>
                  <span className="text-blue-brand font-semibold flex items-center gap-1">
                    View Profile <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
