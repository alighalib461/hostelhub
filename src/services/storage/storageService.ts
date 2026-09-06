import { supabase } from '../supabase/client'
import { formatErrorMessage } from '../../utils/errorHandling'

export const storageService = {
  async uploadFile(
    bucket: 'resident-documents' | 'resident-photos' | 'hostel-assets' | 'receipts',
    path: string,
    file: File
  ): Promise<{ path: string }> {
    // Validate file size (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.')
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return { path: data.path }
  },

  async getSignedUrl(
    bucket: 'resident-documents' | 'resident-photos' | 'hostel-assets' | 'receipts',
    path: string,
    expiresIn = 3600
  ): Promise<string | null> {
    if (!path) return null

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      console.warn('Error generating signed URL:', error)
      return null
    }

    return data?.signedUrl || null
  },
}
