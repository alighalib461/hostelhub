import { supabase } from '../supabase/client'
import { AnnouncementWithDetails, Announcement } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const announcementsService = {
  async getAnnouncements(options?: {
    hostelId?: string
    targetAudience?: 'all' | 'wardens' | 'residents' | 'both'
  }): Promise<AnnouncementWithDetails[]> {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        hostel:hostels (*),
        creator:profiles (id, full_name, role)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.or(`hostel_id.eq.${options.hostelId},is_all_hostels.eq.true`)
    }

    if (options?.targetAudience) {
      query = query.or(`target_audience.eq.${options.targetAudience},target_audience.eq.both,target_audience.eq.all`)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as AnnouncementWithDetails[]
  },

  async createAnnouncement(payload: {
    title: string
    content: string
    target_audience: 'all' | 'wardens' | 'residents' | 'both'
    is_all_hostels?: boolean
    hostel_id?: string | null
    selected_hostel_ids?: string[]
  }): Promise<Announcement> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isAll = Boolean(payload.is_all_hostels)
    const primaryHostelId = isAll ? null : payload.hostel_id || null

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title: payload.title.trim(),
        content: payload.content.trim(),
        target_audience: payload.target_audience,
        is_all_hostels: isAll,
        hostel_id: primaryHostelId,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))

    // Link multi-hostel targets if specific list provided
    if (!isAll && payload.selected_hostel_ids && payload.selected_hostel_ids.length > 0) {
      const links = payload.selected_hostel_ids.map((hId) => ({
        announcement_id: announcement.id,
        hostel_id: hId,
      }))
      await supabase.from('announcement_hostels').insert(links)
    }

    return announcement as Announcement
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw new Error(formatErrorMessage(error))
  },
}
