import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { announcementsService } from '../../services/announcements/announcementsService'
import { ResidentWithDetails, AnnouncementWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/formatters'
import {
  Bell,
  Search,
  Calendar,
  Building,
  Sparkles,
  Info,
  Users,
} from 'lucide-react'

export const ResidentAnnouncementsPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await residentsService.getResidentForCurrentUser()
      setResident(res)
      if (res?.hostel_id) {
        const notices = await announcementsService.getAnnouncements({
          hostelId: res.hostel_id,
          targetAudience: 'residents',
        })
        setAnnouncements(notices)
      }
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Hostel Notice Board
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 inline-flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {announcements.length} Notices
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Official announcements, notices, and updates for{' '}
            <span className="font-semibold text-text-primary">
              {resident?.hostel?.name || 'your hostel'}
            </span>
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-10 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">
            {searchQuery ? 'No matching notices found' : 'No Active Notices'}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {searchQuery
              ? 'Try searching for different keywords.'
              : 'There are currently no active notices posted for your hostel. Check back regularly for updates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:border-slate-300 transition-all p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">
                    {a.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(a.created_at)}
                    </span>
                    {a.creator && (
                      <span>
                        Posted by <strong className="text-slate-700">{a.creator.full_name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {a.is_all_hostels ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Building className="w-3 h-3" />
                      All Hostels
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Building className="w-3 h-3" />
                      Hostel Notice
                    </span>
                  )}
                </div>
              </div>

              {/* Notice Content */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {a.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
