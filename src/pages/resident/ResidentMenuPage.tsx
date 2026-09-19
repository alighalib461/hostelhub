import React, { useState, useEffect } from 'react'
import { residentsService } from '../../services/residents/residentsService'
import { menuService } from '../../services/menu/menuService'
import { ResidentWithDetails } from '../../types/models'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import {
  UtensilsCrossed,
  ZoomIn,
  Download,
  Calendar,
  Sparkles,
  Info,
  X,
  Building,
} from 'lucide-react'

export const ResidentMenuPage: React.FC = () => {
  const [resident, setResident] = useState<ResidentWithDetails | null>(null)
  const [menuUrl, setMenuUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  useEffect(() => {
    loadResidentMenu()
  }, [])

  const loadResidentMenu = async () => {
    setIsLoading(true)
    try {
      const res = await residentsService.getResidentForCurrentUser()
      setResident(res)
      if (res?.hostel_id) {
        const menuInfo = await menuService.getHostelMenu(res.hostel_id)
        setMenuUrl(menuInfo?.current_menu_image_url || null)
      }
    } catch (err) {
      console.error('Failed to load resident menu:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Hostel Food & Mess Menu
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3" />
              Mess
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Weekly and monthly meal schedule for{' '}
            <span className="font-semibold text-text-primary">
              {resident?.hostel?.name || 'your hostel'}
            </span>
          </p>
        </div>

        {menuUrl && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ZoomIn className="w-4 h-4" />}
              onClick={() => setIsZoomOpen(true)}
              className="text-xs font-semibold"
            >
              Zoom / Full View
            </Button>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="hostel-menu.jpg"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!menuUrl ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">
            No Menu Uploaded Yet
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto mb-5">
            Hostel management hasn't uploaded a mess menu photo for this hostel yet. Please check back later or contact your warden for dining schedule details.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Updated regularly by warden or hostel admin</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2 font-medium">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{resident?.hostel?.name} Official Mess Notice</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Click image to zoom
              </span>
            </div>

            {/* Menu Image Preview */}
            <div
              onClick={() => setIsZoomOpen(true)}
              className="relative group cursor-pointer bg-slate-900/5 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            >
              <img
                src={menuUrl}
                alt="Hostel Mess Menu"
                className="max-h-[600px] w-auto mx-auto object-contain rounded-xl shadow-sm group-hover:scale-[1.01] transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs rounded-xl m-2 sm:m-4">
                <div className="bg-white text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                  <ZoomIn className="w-4 h-4 text-blue-600" />
                  Click to View Fullscreen
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Meal Timings & Dining Etiquette</p>
              <p className="text-blue-800/80 text-[11px] mt-0.5">
                Breakfast: 7:00 AM – 9:30 AM • Lunch: 1:00 PM – 3:00 PM • Dinner: 8:00 PM – 10:30 PM.
                Please ensure you carry your hostel resident ID or room pass when dining.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && menuUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="flex items-center justify-between text-white pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm">
                {resident?.hostel?.name} – Mess Menu
              </span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                download="hostel-menu.jpg"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={menuUrl}
              alt="Mess Menu Fullscreen"
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
