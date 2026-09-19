import { supabase } from '../supabase/client'
import { storageService } from '../storage/storageService'
import { formatErrorMessage } from '../../utils/errorHandling'

export interface HostelMenuInfo {
  hostel_id: string
  hostel_name: string
  current_menu_image_url: string | null
  current_menu_updated_at: string | null
  current_menu_updated_by?: string | null
}

export const menuService = {
  async getHostelMenu(hostelId: string): Promise<HostelMenuInfo | null> {
    if (!hostelId || hostelId === 'all') return null

    const { data, error } = await supabase
      .from('hostels')
      .select('id, name, current_menu_image_url, current_menu_updated_at, current_menu_updated_by')
      .eq('id', hostelId)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return null

    return {
      hostel_id: data.id,
      hostel_name: data.name,
      current_menu_image_url: data.current_menu_image_url,
      current_menu_updated_at: data.current_menu_updated_at,
      current_menu_updated_by: data.current_menu_updated_by,
    }
  },

  async uploadAndSetMenuImage(hostelId: string, imageFile: File): Promise<string> {
    if (!hostelId) throw new Error('Hostel ID is required')

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(imageFile.type)) {
      throw new Error('Please upload a valid image file (JPG, PNG, or WebP).')
    }

    // Validate size (< 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Menu image file size exceeds 10MB limit.')
    }

    const ext = imageFile.name.split('.').pop() || 'jpg'
    const storagePath = `menus/${hostelId}_menu_${Date.now()}.${ext}`

    // Upload to hostel-assets bucket
    const uploadResult = await storageService.uploadFile('hostel-assets', storagePath, imageFile)
    const imageUrl = uploadResult.publicUrl || storageService.getPublicUrl('hostel-assets', uploadResult.path) || uploadResult.path

    // Update hostel row via RPC or direct update
    const { error } = await supabase.rpc('update_hostel_menu', {
      p_hostel_id: hostelId,
      p_image_url: imageUrl,
    })

    if (error) {
      // Fallback direct update
      const { error: directError } = await supabase
        .from('hostels')
        .update({
          current_menu_image_url: imageUrl,
          current_menu_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', hostelId)

      if (directError) throw new Error(formatErrorMessage(directError))
    }

    return imageUrl
  },
}
