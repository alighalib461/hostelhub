import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

export interface CapturedDocument {
  file: File
  previewUrl: string
}

async function photoToFile(photo: Photo, filenamePrefix = 'doc'): Promise<CapturedDocument> {
  let blob: Blob

  if (photo.webPath) {
    const res = await fetch(photo.webPath)
    blob = await res.blob()
  } else if (photo.base64String) {
    const byteCharacters = atob(photo.base64String)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    blob = new Blob([byteArray], { type: `image/${photo.format || 'jpeg'}` })
  } else if (photo.dataUrl) {
    const res = await fetch(photo.dataUrl)
    blob = await res.blob()
  } else {
    throw new Error('No image data was received from the camera.')
  }

  const extension = photo.format || 'jpg'
  const mimeType = blob.type || `image/${extension}`
  const file = new File([blob], `${filenamePrefix}-${Date.now()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  })

  // Create or reuse object URL for preview
  const previewUrl = photo.webPath || URL.createObjectURL(blob)

  return { file, previewUrl }
}

export const cameraService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform()
  },

  async checkCameraPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Camera.checkPermissions()
        return status.camera === 'granted'
      }
      return true
    } catch {
      return true
    }
  },

  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Camera.requestPermissions({ permissions: ['camera'] })
        return status.camera === 'granted'
      }
      return true
    } catch {
      return true
    }
  },

  async capturePhoto(filenamePrefix = 'cnic'): Promise<CapturedDocument> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        webUseInput: false,
      })

      return await photoToFile(photo, filenamePrefix)
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || ''
      if (
        errorMsg.toLowerCase().includes('cancel') ||
        errorMsg.toLowerCase().includes('user cancelled')
      ) {
        throw new Error('CAMERA_CANCELLED')
      }
      if (
        errorMsg.toLowerCase().includes('permission') ||
        errorMsg.toLowerCase().includes('denied')
      ) {
        throw new Error('CAMERA_PERMISSION_DENIED')
      }
      throw new Error(errorMsg || 'Failed to capture photo from camera.')
    }
  },

  async pickFromGallery(filenamePrefix = 'cnic'): Promise<CapturedDocument> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      })

      return await photoToFile(photo, filenamePrefix)
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || ''
      if (
        errorMsg.toLowerCase().includes('cancel') ||
        errorMsg.toLowerCase().includes('user cancelled')
      ) {
        throw new Error('GALLERY_CANCELLED')
      }
      throw new Error(errorMsg || 'Failed to choose image from gallery.')
    }
  },
}
