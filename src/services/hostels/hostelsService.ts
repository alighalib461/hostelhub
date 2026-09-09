import { supabase } from '../supabase/client'
import { Hostel, HostelWithStats } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const hostelsService = {
  async getHostels(): Promise<HostelWithStats[]> {
    const { data: hostels, error } = await supabase
      .from('hostels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(formatErrorMessage(error))
    if (!hostels) return []

    // Fetch stats for each hostel
    const hostelsWithStats: HostelWithStats[] = await Promise.all(
      hostels.map(async (h) => {
        // Rooms count
        const { count: roomsCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hostel_id', h.id)

        // Beds info
        const { data: beds } = await supabase
          .from('beds')
          .select('id, status, rooms!inner(hostel_id)')
          .eq('rooms.hostel_id', h.id)

        const totalBeds = beds?.length || 0
        const occupiedBeds = beds?.filter((b) => b.status === 'occupied').length || 0
        const availableBeds = beds?.filter((b) => b.status === 'available').length || 0

        // Active residents count
        const { count: residentsCount } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true })
          .eq('hostel_id', h.id)
          .eq('status', 'active')

        // Month collection
        const currentMonth = new Date().toISOString().slice(0, 7)
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('hostel_id', h.id)
          .eq('status', 'paid')
          .gte('payment_date', `${currentMonth}-01`)

        const monthlyCollection = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

        return {
          ...h,
          rooms_count: roomsCount || 0,
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          available_beds: availableBeds,
          active_residents_count: residentsCount || 0,
          monthly_collection: monthlyCollection,
        }
      })
    )

    return hostelsWithStats
  },

  async getHostelById(id: string): Promise<HostelWithStats | null> {
    const { data, error } = await supabase
      .from('hostels')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return null

    // Fetch stats
    const { count: roomsCount } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('hostel_id', id)

    const { data: beds } = await supabase
      .from('beds')
      .select('id, status, rooms!inner(hostel_id)')
      .eq('rooms.hostel_id', id)

    const totalBeds = beds?.length || 0
    const occupiedBeds = beds?.filter((b) => b.status === 'occupied').length || 0
    const availableBeds = beds?.filter((b) => b.status === 'available').length || 0

    const { count: residentsCount } = await supabase
      .from('residents')
      .select('*', { count: 'exact', head: true })
      .eq('hostel_id', id)
      .eq('status', 'active')

    return {
      ...data,
      rooms_count: roomsCount || 0,
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      available_beds: availableBeds,
      active_residents_count: residentsCount || 0,
    }
  },

  async createHostel(hostel: {
    name: string
    address: string
    phone?: string
    logo_path?: string
  }): Promise<Hostel> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in as an owner to create a hostel.')

    const { data, error } = await supabase
      .from('hostels')
      .insert({
        owner_id: user.id,
        name: hostel.name,
        address: hostel.address,
        phone: hostel.phone || null,
        logo_path: hostel.logo_path || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async updateHostel(id: string, updates: Partial<Hostel>): Promise<Hostel> {
    const { data, error } = await supabase
      .from('hostels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async deleteHostel(id: string): Promise<void> {
    const { error } = await supabase
      .from('hostels')
      .delete()
      .eq('id', id)

    if (error) throw new Error(formatErrorMessage(error))
  },

  async getPublicHostelInfo(id: string): Promise<Hostel | null> {
    const { data, error } = await supabase.rpc('get_public_hostel_info', {
      p_hostel_id: id,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data as Hostel | null
  },
}

