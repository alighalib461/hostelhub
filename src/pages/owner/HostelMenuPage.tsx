import React, { useState, useEffect, useRef } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { menuService, HostelMenuInfo } from '../../services/menu/menuService'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/formatters'
import {
  UtensilsCrossed,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building,
  Image as ImageIcon,
} from 'lucide-react'

export const HostelMenuPage: React.FC = () => {
  const { hostels, selectedHostelId, selectedHostel } = useHostelContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [menuInfo, setMenuInfo] = useState<HostelMenuInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Preview modal state for zoom
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const activeHostelId =
    selectedHostelId !== 'all' ? selectedHostelId : hostels.length > 0 ? hostels[0].id : ''

  useEffect(() => {
    if (activeHostelId) {
      loadMenu(activeHostelId)
    }
  }, [activeHostelId])

  const loadMenu = async (hostelId: string) => {
    setIsLoading(true)
    try {
      const data = await menuService.getHostelMenu(hostelId)
      setMenuInfo(data)
    } catch (err) {
      console.error('Failed to load hostel menu:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]

    setIsUploading(true)
    setUploadError(null)
    setSuccessMsg(null)

    try {
      await menuService.uploadAndSetMenuImage(activeHostelId, file)
      setSuccessMsg('Hostel menu image updated successfully! Residents can now view the latest menu.')
      await loadMenu(activeHostelId)
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: unknown) {
      setUploadError((err as { message?: string })?.message || 'Failed to upload menu image.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Hostel Mess Menu
          </h2>
          <p className="text-xs text-slate-500">
            Upload and maintain the current single weekly/monthly mess menu image for{' '}
            <strong>{selectedHostel ? selectedHostel.name : 'your hostel'}</strong>
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="primary"
            size="md"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
            disabled={!activeHostelId}
          >
            {menuInfo?.current_menu_image_url ? 'Replace Menu Image' : 'Upload Menu Image'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Menu Display Card */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl w-full" />
      ) : !menuInfo?.current_menu_image_url ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#172033]">No menu has been uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Upload a clear photo or digital poster of your hostel&apos;s food menu (JPG, PNG, WebP up to 10MB). Residents will be able to view it instantly in their portal.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Camera className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            Upload Menu Image
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#172033]">{menuInfo.hostel_name} Current Menu</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>

            {menuInfo.current_menu_updated_at && (
              <p className="text-[11px] text-slate-400">
                Last updated: {formatDate(menuInfo.current_menu_updated_at)}
              </p>
            )}
          </div>

          {/* Menu Image Container */}
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity max-h-[75vh]"
          >
            <img
              src={menuInfo.current_menu_image_url}
              alt="Hostel Menu"
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>Tap image to expand in fullscreen viewer</span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              className="text-xs h-8"
            >
              Replace Image
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`${menuInfo?.hostel_name || 'Hostel'} — Current Menu Image`}
        maxWidth="lg"
      >
        {menuInfo?.current_menu_image_url && (
          <div className="space-y-4 pt-1">
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-2">
              <img
                src={menuInfo.current_menu_image_url}
                alt="Fullscreen Menu"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="md" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
