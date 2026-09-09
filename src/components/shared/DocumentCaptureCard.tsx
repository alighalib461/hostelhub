import React, { useState, useEffect, useRef } from 'react'
import { cameraService } from '../../services/camera/cameraService'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import {
  Camera,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Maximize2,
  FileText,
  Sparkles,
} from 'lucide-react'

export interface DocumentCaptureCardProps {
  label: string
  description?: string
  file: File | null
  onFileChange: (file: File | null) => void
  required?: boolean
  filenamePrefix?: string
  disabled?: boolean
  maxSizeMB?: number
  aspectRatio?: 'card' | 'square' | 'auto'
}

export const DocumentCaptureCard: React.FC<DocumentCaptureCardProps> = ({
  label,
  description,
  file,
  onFileChange,
  required = false,
  filenamePrefix = 'cnic',
  disabled = false,
  maxSizeMB = 10,
  aspectRatio = 'card',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempCapture, setTempCapture] = useState<{ file: File; previewUrl: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview URL whenever external `file` changes
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const validateAndSetFile = (newFile: File) => {
    setError(null)
    if (newFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum allowed ${maxSizeMB}MB limit.`)
      return false
    }
    if (!newFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).')
      return false
    }
    onFileChange(newFile)
    return true
  }

  const handleCapturePhoto = async () => {
    if (disabled || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const result = await cameraService.capturePhoto(filenamePrefix)
      if (validateAndSetFile(result.file)) {
        setTempCapture(result)
        setIsModalOpen(true) // Show immediate confirm / retake modal
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || ''
      if (msg === 'CAMERA_CANCELLED') {
        // User voluntarily backed out of camera
      } else if (msg === 'CAMERA_PERMISSION_DENIED') {
        setError(
          'Camera access was denied. Please allow camera permissions in device settings, or select an image from your gallery.'
        )
      } else {
        setError(msg || 'Unable to open camera. You can choose an image from gallery instead.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePickFromGallery = async () => {
    if (disabled || isLoading) return
    setError(null)

    // In native mobile app, try Capacitor gallery picker; if web or fallback, trigger file input
    if (cameraService.isNative()) {
      setIsLoading(true)
      try {
        const result = await cameraService.pickFromGallery(filenamePrefix)
        validateAndSetFile(result.file)
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || ''
        if (msg === 'GALLERY_CANCELLED') {
          // User closed picker
        } else {
          // Fallback to web input if native picker had an issue
          fileInputRef.current?.click()
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
    // Reset so selecting the same file triggers onChange
    e.target.value = ''
  }

  const handleRemove = () => {
    onFileChange(null)
    setPreviewUrl(null)
    setTempCapture(null)
    setIsModalOpen(false)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2">
      {/* Hidden Web File Input for gallery upload fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Label and Helper Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-brand shrink-0" />
          <span className="text-xs font-bold text-text-primary">
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </div>
        {file && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-text-secondary">{description}</p>}

      {/* Error Message */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-tight">{error}</div>
        </div>
      )}

      {/* Main Card State */}
      {!file ? (
        /* Empty State: Capture or Pick buttons */
        <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 sm:p-5 text-center bg-slate-50/60 transition-all space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-brand flex items-center justify-center mx-auto shadow-sm">
            <Camera className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-text-primary">Capture or Upload {label}</p>
            <p className="text-[11px] text-text-secondary">
              Take a clear, well-lit photo or choose from your gallery
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCapturePhoto}
              isLoading={isLoading}
              disabled={disabled}
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto text-xs font-semibold px-4"
            >
              Take Photo
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePickFromGallery}
              disabled={disabled || isLoading}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto text-xs font-medium px-4"
            >
              Choose from Gallery
            </Button>
          </div>
        </div>
      ) : (
        /* Captured / Selected State: Preview with Retake & Replace Controls */
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-3 space-y-3">
          {/* Image Preview Container */}
          <div
            className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center group ${
              aspectRatio === 'card'
                ? 'aspect-[16/10]'
                : aspectRatio === 'square'
                ? 'aspect-square max-w-[200px] mx-auto'
                : 'max-h-56'
            }`}
          >
            {previewUrl && (
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              />
            )}

            {/* Click to Enlarge Overlay */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-sm transition-all opacity-90 group-hover:opacity-100 flex items-center gap-1"
              title="View full size"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* File Info & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate">{file.name}</p>
              <p className="text-[10px] text-text-secondary">{formatFileSize(file.size)}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCapturePhoto}
                disabled={disabled || isLoading}
                leftIcon={<RotateCcw className="w-3 h-3" />}
                className="text-[11px] h-8 px-2.5"
                title="Retake photo using camera"
              >
                Retake
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePickFromGallery}
                disabled={disabled || isLoading}
                leftIcon={<Upload className="w-3 h-3" />}
                className="text-[11px] h-8 px-2.5 text-slate-600 hover:text-slate-900"
                title="Choose a different image from gallery"
              >
                Replace
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isLoading}
                className="text-[11px] h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview & Confirmation Modal */}
      {isModalOpen && previewUrl && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Confirm ${label}`}
          description="Check that the details on the document are readable and clear."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[65vh]">
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-auto max-h-[65vh] object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-semibold text-text-primary">{file?.name}</span>
                <span className="text-text-secondary ml-2">
                  ({file ? formatFileSize(file.size) : ''})
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Resolution
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsModalOpen(false)
                  handleCapturePhoto()
                }}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retake Photo
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(false)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Photo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
