import { supabase } from '../supabase/client'
import { formatErrorMessage } from '../../utils/errorHandling'

export type StorageBucket =
  | 'avatars'
  | 'resident-documents'
  | 'resident-photos'
  | 'hostel-assets'
  | 'receipts'

export const storageService = {
  async uploadFile(
    bucket: StorageBucket,
    path: string,
    file: File
  ): Promise<{ path: string; publicUrl?: string }> {
    // Validate file size (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.')
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

    if (error) throw new Error(formatErrorMessage(error))

    let publicUrl: string | undefined
    if (bucket === 'avatars' || bucket === 'hostel-assets') {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      publicUrl = urlData.publicUrl
    }

    return { path: data.path, publicUrl }
  },

  getPublicUrl(bucket: StorageBucket, path: string): string | null {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl || null
  },

  async getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn = 3600
  ): Promise<string | null> {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      console.warn('Error generating signed URL:', error)
      return null
    }

    return data?.signedUrl || null
  },
}
