import { supabase } from '../supabase/client'
import {
  WardenWithDetails,
  WardenInvitation,
  WardenPermissions,
  DEFAULT_WARDEN_PERMISSIONS,
  HostelWithStats,
} from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const wardensService = {
  async getWardens(hostelId?: string): Promise<WardenWithDetails[]> {
    let query = supabase
      .from('warden_assignments')
      .select(`
        *,
        profile:profiles (*),
        hostel:hostels (*)
      `)
      .order('created_at', { ascending: false })

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as WardenWithDetails[]
  },

  async getMyAssignedHostels(): Promise<{
    hostels: HostelWithStats[]
    permissionsMap: Record<string, WardenPermissions>
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { hostels: [], permissionsMap: {} }

    const { data: assignments, error } = await supabase
      .from('warden_assignments')
      .select(`
        *,
        hostel:hostels (*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) throw new Error(formatErrorMessage(error))
    if (!assignments) return { hostels: [], permissionsMap: {} }

    const permissionsMap: Record<string, WardenPermissions> = {}
    const hostels: HostelWithStats[] = []

    for (const a of assignments) {
      if (a.hostel) {
        permissionsMap[a.hostel_id] = {
          ...DEFAULT_WARDEN_PERMISSIONS,
          ...(a.permissions as Partial<WardenPermissions>),
        }

        // Fetch basic counts for the hostel
        const { count: roomsCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hostel_id', a.hostel_id)

        const { data: beds } = await supabase
          .from('beds')
          .select('id, status, rooms!inner(hostel_id)')
          .eq('rooms.hostel_id', a.hostel_id)

        const { count: residentsCount } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true })
          .eq('hostel_id', a.hostel_id)
          .eq('status', 'active')

        hostels.push({
          ...a.hostel,
          rooms_count: roomsCount || 0,
          total_beds: beds?.length || 0,
          occupied_beds: beds?.filter((b) => b.status === 'occupied').length || 0,
          available_beds: beds?.filter((b) => b.status === 'available').length || 0,
          active_residents_count: residentsCount || 0,
        })
      }
    }

    return { hostels, permissionsMap }
  },

  async inviteWarden(payload: {
    email: string
    full_name: string
    phone?: string
    hostel_ids: string[]
    permissions: WardenPermissions
  }): Promise<WardenInvitation> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    if (!payload.email.trim() || !payload.full_name.trim()) {
      throw new Error('Email and full name are required')
    }

    if (!payload.hostel_ids || payload.hostel_ids.length === 0) {
      throw new Error('At least one hostel must be assigned')
    }

    const { data, error } = await supabase
      .from('warden_invitations')
      .insert({
        email: payload.email.trim().toLowerCase(),
        full_name: payload.full_name.trim(),
        phone: payload.phone?.trim() || null,
        hostel_ids: payload.hostel_ids,
        permissions: payload.permissions as unknown as Record<string, unknown>,
        invited_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data as WardenInvitation
  },

  async getInvitations(): Promise<WardenInvitation[]> {
    const { data, error } = await supabase
      .from('warden_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(formatErrorMessage(error))
    return (data || []) as WardenInvitation[]
  },

  async getInvitationByToken(token: string): Promise<WardenInvitation | null> {
    const { data, error } = await supabase
      .from('warden_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    return data as WardenInvitation | null
  },

  async acceptInvitation(token: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('accept_warden_invitation', {
      p_token: token,
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data as { success: boolean; message: string }
  },

  async updateWardenPermissions(
    assignmentId: string,
    permissions: Partial<WardenPermissions>
  ): Promise<void> {
    const { error } = await supabase
      .from('warden_assignments')
      .update({
        permissions: permissions as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (error) throw new Error(formatErrorMessage(error))
  },

  async toggleWardenStatus(assignmentId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('warden_assignments')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (error) throw new Error(formatErrorMessage(error))
  },

  async removeWardenAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('warden_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw new Error(formatErrorMessage(error))
  },
}
